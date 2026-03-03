import { messageAction, messageTarget } from '@/src/utils/eventMessage';

let theFrame = null;

window.addEventListener('load', function () {
    theFrame = document.getElementById('theFrame');
    theFrame?.contentWindow?.postMessage({ target: 'animationWindowReadyEvent' }, '*');
});

chrome.runtime.onMessage.addListener((message) => {
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

window.addEventListener('message', function (e) {
    if (!e.data || !forwardTargets.has(e.data.target)) {
        return;
    }
    try {
        chrome.runtime.sendMessage(e.data);
    } catch (_ex) {
        // Receiving end may not exist if extension context is invalidated
    }
});
