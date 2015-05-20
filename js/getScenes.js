function getScenes(callback)
{
	chrome.storage.sync.get(null,
		function(data)
		{
			delete data.options;
			callback(data);
		}
	);
}
