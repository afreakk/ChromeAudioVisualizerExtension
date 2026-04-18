import { SettingsWindowEvent } from '@/src/userInterface/settings/events/SettingsWindowEvent';
import {
    captureSource,
    GenericEvent,
    InitiateStreamEvent,
    messageAction,
    messageTarget,
    RestartCaptureAckEvent,
    type RestartCaptureEvent,
} from '@/src/utils/eventMessage';

export default defineBackground(() => {
    let streaming = false;
    let animationWindowId: number | null = null;
    let settingsWindowId: number | null = null;
    let tabId: number | null = null;
    let activeCaptureSource: captureSource = captureSource.tab;
    let restartInFlight = false;
    let pendingRestartNonce: string | null = null;
    let awaitingMicPrime = false;

    function sendRestartAck(success: boolean): void {
        if (pendingRestartNonce === null) return;
        const ack = new RestartCaptureAckEvent(pendingRestartNonce, success);
        try {
            chrome.runtime.sendMessage(ack.toMessage());
        } catch (_e) {
            // Receiving end may not exist
        }
        pendingRestartNonce = null;
        restartInFlight = false;
        awaitingMicPrime = false;
    }

    async function resolveCaptureSource(): Promise<captureSource> {
        const { captureSource: stored } = await chrome.storage.local.get('captureSource');
        return stored === captureSource.microphone ? captureSource.microphone : captureSource.tab;
    }

    async function initiateTabStream(targetTabId: number) {
        const streamId = await chrome.tabCapture.getMediaStreamId({
            targetTabId: targetTabId,
        });

        const startStreamMessage = new InitiateStreamEvent(
            messageTarget.offscreen,
            messageAction.initiateStream,
            streamId as string,
            captureSource.tab,
        );
        chrome.runtime.sendMessage(startStreamMessage.toMessage());
        streaming = true;
    }

    function initiateMicrophoneStream() {
        const initiate = new InitiateStreamEvent(
            messageTarget.offscreen,
            messageAction.initiateStream,
            '',
            captureSource.microphone,
        );
        chrome.runtime.sendMessage(initiate.toMessage());
        streaming = true;
    }

    // Re-initiate stream after hot-reload
    async function reinitiateStream() {
        activeCaptureSource = await resolveCaptureSource();
        if (activeCaptureSource === captureSource.microphone) {
            initiateMicrophoneStream();
            return;
        }
        const [audibleTab] = await chrome.tabs.query({ audible: true });
        if (audibleTab?.id) {
            await initiateTabStream(audibleTab.id);
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
        activeCaptureSource = await resolveCaptureSource();

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

            if (activeCaptureSource === captureSource.microphone) {
                // Animation window primes mic permission (offscreen can't show a prompt)
                // and then sends an initiate-stream message, handled below.
                streaming = true;
            } else {
                await initiateTabStream(tabId);
            }
        } catch (error) {
            // biome-ignore lint/suspicious/noConsole: startup failures should be visible in extension logs
            console.error('Failed to start visualization:', error);
            streaming = false;
        }
    });

    chrome.runtime.onMessage.addListener((message: SettingsWindowEvent | GenericEvent | RestartCaptureEvent) => {
        // Only handle messages targeted at background
        if (message.target !== messageTarget.background) {
            return;
        }

        // Handle offscreen stream-recovery request (hot-reload / retry path).
        if (message.action === messageAction.initiateStream) {
            if (animationWindowId === null) {
                // No animation window exists; drop silently. Restart ack flags
                // are owned by the mic-prime-succeeded path.
                return;
            }
            (async () => {
                try {
                    await reinitiateStream();
                } catch (_error) {
                    // Recovery will reschedule via offscreen retry logic.
                }
            })();
            return;
        }

        // Handle mic permission prime completion from the animation window.
        if (message.action === messageAction.micPrimeSucceeded) {
            if (animationWindowId === null) {
                if (awaitingMicPrime) {
                    sendRestartAck(false);
                }
                return;
            }
            initiateMicrophoneStream();
            if (awaitingMicPrime) {
                sendRestartAck(true);
            }
            return;
        }

        if (message.action === messageAction.primeMicrophoneFailed) {
            streaming = false;
            if (restartInFlight) {
                sendRestartAck(false);
            }
            return;
        }

        if (message.action === messageAction.restartCapture) {
            const restartMessage = message as RestartCaptureEvent;
            const nonce = restartMessage.nonce;
            if (restartInFlight) {
                // Already processing a restart; reject this one so the UI re-enables.
                try {
                    const rejectAck = new RestartCaptureAckEvent(nonce, false);
                    chrome.runtime.sendMessage(rejectAck.toMessage());
                } catch (_e) {
                    // Receiving end may not exist
                }
                return;
            }
            restartInFlight = true;
            pendingRestartNonce = nonce;
            (async () => {
                try {
                    stopStream();
                    activeCaptureSource = await resolveCaptureSource();
                    if (activeCaptureSource === captureSource.microphone) {
                        // Reserve streaming and ask animation window to prime mic permission.
                        // Ack will fire from the initiate-stream handler (success) or the
                        // primeMicrophoneFailed handler (failure).
                        streaming = true;
                        awaitingMicPrime = true;
                        const primeMessage = new GenericEvent(messageTarget.animation, messageAction.primeMicrophone);
                        try {
                            chrome.runtime.sendMessage(primeMessage.toMessage());
                        } catch (_e) {
                            sendRestartAck(false);
                        }
                    } else {
                        let targetTabId = tabId;
                        if (targetTabId === null) {
                            const [audibleTab] = await chrome.tabs.query({ audible: true });
                            targetTabId = audibleTab?.id ?? null;
                        }
                        if (targetTabId !== null) {
                            tabId = targetTabId;
                            await initiateTabStream(targetTabId);
                            sendRestartAck(true);
                        } else {
                            // biome-ignore lint/suspicious/noConsole: surface missing audible tab during restart
                            console.warn('restartCapture: no audible tab found');
                            sendRestartAck(false);
                        }
                    }
                } catch (error) {
                    // biome-ignore lint/suspicious/noConsole: restart failures should be visible
                    console.error('Failed to restart capture:', error);
                    sendRestartAck(false);
                }
            })();
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
            tabId = null;
            if (settingsWindowId) {
                chrome.windows.remove(settingsWindowId);
            }
            if (streaming) {
                stopStream();
            }
            if (restartInFlight) {
                sendRestartAck(false);
            }
        }
    });
});
