var

openOptions = function()
{
	var optionsUrl = chrome.extension.getURL("options/index.html");
	chrome.tabs.create({ url: optionsUrl });
},

toggleScreenState = (function()
{
	var previousState = null;
	var windowId = chrome.windows.WINDOW_ID_CURRENT;
	return function(screenState){
		if(screenState) {
			chrome.windows.getCurrent(function(window){
					previousState = window.state;
					chrome.windows.update(windowId, { state: screenState });
				}
			);
		}
		else if(previousState){
			chrome.windows.update(windowId, { state: previousState });
		}
	}
})();
