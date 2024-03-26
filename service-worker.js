let tabId = null;
let closeStream = false;

function updateAudioDataEventHandler(message) {
  // Emited from offscreen.js
  if (message.target === 'service-worker' && message.action === 'update-audio-data') {
    if (closeStream) {
      closeStream = false;
      return;
    }
    chrome.tabs.sendMessage(tabId,
      {
        target: 'content',
        action: 'start-rendering',
        data: message.data,
      });
  }
}

async function startRecording() {
  closeStream = false;
  const streamId = await chrome.tabCapture.getMediaStreamId({
    targetTabId: tabId
  });

  chrome.runtime.sendMessage({
    action: 'start-recording',
    target: 'offscreen',
    data: streamId,
  });

  chrome.action.setIcon({ path: '/icons/recording.png' });
}
function stopRecording() {
  closeStream = true;
  // Stop the recording
  chrome.runtime.sendMessage({
    action: 'stop-recording',
    target: 'offscreen'
  });
  // Stop the rendering
  chrome.tabs.sendMessage(tabId,
    {
      target: 'content',
      action: 'stop-rendering',
    });
  // Reset the icon
  chrome.action.setIcon({ path: 'icons/not-recording.png' });
}

chrome.action.onClicked.addListener(async (tab) => {
  const existingContexts = await chrome.runtime.getContexts({});
  let recordingTab = false;
  tabId = tab.id;

  const offscreenDocument = existingContexts.find(
    (c) => c.contextType === 'OFFSCREEN_DOCUMENT'
  );

  // If an offscreen document is not already open, create one.
  if (!offscreenDocument) {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['USER_MEDIA'],
      justification: 'Recording from chrome.tabCapture API'
    });
  } else {
    recordingTab = offscreenDocument.documentUrl.endsWith('#recording');
  }

  // If the tab is already recording, stop the recording.
  if (recordingTab) {
    stopRecording();
    return;
  }

  await startRecording();
});

chrome.runtime.onMessage.addListener(async (message) => {
  updateAudioDataEventHandler(message);
});
