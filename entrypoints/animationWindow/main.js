import { messageAction, messageTarget } from '@/src/utils/eventMessage';
import { STORAGE_PREFIX } from '@/src/utils/settings';

let theFrame = null;

/**
 * Offscreen documents are headless and can't display a permission prompt, so
 * microphone permission must be acquired from a visible extension context
 * first. Once granted for the extension origin, it persists and the offscreen
 * document's getUserMedia call succeeds silently. Called only when background
 * requests a mic prime during a warm Tab→Mic restart.
 */
async function runMicrophonePrime() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        for (const track of stream.getTracks()) track.stop();
        chrome.runtime.sendMessage({
            target: messageTarget.background,
            action: messageAction.micPrimeSucceeded,
        });
    } catch (err) {
        // biome-ignore lint/suspicious/noConsole: surface missing mic permission so the user sees it
        console.error(
            'Microphone permission denied. Grant it via chrome://extensions → this extension → Details → Site settings → Microphone → Allow.',
            err,
        );
        try {
            chrome.runtime.sendMessage({
                target: messageTarget.background,
                action: messageAction.primeMicrophoneFailed,
            });
        } catch {
            // Receiving end may not exist
        }
    }
}

/** Read all saved settings from localStorage and return as { settingsName: jsonValue } */
function getAllStoredSettings() {
    const entries = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(STORAGE_PREFIX)) {
            const settingsName = key.slice(STORAGE_PREFIX.length);
            entries[settingsName] = localStorage.getItem(key);
        }
    }
    return entries;
}

window.addEventListener('load', function () {
    theFrame = document.getElementById('theFrame');
    theFrame?.contentWindow?.postMessage(
        { target: 'animation', action: 'animation-ready', storedSettings: getAllStoredSettings() },
        '*',
    );
});

chrome.runtime.onMessage.addListener((message) => {
    if (message.target === messageTarget.animation && message.action === messageAction.primeMicrophone) {
        runMicrophonePrime();
        return;
    }
    if (
        message.target === messageTarget.animation &&
        message.action === messageAction.toggleFullScreen
    ) {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
    theFrame?.contentWindow?.postMessage(message, '*');
});

// Only forward messages that target extension contexts (background, offscreen, settings)
// to avoid broadcasting high-frequency internal sandbox messages to all extension contexts
const forwardTargets = new Set([messageTarget.background, messageTarget.offscreen, messageTarget.settings]);

window.addEventListener('storage', (e) => {
    if (!e.key?.startsWith(STORAGE_PREFIX)) return;
    const settingsName = e.key.slice(STORAGE_PREFIX.length);
    theFrame?.contentWindow?.postMessage(
        { target: messageTarget.animation, action: messageAction.updateSettingsCache, key: settingsName, value: e.newValue },
        '*',
    );
});

window.addEventListener('message', function (e) {
    if (!e.data) {
        return;
    }

    // Handle settings save requests from the sandbox
    if (e.data.action === messageAction.saveSettings) {
        localStorage.setItem(STORAGE_PREFIX + e.data.key, e.data.value);
        return;
    }

    if (!forwardTargets.has(e.data.target)) {
        return;
    }
    try {
        chrome.runtime.sendMessage(e.data);
    } catch (_ex) {
        // Receiving end may not exist if extension context is invalidated
    }
});
