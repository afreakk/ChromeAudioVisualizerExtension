import {
    messageAction,
    messageTarget,
} from '@/src/utils/eventMessage';
chrome.runtime.onMessage.addListener((message) => {
    document
        .getElementById('theFrame')
        ?.contentWindow?.postMessage(message, '*');
});
chrome.runtime.onMessage.addListener((message) => {
    if (
        message.target === "animation" &&
        message.action === "toggle-full-screen"
    ) {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen(); // Make the whole page fullscreen
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen(); // Exit fullscreen mode
            }
        }
    }
});

window.addEventListener('load', function() {
    document
        .getElementById('theFrame')
        ?.contentWindow?.postMessage({ target: 'animationWindowReadyEvent' }, '*');
});

window.addEventListener('message', function(e) {
    chrome.runtime.sendMessage(e.data);
});
