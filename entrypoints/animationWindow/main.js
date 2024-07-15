console.log(chrome.runtime.onMessage);
chrome.runtime.onMessage.addListener((message) => {
    console.log('hi');
    document
        .getElementById('theFrame')
        ?.contentWindow?.postMessage(message, '*');
});
