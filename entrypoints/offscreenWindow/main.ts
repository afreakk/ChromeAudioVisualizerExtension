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
} from '@/src/utils/eventMessage';

let currentStreamType: streamType | null = null;
let stream: MediaStream | null = null;
let audioContext: AudioContext | null = null;

let numSamplesNormal = 2048;
let numSamplesButterChurn = 1024;
let analyserNormal: AnalyserNode | null = null;
let analyserButterChurn: AnalyserNode | null = null;
let analyserButterChurnL: AnalyserNode | null = null;
let analyserButterChurnR: AnalyserNode | null = null;


chrome.runtime.onMessage.addListener((message: StartStreamEvent) => {
    console.log("startStreamEvent");
    if (
        message.target === messageTarget.offscreen &&
        message.action === messageAction.startStream
    ) {
        console.log('start-stream--');
        currentStreamType = message.streamType;
        startStream();
    }
});
chrome.runtime.onMessage.addListener((message: InitiateStreamEvent) => {
    console.log(message);
    if (
        message.target === messageTarget.offscreen &&
        message.action === messageAction.initiateStream
    ) {
        window.captureIsActive = true;
        initiateStream(message.streamId);
    }
});
chrome.runtime.onMessage.addListener((message: GenericEvent) => {
    console.log(message);
    if (
        message.target === messageTarget.offscreen &&
        message.action === messageAction.stopStream
    ) {
        stopStream();
    }
});
async function initiateStream(streamId: string) {
    stream = await navigator.mediaDevices.getUserMedia({
        audio: {
            mandatory: {
                chromeMediaSource: 'tab',
                chromeMediaSourceId: streamId,
            },
        },
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
}

async function startStream() {
    const updateAudioDataEvent = () => {
        if (!window.captureIsActive) {
            return;
        }
        if (
            currentStreamType === streamType.normal &&
            analyserNormal !== null
        ) {
            const dataArray = new Uint8Array(numSamplesNormal / 4);
            analyserNormal.getByteFrequencyData(dataArray);

            const data = Array.from(dataArray);
            const audioData = new NormalAudioDataDto(data);
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
            const audioData = new ButterChurnAudioDataDto(data, dataL, dataR);
            const audioDataMessage = new AudioDataEvent(
                messageTarget.animation,
                messageAction.updateAudioData,
                audioData
            );
            chrome.runtime.sendMessage(audioDataMessage.toMessage());
        }

        // 1000/10 = 100 frames per second
        setTimeout(updateAudioDataEvent, 10);
    };

    updateAudioDataEvent();
}

function stopStream() {
    window.captureIsActive = false;
    if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        console.log('Stream stopped.');
    }
    if (audioContext) {
        audioContext.close(); // Properly closes the audio context
        console.log('Audio context closed.');
    }
}
