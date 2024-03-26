chrome.runtime.onMessage.addListener(async (message) => {
  if (message.target === 'offscreen') {
    switch (message.action) {
      case 'start-recording':
        startStream(message.data);
        break;
      case 'stop-recording':
        stopStream();
        break;
      default:
        throw new Error('Unrecognized message:', message.type);
    }
  }
});


let globalStream = null;
let globalAudioContext = null;

async function startStream(streamId) {
  globalStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: 'tab',
        chromeMediaSourceId: streamId
      }
    },
  });
  window.location.hash = 'recording';
  globalAudioContext = new AudioContext();
  const source = globalAudioContext.createMediaStreamSource(globalStream);
  const analyser = globalAudioContext.createAnalyser();

  analyser.fftSize = 2048;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  source.connect(analyser);
  analyser.connect(globalAudioContext.destination);

  const updateAudioDataEvent = () => {
    // Stop the loop if capture is not active
    if (!window.captureIsActive)
      return;

    analyser.getByteFrequencyData(dataArray);
    chrome.runtime.sendMessage({
      action: 'update-audio-data',
      target: 'service-worker',
      data: Array.from(dataArray.slice(0, 256)),
    });

    // 1000/10 = 100 frames per second
    setTimeout(updateAudioDataEvent, 10);
  };

  window.captureIsActive = true;
  updateAudioDataEvent();
}

function stopStream() {
  if (globalStream) {
    globalStream.getTracks().forEach(track => track.stop());
    console.log("Stream stopped.");
  }
  if (globalAudioContext) {
    globalAudioContext.close(); // Properly closes the audio context
    console.log("Audio context closed.");
  }
  window.captureIsActive = false; // Ensure the loop is stopped
  window.location.hash = '';
}

