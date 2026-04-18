import { SettingsWindowEvent } from '@/src/userInterface/settings/events/SettingsWindowEvent';
import { GenericEvent, InitiateStreamEvent, messageAction, messageTarget } from '@/src/utils/eventMessage';

export default defineBackground(() => {
    let streaming = false;
    let animationWindowId: number | null = null;
    let settingsWindowId: number | null = null;
    let tabId: number;

    async function initiateStream(targetTabId: number) {
        const streamId = await chrome.tabCapture.getMediaStreamId({
            targetTabId: targetTabId,
        });

        const startStreamMessage = new InitiateStreamEvent(
            messageTarget.offscreen,
            messageAction.initiateStream,
            streamId as string,
        );
        chrome.runtime.sendMessage(startStreamMessage.toMessage());
        streaming = true;
    }

    // Re-initiate stream after hot-reload by finding an audible tab
    async function reinitiateStream() {
        const [audibleTab] = await chrome.tabs.query({ audible: true });
        if (audibleTab?.id) {
            await initiateStream(audibleTab.id);
        } else {
            // biome-ignore lint/suspicious/noConsole: surface missing audible tab during hot-reload recovery
            console.warn('reinitiateStream: no audible tab found');
        }
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

        try {
            const existingContexts = await chrome.runtime.getContexts({});
            const offscreenDocument = existingContexts.find((c) => c.contextType === 'OFFSCREEN_DOCUMENT');
            if (!offscreenDocument) {
                await chrome.offscreen.createDocument({
                    url: 'offscreenWindow.html',
                    reasons: [chrome.offscreen.Reason.USER_MEDIA],
                    justification: 'Audio visualization capture and processing',
                });
            }
            await initiateStream(tabId);

            // Create the animation window
            const win = await chrome.windows.create({
                url: chrome.runtime.getURL('animationWindow.html'),
                type: 'popup',
                width: 1600,
                height: 900,
            });
            if (!win) {
                throw new Error('Failed to create animation window');
            }
            animationWindowId = win.id as number;
        } catch (error) {
            // biome-ignore lint/suspicious/noConsole: startup failures should be visible in extension logs
            console.error('Failed to start visualization:', error);
            streaming = false;
        }
    });

    chrome.runtime.onMessage.addListener((message: SettingsWindowEvent | GenericEvent) => {
        // Only handle messages targeted at background
        if (message.target !== messageTarget.background) {
            return;
        }

        // Handle request for new stream ID after hot-reload
        if (message.action === messageAction.initiateStream) {
            reinitiateStream();
            return;
        }

        if (message.action === messageAction.openSettingsWindow) {
            (async () => {
                const win = await chrome.windows.create({
                    url: chrome.runtime.getURL('settingsWindow.html'),
                    type: 'popup',
                    width: 400,
                    height: 600,
                });
                if (!win) {
                    throw new Error('Failed to create settings window');
                }
                settingsWindowId = win.id as number;

                const closeSettingsInAnimation = new SettingsWindowEvent(
                    messageTarget.animation,
                    messageAction.openSettingsWindow,
                );
                chrome.runtime.sendMessage(closeSettingsInAnimation.toMessage());
            })();
            return;
        }
    });
    // Listen for windows being closed and handle both settings and animation windows
    chrome.windows.onRemoved.addListener((windowId) => {
        if (windowId === settingsWindowId) {
            settingsWindowId = null;
            const closeSettingsWindow = new SettingsWindowEvent(
                messageTarget.animation,
                messageAction.closeSettingsWindow,
            );
            chrome.runtime.sendMessage(closeSettingsWindow.toMessage());
        }

        if (windowId === animationWindowId) {
            animationWindowId = null;
            if (settingsWindowId) {
                chrome.windows.remove(settingsWindowId);
            }
            if (streaming) {
                stopStream();
            }
        }
    });
});
