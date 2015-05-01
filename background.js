var port = {};
var currentTab = null;
chrome.browserAction.onClicked.addListener(
	function (tab)
	{
		currentTab = tab;
		console.log("mainHotkeyClicked: "+tab.id);
		if(currentTab.id in port)
			port[currentTab.id].postMessage({msg:"toggle"});
		else
		{
			var scripts = [
				{file:"lib/dat.gui.js"},
				{file:"tools.js"},
				{file:"sceneManager.js"},
				{file:"scenes/scenes.js"},
				{file:"scenes/circleScene.js"},
				{file:"scenes/wormScene.js"},
				{file:"scenes/wartScene.js"},
				{file:"init.js"}
			];
			executeScripts(null, scripts,
				function()
				{
					chrome.tabCapture.capture({audio: true}, receivedAudioStream)
				}
			);
		}
	}
);
function receivedAudioStream(stream)
{
	var context = new AudioContext();
	var sourceNode = context.createMediaStreamSource(stream);
	var analyzer = context.createAnalyser();
	analyzer.fftSize = 512;
	sourceNode.connect(analyzer);
	sourceNode.connect(context.destination);
	console.log("connecting 2 tab: " + currentTab.title);
	port[currentTab.id] = chrome.tabs.connect(currentTab.id);
	port[currentTab.id].onMessage.addListener(
		function(msg)
		{
			var byteFrequency = new Uint8Array(512);
			analyzer.getByteFrequencyData(byteFrequency);
			port[currentTab.id].postMessage({msg: "data", "data": byteFrequency});
		}
	);
	chrome.tabs.executeScript(currentTab.id, { code: "init();" });
}
function executeScripts(tabId, injectDetailsArray, finishingCallback)
{
    function createCallback(tabId, injectDetails, innerCallback) {
        return function () {
            chrome.tabs.executeScript(tabId, injectDetails, innerCallback);
        };
    }

    var callback = finishingCallback;

    for (var i = injectDetailsArray.length - 1; i >= 0; --i)
        callback = createCallback(tabId, injectDetailsArray[i], callback);

    if (callback !== null)
        callback();   // execute outermost function
}
