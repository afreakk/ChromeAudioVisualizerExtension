export default defineBackground(async () => {

  const { StartStreamEvent, messageTarget, messageAction, GenericEvent } = await import('@/utils/eventMessage');
  let streaming = false;
  let createdWindowId: number;
  let tabId: number;
  async function startRecording() {
    const streamId = await chrome.tabCapture.getMediaStreamId({
      targetTabId: tabId
    });

    const startStreamMessage = new StartStreamEvent(messageTarget.offscreen, messageAction.startStream, streamId);
    chrome.runtime.sendMessage(startStreamMessage.toMessage());
    streaming = true;
  }
  function stopRecording() {
    const stopStreamMessage = new GenericEvent(messageTarget.offscreen, messageAction.stopStream);
    chrome.runtime.sendMessage(stopStreamMessage.toMessage());
    streaming = false;
    // chrome.action.setIcon({ path: 'icons/not-recording.png' });
  }

  chrome.action.onClicked.addListener(async (tab) => {
    if (streaming) {
      return;
    }
    tabId = tab.id as number;
    streaming = true;

    // Create the animation window
    let win = await chrome.windows.create({
      url: chrome.runtime.getURL('animation.html'),
      type: 'popup',
      width: 1600,
      height: 900
    });
    createdWindowId = win.id as number;
    console.log('created window', createdWindowId);

  });

  // Start recording when animation window is created
  chrome.runtime.onMessage.addListener(async (message: GenericEvent, sender, sendResponse) => {
    if (message.target === messageTarget.background && message.action === messageAction.animationWindowCreated) {

      const existingContexts = await chrome.runtime.getContexts({});
      const offscreenDocument = existingContexts.find(
        (c) => c.contextType === 'OFFSCREEN_DOCUMENT'
      );
      if (!offscreenDocument) {
        await chrome.offscreen.createDocument({
          url: 'offscreen.html',
          reasons: [chrome.offscreen.Reason.USER_MEDIA],
          justification: "play sound effects",
        });
      }
      await startRecording();
    }
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
