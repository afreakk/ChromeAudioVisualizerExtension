(function(){
	storage.options.init(window.OV, function(){
		var frontEnd = new ExtensionFrontEnd();
		chrome.browserAction.onClicked.addListener(
			frontEnd.MainClickedCallback.bind(frontEnd));

		chrome.extension.onMessage.addListener(
			frontEnd.messageHandler.bind(frontEnd));
		chrome.tabs.onUpdated.addListener(
			frontEnd.updateHandler.bind(frontEnd));
	});

})();

chrome.commands.onCommand.addListener(
	function(command)
	{
		if(command == "open-options")
			openOptions();
	}
);
