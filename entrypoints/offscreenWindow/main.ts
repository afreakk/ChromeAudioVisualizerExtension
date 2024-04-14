import { StartStreamEvent, GenericEvent, AudioDataEvent, AudioDataDto, messageAction, messageTarget } from '@/src/utils/eventMessage';

chrome.runtime.onMessage.addListener((message: StartStreamEvent, sender, sendResponse) => {
  if (message.target === messageTarget.offscreen && message.action === messageAction.startStream) {

    startStream(message.streamId);
  }
});
chrome.runtime.onMessage.addListener((message: GenericEvent, sender, sendResponse) => {
  if (message.target === messageTarget.offscreen && message.action === messageAction.stopStream) {
    stopStream();
  }
});
let stream: MediaStream | null = null;
let audioContext: AudioContext | null = null;
async function startStream(streamId: string) {
  stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: 'tab',
        chromeMediaSourceId: streamId
      }
    },
  });
  window.location.hash = 'recording';
  audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  const bufferLength = analyser.frequencyBinCount;

  const analyserL = audioContext.createAnalyser();
  const bufferLengthL = analyserL.frequencyBinCount;
  analyserL.smoothingTimeConstant = 0.0;
  analyserL.fftSize = 2048;

  const analyserR = audioContext.createAnalyser();
  const bufferLengthR = analyserR.frequencyBinCount;
  analyserR.smoothingTimeConstant = 0.0;
  analyserR.fftSize = 2048;

  source.connect(analyser);

  const splitter = audioContext.createChannelSplitter(2);
  source.connect(splitter);
  splitter.connect(analyserL, 0, 0);  // Connect left channel
  splitter.connect(analyserR, 1, 0);  // Connect right channel

  analyser.connect(audioContext.destination);

  const dataArray = new Uint8Array(bufferLength);
  const dataArrayR = new Uint8Array(bufferLengthL);
  const dataArrayL = new Uint8Array(bufferLengthR);
  const updateAudioDataEvent = () => {
    if (!window.captureIsActive) {
      return;
    }

    analyser.getByteFrequencyData(dataArray);
    analyserL.getByteFrequencyData(dataArrayL);
    analyserR.getByteFrequencyData(dataArrayR);

    const data = Array.from(dataArray.slice(0, 256));
    const dataL = Array.from(dataArrayL.slice(0, 256));
    const dataR = Array.from(dataArrayR.slice(0, 256));
    const audioData = new AudioDataDto(data, dataL, dataR);
    const audioDataMessage = new AudioDataEvent(messageTarget.animation, messageAction.updateAudioData, audioData);
    chrome.runtime.sendMessage(audioDataMessage.toMessage());

    // 1000/10 = 100 frames per second
    setTimeout(updateAudioDataEvent, 10);
  };

  window.captureIsActive = true;
  // window.location.hash = 'recording';
  updateAudioDataEvent();
}

function stopStream() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    console.log("Stream stopped.");
  }
  if (audioContext) {
    audioContext.close(); // Properly closes the audio context
    console.log("Audio context closed.");
  }
  window.captureIsActive = false; // Ensure the loop is stopped

}
