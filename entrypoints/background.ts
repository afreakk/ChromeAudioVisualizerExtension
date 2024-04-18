import { SettingsWindowEvent } from '@/src/userInterface/settings/events/SettingsWindowEvent';
import { GenericEvent } from '@/src/utils/eventMessage';

export default defineBackground(async () => {
  const { InitiateStreamEvent, messageTarget, messageAction, GenericEvent } = await import('@/src/utils/eventMessage');
  let streaming = false;
  let animationWindowId: number | null = null;
  let settingsWindowId: number | null = null;
  let tabId: number;
  async function initiateStream() {
    const streamId = await chrome.tabCapture.getMediaStreamId({
      targetTabId: tabId
    });

    const startStreamMessage = new InitiateStreamEvent(messageTarget.offscreen, messageAction.initiateStream, streamId);
    chrome.runtime.sendMessage(startStreamMessage.toMessage());
    streaming = true;
  }
  function stopStream() {
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
    await initiateStream();

    // Create the animation window
    let win = await chrome.windows.create({
      url: chrome.runtime.getURL('animationWindow.html'),
      type: 'popup',
      width: 1600,
      height: 900
    });
    animationWindowId = win.id as number;

  });

  chrome.runtime.onMessage.addListener(async (message: SettingsWindowEvent) => {
    if (message.target === messageTarget.background && message.action === messageAction.openSettingsWindow) {
      let win = await chrome.windows.create({
        url: chrome.runtime.getURL('settingsWindow.html'),
        type: 'popup',
        width: 400,
        height: 600
      });
      settingsWindowId = win.id as number;

      const closeSettingsInAnimation = new SettingsWindowEvent(messageTarget.animation, messageAction.openSettingsWindow);
      chrome.runtime.sendMessage(closeSettingsInAnimation.toMessage());
    }
  });
  // Listen for the settings-window being closed
  chrome.windows.onRemoved.addListener((windowId) => {
    if (windowId === settingsWindowId) {
      settingsWindowId = null;

      const closeSettingsWindow = new SettingsWindowEvent(messageTarget.animation, messageAction.closeSettingsWindow);
      chrome.runtime.sendMessage(closeSettingsWindow.toMessage());
    }
  });
  // Listen for the animation-window being closed
  chrome.windows.onRemoved.addListener((windowId) => {
    if (windowId === animationWindowId) {
      animationWindowId = null;
      if (settingsWindowId) {
        chrome.windows.remove(settingsWindowId, () => {
          console.log('Window with ID', windowId, 'has been closed.');
        });
      }
      if (streaming) {
        stopStream();
        return;
      }
    }
  });
});
