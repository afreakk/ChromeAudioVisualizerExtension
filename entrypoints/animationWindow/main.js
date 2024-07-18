chrome.runtime.onMessage.addListener((message) => {
    console.log('from offscreen, passsing on to sandbox');
    document
        .getElementById('theFrame')
        ?.contentWindow?.postMessage(message, '*');
});

window.addEventListener('load', function () {
    console.log('onload, sending start');
    document
        .getElementById('theFrame')
        ?.contentWindow?.postMessage({ target: 'startz' }, '*');
});

window.addEventListener('message', function (e) {
    console.log('from sandbox, sending to offscreen', e.data);
    chrome.runtime.sendMessage(e.data);
});
