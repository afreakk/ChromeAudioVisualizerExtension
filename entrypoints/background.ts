import { SettingsWindowEvent } from '@/src/userInterface/settings/events/SettingsWindowEvent';
import { InitiateStreamEvent, messageTarget, messageAction, GenericEvent } from '@/src/utils/eventMessage';


export default defineBackground(async () => {
    let streaming = false;
    let animationWindowId: number | null = null;
    let settingsWindowId: number | null = null;
    let tabId: number;
    
    async function initiateStream(tabId: number) {
        const streamId = await chrome.tabCapture.getMediaStreamId({
            targetTabId: tabId,
        });

        // Store tabId in chrome.storage to survive hot-reloads
        await chrome.storage.local.set({ tabId: tabId });

        const startStreamMessage = new InitiateStreamEvent(
            messageTarget.offscreen,
            messageAction.initiateStream,
            streamId as string
        );
        chrome.runtime.sendMessage(startStreamMessage.toMessage());
        streaming = true;
    }
    
    // Re-initiate stream after hot-reload using stored tabId
    async function reinitiateStream() {
        const stored = await chrome.storage.local.get('tabId');
        const storedTabId = stored.tabId as number | undefined;
        if (storedTabId) {
            await initiateStream(storedTabId);
        } else {
            console.warn('No stored tabId found, cannot re-initiate stream');
        }
    }
    
    function stopStream() {
        const stopStreamMessage = new GenericEvent(
            messageTarget.offscreen,
            messageAction.stopStream
        );
        chrome.runtime.sendMessage(stopStreamMessage.toMessage());
        streaming = false;
        // Clear stored tabId when stopping
        chrome.storage.local.remove('tabId');
    }

    chrome.action.onClicked.addListener(async (tab) => {
        console.log('Action clicked');
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
                justification: 'play sound effects',
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
    });

    chrome.runtime.onMessage.addListener(
        async (message: SettingsWindowEvent | GenericEvent) => {
            // Handle request for new stream ID after hot-reload
            if (
                message.target === messageTarget.background &&
                message.action === messageAction.initiateStream
            ) {
                await reinitiateStream();
                return;
            }
            
            if (
                message.target === messageTarget.background &&
                message.action === messageAction.openSettingsWindow
            ) {
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
                    messageAction.openSettingsWindow
                );
                chrome.runtime.sendMessage(
                    closeSettingsInAnimation.toMessage()
                );
            }
        }
    );
    // Listen for windows being closed and handle both settings and animation windows
    chrome.windows.onRemoved.addListener((windowId) => {
        let handled = false;

        if (windowId === settingsWindowId) {
            settingsWindowId = null;
            const closeSettingsWindow = new SettingsWindowEvent(
                messageTarget.animation,
                messageAction.closeSettingsWindow
            );
            chrome.runtime.sendMessage(closeSettingsWindow.toMessage());
            handled = true;
        }

        if (windowId === animationWindowId) {
            animationWindowId = null;
            if (settingsWindowId) {
                chrome.windows.remove(settingsWindowId, () => {
                    console.log('Settings window with ID', settingsWindowId, 'has been closed due to animation window closing.');
                });
            }
            if (streaming) {
                stopStream();
            }
            handled = true;
        }

        if (handled) {
            console.log('Window with ID', windowId, 'has been handled.');
        }
    });
});
