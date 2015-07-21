var

openOptions = function()
{
	var optionsUrl = chrome.extension.getURL("options/index.html");
	chrome.tabs.create({ url: optionsUrl });
},

toggleScreenState = function(screenState)
{
	windowId = chrome.windows.WINDOW_ID_CURRENT;
	chrome.windows.update(windowId, { state: screenState });
};
