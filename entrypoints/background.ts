export default defineBackground(async () => {
  const { InitiateStreamEvent, messageTarget, messageAction, GenericEvent } = await import('@/src/utils/eventMessage');
  let streaming = false;
  let createdWindowId: number | null = null;
  let tabId: number;
  async function startRecording() {
    const streamId = await chrome.tabCapture.getMediaStreamId({
      targetTabId: tabId
    });
    console.log('streamId', streamId);

    const startStreamMessage = new InitiateStreamEvent(messageTarget.offscreen, messageAction.initiateStream, streamId);
    chrome.runtime.sendMessage(startStreamMessage.toMessage());
    streaming = true;
  }
  function stopRecording() {
    const stopStreamMessage = new GenericEvent(messageTarget.offscreen, messageAction.stopStream);
    chrome.runtime.sendMessage(stopStreamMessage.toMessage());
    streaming = false;
  }

  chrome.action.onClicked.addListener(async (tab) => {
    if (streaming) {
      return;
    }
    tabId = tab.id as number;
    streaming = true;


    const existingContexts = await chrome.runtime.getContexts({});
    const offscreenDocument = existingContexts.find(
      (c) => c.contextType === 'OFFSCREEN_DOCUMENT'
    );
    if (!offscreenDocument) {
      await chrome.offscreen.createDocument({
        url: 'offscreenWindow.html',
        reasons: [chrome.offscreen.Reason.USER_MEDIA],
        justification: "play sound effects",
      });
    }
    await startRecording();

    // Create the animation window
    let win = await chrome.windows.create({
      url: chrome.runtime.getURL('animationWindow.html'),
      type: 'popup',
      width: 1600,
      height: 900
    });
    createdWindowId = win.id as number;

  });

  // Listen for the window being closed
  chrome.windows.onRemoved.addListener((windowId) => {
    if (windowId === createdWindowId) {
      createdWindowId = null;
      if (streaming) {
        stopRecording();
        return;
      }
    }
  });
});
