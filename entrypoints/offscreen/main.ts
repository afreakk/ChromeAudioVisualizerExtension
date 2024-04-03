import { StartStreamEvent, GenericEvent, AudioDataEvent, AudioDataDto, messageAction, messageTarget, AudioDataEvent, AudioDataEvent, AudioDataDto } from '@/utils/eventMessage';

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
  const dataArray = new Uint8Array(bufferLength);

  source.connect(analyser);
  analyser.connect(audioContext.destination);

  const updateAudioDataEvent = () => {
    if (!window.captureIsActive) {
      return;
    }

    analyser.getByteFrequencyData(dataArray);

    const data = Array.from(dataArray.slice(0, 256));
    const audioData = new AudioDataDto(data, data, data);
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
