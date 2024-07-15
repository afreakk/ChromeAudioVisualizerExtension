console.log(document.getElementById('theFrame')?.contentWindow.postMessage);
chrome.runtime.onMessage.addListener((message) => {
    console.log('hi');
    document
        .getElementById('theFrame')
        ?.contentWindow?.postMessage(message, '*');
});

setTimeout(() => {
    console.log('WW');
    document
        .getElementById('theFrame')
        ?.contentWindow?.postMessage({ target: 'startz' }, '*');
}, 50);

window.addEventListener('message', function (e) {
    console.log('ho');
    chrome.runtime.sendMessage(e.data);
});
