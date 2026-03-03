import {
    AudioDataEvent,
    ButterChurnAudioDataDto,
    GenericEvent,
    type InitiateStreamEvent,
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

let analyserNormal: AnalyserNode | null = null;
let analyserButterChurn: AnalyserNode | null = null;
let analyserButterChurnL: AnalyserNode | null = null;
let analyserButterChurnR: AnalyserNode | null = null;

// Stream ID - will be set when InitiateStreamEvent is received
// Note: Stream IDs become invalid after hot-reload, so we request a new one from background when needed
let initiateStreamId: string | null = null;

// Dynamic FPS matching - capture rate adapts to render rate
let captureInterval = 17; // Default 60fps (1000/60 ≈ 17ms)
let targetFps = 60;
let captureTimeoutId: ReturnType<typeof setTimeout> | null = null;

// Stream recovery backoff
const MAX_STREAM_RETRIES = 5;
const BASE_RETRY_DELAY_MS = 500;
let streamRetryCount = 0;
let retryTimeoutId: ReturnType<typeof setTimeout> | null = null;

chrome.runtime.onMessage.addListener((message: GenericEvent | StartStreamEvent | InitiateStreamEvent | SetFpsEvent) => {
    // Only process messages targeted at offscreen
    if (message.target !== messageTarget.offscreen) {
        return;
    }

    switch (message.action) {
        case messageAction.toggleFullScreen: {
            const fullScreenEventMessage = new GenericEvent(messageTarget.animation, messageAction.toggleFullScreen);
            try {
                chrome.runtime.sendMessage(fullScreenEventMessage.toMessage());
            } catch (_e) {
                // Receiving end may not exist if animation window is closed
            }
            break;
        }
        case messageAction.startStream: {
            const startStreamMessage = message as StartStreamEvent;
            currentStreamType = startStreamMessage.streamType;
            startStream();
            break;
        }
        case messageAction.initiateStream: {
            const initiateStreamMessage = message as InitiateStreamEvent;
            initiateStreamId = initiateStreamMessage.streamId;
            initiateStream(initiateStreamId).then(() => {
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
async function initiateStream(streamId: string) {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                mandatory: {
                    chromeMediaSource: 'tab',
                    chromeMediaSourceId: streamId,
                },
            } as MediaTrackConstraints,
        });
        audioContext = new AudioContext();

        const source = audioContext.createMediaStreamSource(stream);
        // Create the normal analyser
        analyserNormal = audioContext.createAnalyser();
        analyserNormal.fftSize = numSamplesNormal;
        source.connect(analyserNormal);
        // Connect the normal analyser to the destination
        analyserNormal.connect(audioContext.destination);

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
    } catch (error) {
        // Clear the invalid stream ID
        initiateStreamId = null;
        streamRetryCount++;
        if (streamRetryCount <= MAX_STREAM_RETRIES) {
            const delay = BASE_RETRY_DELAY_MS * 2 ** (streamRetryCount - 1);
            console.warn(`Stream recovery attempt ${streamRetryCount}/${MAX_STREAM_RETRIES}, retrying in ${delay}ms`);
            // Request a new stream ID from background script with backoff
            retryTimeoutId = setTimeout(() => {
                retryTimeoutId = null;
                const requestNewStream = new GenericEvent(messageTarget.background, messageAction.initiateStream);
                try {
                    chrome.runtime.sendMessage(requestNewStream.toMessage());
                } catch (_e) {
                    // Receiving end may not exist
                }
            }, delay);
        } else {
            console.error(`Stream recovery failed after ${MAX_STREAM_RETRIES} attempts, giving up`);
        }
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
            if (initiateStreamId !== null) {
                try {
                    await stopStream();
                    await initiateStream(initiateStreamId);
                } catch {
                    // The error handler in initiateStream will request a new ID
                    return;
                }
            } else {
                // Request a new stream ID from background script with backoff
                streamRetryCount++;
                if (streamRetryCount > MAX_STREAM_RETRIES) {
                    console.error(`Stream recovery failed after ${MAX_STREAM_RETRIES} attempts, giving up`);
                    return;
                }
                const delay = BASE_RETRY_DELAY_MS * 2 ** (streamRetryCount - 1);
                console.warn(`Stream recovery attempt ${streamRetryCount}/${MAX_STREAM_RETRIES}, retrying in ${delay}ms`);
                retryTimeoutId = setTimeout(() => {
                    retryTimeoutId = null;
                    const requestNewStream = new GenericEvent(messageTarget.background, messageAction.initiateStream);
                    try {
                        chrome.runtime.sendMessage(requestNewStream.toMessage());
                    } catch (_e) {
                        // Receiving end may not exist
                    }
                }, delay);
                return;
            }
        }
        const captureTimestamp = Date.now(); // Capture timestamp as early as possible (using Date.now() for cross-context synchronization)

        if (currentStreamType === streamType.normal && analyserNormal !== null) {
            analyserNormal.getByteFrequencyData(normalDataArray);

            const data = Array.from(normalDataArray);
            const audioData = new NormalAudioDataDto(data, captureTimestamp);
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

            const data = Array.from(butterChurnDataArray);
            const dataL = Array.from(butterChurnDataArrayL);
            const dataR = Array.from(butterChurnDataArrayR);
            const audioData = new ButterChurnAudioDataDto(data, dataL, dataR, captureTimestamp);
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
    if (retryTimeoutId !== null) {
        clearTimeout(retryTimeoutId);
        retryTimeoutId = null;
    }
    if (captureTimeoutId !== null) {
        clearTimeout(captureTimeoutId);
        captureTimeoutId = null;
    }
    if (stream) {
        for (const track of stream.getTracks()) {
            track.stop();
        }
    }
    if (audioContext) {
        await audioContext.close();
    }
}
