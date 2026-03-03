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

window.addEventListener('message', function (e) {
    try {
        chrome.runtime.sendMessage(e.data);
    } catch (_ex) {
        // Receiving end may not exist if extension context is invalidated
    }
});
