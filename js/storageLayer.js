//storage
storage = {};
storage.removeKey = function(key, callback)
{
	chrome.storage.sync.remove(key, callback);
},
storage.getKey = function(key,callback)
{
	storage.sync.get(key,callback);
},
storage.setKey = function(key, value, callback)
{
	var pkg = {};
	pkg[key] = value;
	chrome.storage.sync.set(pkg,callback);
},
storage.getAll = function(callback)
{
	chrome.storage.sync.get(null,callback);
},
//-- higher->

//options
storage.options = {},
storage.options.get = function(callback)
{
	storage.getKey("options", callback);
},
storage.options.set = function(options, callback)
{
	storage.setKey("options", options, callback);
},
//scenes
storage.scenes = {},
storage.scenes.get = function(callback)
{
	storage.getAll(
		function(data)
		{
			delete data.options;
			callback(data);
		}
	);
},
storage.scenes.remove = function(key, callback)
{
	storage.removeKey(key, callback);
},
storage.scenes.insert = function(keyName, sceneSetting, callback)
{
	storage.setKey(keyName, sceneSetting,
		callback==true?
		function()
		{
			storage.scenes.get(callback);
		}
		:null
	);
},
storage.scenes.setError = function(keyName, exception)
{
	storage.scenes.get(
		function(scenes)
		{
			for(var i in scenes)
			{
				if(i==keyName)
				{
					scenes[i].exception = exception;
					storage.scenes.insert(i, scenes[i]);
				}
			}
		}
	);
};
