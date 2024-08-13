chrome.runtime.onMessage.addListener((message) => {
    document
        .getElementById('theFrame')
        ?.contentWindow?.postMessage(message, '*');
});

window.addEventListener('load', function() {
    console.log('onload, sending start');
    document
        .getElementById('theFrame')
        ?.contentWindow?.postMessage({ target: 'animationWindowReadyEvent' }, '*');
});

window.addEventListener('message', function(e) {
    chrome.runtime.sendMessage(e.data);
});
