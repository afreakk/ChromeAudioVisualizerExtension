import {
    AudioDataEvent,
    ButterChurnAudioDataDto,
    captureSource,
    type GenericEvent,
    InitiateStreamEvent,
    messageAction,
    messageTarget,
    NormalAudioDataDto,
    type SetFpsEvent,
    type StartStreamEvent,
    streamType,
} from '@/src/utils/eventMessage';

// Extend Window interface for offscreen-specific properties
declare global {
    interface Window {
        captureIsActive: boolean;
    }
}

let currentStreamType: streamType | null = null;
let stream: MediaStream | null = null;
let audioContext: AudioContext | null = null;

const numSamplesNormal = 2048;
const numSamplesButterChurn = 1024;

// Pre-allocated buffers to avoid per-frame GC pressure
const normalDataArray = new Uint8Array(numSamplesNormal / 4);
const butterChurnDataArray = new Uint8Array(numSamplesButterChurn);
const butterChurnDataArrayL = new Uint8Array(numSamplesButterChurn);
const butterChurnDataArrayR = new Uint8Array(numSamplesButterChurn);

// Pre-allocated plain arrays for message serialization (avoids Array.from() per frame)
const normalPlainArray: number[] = new Array(numSamplesNormal / 4).fill(0);
const butterChurnPlainArray: number[] = new Array(numSamplesButterChurn).fill(0);
const butterChurnPlainArrayL: number[] = new Array(numSamplesButterChurn).fill(0);
const butterChurnPlainArrayR: number[] = new Array(numSamplesButterChurn).fill(0);

function copyToPlainArray(src: Uint8Array, dst: number[]): void {
    for (let i = 0; i < src.length; i++) {
        dst[i] = src[i];
    }
}

let analyserNormal: AnalyserNode | null = null;
let analyserButterChurn: AnalyserNode | null = null;
let analyserButterChurnL: AnalyserNode | null = null;
let analyserButterChurnR: AnalyserNode | null = null;

// Stream ID - will be set when InitiateStreamEvent is received
// Note: Stream IDs become invalid after hot-reload, so we request a new one from background when needed
let initiateStreamId: string | null = null;
let lastCaptureSource: captureSource = captureSource.tab;

// Dynamic FPS matching - capture rate adapts to render rate
let captureInterval = 17; // Default 60fps (1000/60 ≈ 17ms)
let targetFps = 60;
let captureTimeoutId: ReturnType<typeof setTimeout> | null = null;

// Stream recovery backoff
const MAX_STREAM_RETRIES = 5;
const BASE_RETRY_DELAY_MS = 500;
let streamRetryCount = 0;
let retryTimeoutId: ReturnType<typeof setTimeout> | null = null;
let recoveryState: 'idle' | 'pending' = 'idle';

function scheduleRecovery(): void {
    if (recoveryState === 'pending') {
        return;
    }

    recoveryState = 'pending';
    streamRetryCount++;

    if (streamRetryCount > MAX_STREAM_RETRIES) {
        recoveryState = 'idle';
        console.error(`Stream recovery failed after ${MAX_STREAM_RETRIES} attempts, giving up`);
        return;
    }

    const delay = BASE_RETRY_DELAY_MS * 2 ** (streamRetryCount - 1);
    console.warn(`Stream recovery attempt ${streamRetryCount}/${MAX_STREAM_RETRIES}, retrying in ${delay}ms`);

    retryTimeoutId = setTimeout(() => {
        recoveryState = 'idle';
        retryTimeoutId = null;
        const requestNewStream = new InitiateStreamEvent(
            messageTarget.background,
            messageAction.initiateStream,
            '',
            lastCaptureSource,
        );
        try {
            chrome.runtime.sendMessage(requestNewStream.toMessage());
        } catch (_e) {
            // Receiving end may not exist
        }
    }, delay);
}

chrome.runtime.onMessage.addListener((message: GenericEvent | StartStreamEvent | InitiateStreamEvent | SetFpsEvent) => {
    // Only process messages targeted at offscreen
    if (message.target !== messageTarget.offscreen) {
        return;
    }

    switch (message.action) {
        case messageAction.startStream: {
            const startStreamMessage = message as StartStreamEvent;
            currentStreamType = startStreamMessage.streamType;
            startStream();
            break;
        }
        case messageAction.initiateStream: {
            const initiateStreamMessage = message as InitiateStreamEvent;
            initiateStreamId = initiateStreamMessage.streamId;
            lastCaptureSource = initiateStreamMessage.source ?? captureSource.tab;
            initiateStream(initiateStreamId, lastCaptureSource).then(() => {
                // After successfully initiating stream, start the capture loop if we have a stream type
                if (currentStreamType !== null) {
                    startStream();
                }
            });
            break;
        }
        case messageAction.stopStream: {
            stopStream();
            break;
        }
        case messageAction.setFps: {
            const fpsMessage = message as SetFpsEvent;
            targetFps = fpsMessage.fps;
            // Calculate capture interval from FPS (with small buffer to ensure fresh data)
            captureInterval = Math.round(1000 / targetFps);
            // Clamp to reasonable range (8ms = 120fps max, 33ms = 30fps min)
            captureInterval = Math.max(8, Math.min(33, captureInterval));
            break;
        }
    }
});
async function initiateStream(streamId: string, streamSource: captureSource) {
    try {
        if (streamSource === captureSource.microphone) {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } else {
            stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    mandatory: {
                        chromeMediaSource: 'tab',
                        chromeMediaSourceId: streamId,
                    },
                } as MediaTrackConstraints,
            });
        }
        audioContext = new AudioContext();

        const source = audioContext.createMediaStreamSource(stream);
        // Create the normal analyser
        analyserNormal = audioContext.createAnalyser();
        analyserNormal.fftSize = numSamplesNormal;
        source.connect(analyserNormal);
        // Tab capture mutes the original tab audio, so we route it back to the speakers.
        // Microphone input isn't muted by the OS — routing it would cause feedback.
        if (streamSource !== captureSource.microphone) {
            analyserNormal.connect(audioContext.destination);
        }

        // Create the butterchurn analysers
        analyserButterChurn = audioContext.createAnalyser();
        analyserButterChurn.smoothingTimeConstant = 0.0;
        analyserButterChurn.fftSize = numSamplesButterChurn;

        analyserButterChurnL = audioContext.createAnalyser();
        analyserButterChurnL.smoothingTimeConstant = 0.0;
        analyserButterChurnL.fftSize = numSamplesButterChurn;

        analyserButterChurnR = audioContext.createAnalyser();
        analyserButterChurnR.smoothingTimeConstant = 0.0;
        analyserButterChurnR.fftSize = numSamplesButterChurn;

        source.connect(analyserButterChurn);

        const splitter = audioContext.createChannelSplitter(2);

        source.connect(splitter);
        splitter.connect(analyserButterChurnL, 0);
        splitter.connect(analyserButterChurnR, 1);
        window.captureIsActive = true;
        streamRetryCount = 0; // Reset on success
        recoveryState = 'idle';
        // Cancel any recovery re-init still pending from an earlier failed attempt.
        // On a cold start the animation window's eager `start-stream` can race ahead
        // of background's `initiate-stream` and arm a recovery timer; once this real
        // init succeeds that timer is moot and would otherwise fire a redundant
        // re-capture (~500ms later) and blip the audio.
        if (retryTimeoutId !== null) {
            clearTimeout(retryTimeoutId);
            retryTimeoutId = null;
        }
    } catch (error) {
        // Clear the invalid stream ID
        initiateStreamId = null;
        scheduleRecovery();
        throw error; // Re-throw so caller knows it failed
    }
}

async function startStream() {
    // Clear any existing capture loop before starting a new one
    if (captureTimeoutId !== null) {
        clearTimeout(captureTimeoutId);
        captureTimeoutId = null;
    }

    const updateAudioDataEvent = async () => {
        if (!window.captureIsActive) {
            const savedStreamId = initiateStreamId;
            const savedSource = lastCaptureSource;
            const canRetryLocally = savedSource === captureSource.microphone || savedStreamId !== null;
            if (canRetryLocally) {
                try {
                    await stopStream();
                    await initiateStream(savedStreamId ?? '', savedSource);
                } catch {
                    // initiateStream's error handler schedules recovery
                    return;
                }
            } else {
                scheduleRecovery();
                return;
            }
        }
        const captureTimestamp = Date.now(); // Capture timestamp as early as possible (using Date.now() for cross-context synchronization)

        if (currentStreamType === streamType.normal && analyserNormal !== null) {
            analyserNormal.getByteFrequencyData(normalDataArray);

            copyToPlainArray(normalDataArray, normalPlainArray);
            const audioData = new NormalAudioDataDto(normalPlainArray, captureTimestamp);
            const audioDataMessage = new AudioDataEvent(
                messageTarget.animation,
                messageAction.updateAudioData,
                audioData,
            );
            try {
                chrome.runtime.sendMessage(audioDataMessage.toMessage());
            } catch (_e) {
                // Receiving end may not exist if animation window is closed
            }
        } else if (
            currentStreamType === streamType.butterChurn &&
            analyserButterChurn !== null &&
            analyserButterChurnL !== null &&
            analyserButterChurnR !== null
        ) {
            analyserButterChurn.getByteTimeDomainData(butterChurnDataArray);
            analyserButterChurnL.getByteTimeDomainData(butterChurnDataArrayL);
            analyserButterChurnR.getByteTimeDomainData(butterChurnDataArrayR);

            copyToPlainArray(butterChurnDataArray, butterChurnPlainArray);
            copyToPlainArray(butterChurnDataArrayL, butterChurnPlainArrayL);
            copyToPlainArray(butterChurnDataArrayR, butterChurnPlainArrayR);
            const audioData = new ButterChurnAudioDataDto(
                butterChurnPlainArray,
                butterChurnPlainArrayL,
                butterChurnPlainArrayR,
                captureTimestamp,
            );
            const audioDataMessage = new AudioDataEvent(
                messageTarget.animation,
                messageAction.updateAudioData,
                audioData,
            );
            try {
                chrome.runtime.sendMessage(audioDataMessage.toMessage());
            } catch (_e) {
                // Receiving end may not exist if animation window is closed
            }
        }

        // Dynamic capture rate - matches render FPS
        captureTimeoutId = setTimeout(updateAudioDataEvent, captureInterval);
    };

    updateAudioDataEvent();
}

async function stopStream() {
    window.captureIsActive = false;
    initiateStreamId = null;
    streamRetryCount = 0;
    recoveryState = 'idle';
    if (retryTimeoutId !== null) {
        clearTimeout(retryTimeoutId);
        retryTimeoutId = null;
    }
    if (captureTimeoutId !== null) {
        clearTimeout(captureTimeoutId);
        captureTimeoutId = null;
    }
    // Null globals synchronously, then await close() on a local ref. If a new
    // initiateStream runs while close() is pending, it must not see its fresh
    // globals overwritten when we resume.
    const oldStream = stream;
    const oldContext = audioContext;
    stream = null;
    audioContext = null;
    analyserNormal = null;
    analyserButterChurn = null;
    analyserButterChurnL = null;
    analyserButterChurnR = null;
    if (oldStream) {
        for (const track of oldStream.getTracks()) {
            track.stop();
        }
    }
    if (oldContext) {
        await oldContext.close();
    }
}
