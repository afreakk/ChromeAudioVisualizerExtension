import {
    StartStreamEvent,
    GenericEvent,
    AudioDataEvent,
    NormalAudioDataDto,
    ButterChurnAudioDataDto,
    messageAction,
    messageTarget,
    streamType,
    InitiateStreamEvent,
    SetFpsEvent,
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

let numSamplesNormal = 2048;
let numSamplesButterChurn = 1024;
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

chrome.runtime.onMessage.addListener((message: GenericEvent | StartStreamEvent | InitiateStreamEvent | SetFpsEvent) => {
    
    // Only process messages targeted at offscreen
    if (message.target !== messageTarget.offscreen) {
        return;
    }

    switch (message.action) {
        case messageAction.toggleFullScreen: {
            const fullScreenEventMessage = new GenericEvent(messageTarget.animation, messageAction.toggleFullScreen);
            chrome.runtime.sendMessage(fullScreenEventMessage.toMessage());
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
            initiateStream(initiateStreamId);
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
            console.log(`FPS update: target=${targetFps}fps, captureInterval=${captureInterval}ms`);
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
    } catch (error) {
        console.error('Error initiating stream with stream ID:', error);
        // Clear the invalid stream ID
        initiateStreamId = null;
        // Request a new stream ID from background script
        const requestNewStream = new GenericEvent(
            messageTarget.background,
            messageAction.initiateStream
        );
        chrome.runtime.sendMessage(requestNewStream.toMessage());
        throw error; // Re-throw so caller knows it failed
    }
}

async function startStream() {
    const updateAudioDataEvent = async () => {
        if (!window.captureIsActive) {
            if (initiateStreamId !== null) {
                console.log('Restoring stream with stored initiateStreamId', initiateStreamId);
                try {
                    await stopStream();
                    await initiateStream(initiateStreamId);
                } catch (error) {
                    console.log('Failed to restore with stored stream ID, waiting for new stream ID from background');
                    // The error handler in initiateStream will request a new ID
                    // We'll wait for the InitiateStreamEvent message to arrive
                    return;
                }
            } else {
                console.log('No initiateStreamId, requesting new stream from background');
                // Request a new stream ID from background script
                const requestNewStream = new GenericEvent(
                    messageTarget.background,
                    messageAction.initiateStream
                );
                chrome.runtime.sendMessage(requestNewStream.toMessage());
                return;
            }
        }
        const captureTimestamp = Date.now(); // Capture timestamp as early as possible (using Date.now() for cross-context synchronization)
        
        if (
            currentStreamType === streamType.normal &&
            analyserNormal !== null
        ) {
            const dataArray = new Uint8Array(numSamplesNormal / 4);
            analyserNormal.getByteFrequencyData(dataArray);

            const data = Array.from(dataArray);
            const audioData = new NormalAudioDataDto(data, captureTimestamp);
            const audioDataMessage = new AudioDataEvent(
                messageTarget.animation,
                messageAction.updateAudioData,
                audioData
            );
            chrome.runtime.sendMessage(audioDataMessage.toMessage());
        } else if (
            currentStreamType === streamType.butterChurn &&
            analyserButterChurn !== null &&
            analyserButterChurnL !== null &&
            analyserButterChurnR !== null
        ) {
            const dataArray = new Uint8Array(numSamplesButterChurn);
            const dataArrayL = new Uint8Array(numSamplesButterChurn);
            const dataArrayR = new Uint8Array(numSamplesButterChurn);
            analyserButterChurn.getByteTimeDomainData(dataArray);
            analyserButterChurnL.getByteTimeDomainData(dataArrayL);
            analyserButterChurnR.getByteTimeDomainData(dataArrayR);

            const data = Array.from(dataArray);
            const dataL = Array.from(dataArrayL);
            const dataR = Array.from(dataArrayR);
            const audioData = new ButterChurnAudioDataDto(data, dataL, dataR, captureTimestamp);
            const audioDataMessage = new AudioDataEvent(
                messageTarget.animation,
                messageAction.updateAudioData,
                audioData
            );
            chrome.runtime.sendMessage(audioDataMessage.toMessage());
        }

        // Dynamic capture rate - matches render FPS (updated every 2 seconds)
        setTimeout(updateAudioDataEvent, captureInterval);
    };

    updateAudioDataEvent();
}

async function stopStream() {
    window.captureIsActive = false;
    initiateStreamId = null;
    if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        console.log('Stream stopped.');
    }
    if (audioContext) {
        await audioContext.close(); // Properly closes the audio context
        console.log('Audio context closed.');
    }
}
