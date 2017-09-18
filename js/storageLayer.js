//storage
storage = {};
storage.removeKey = function(key, callback)
{
	chrome.storage.sync.remove(key, callback);
},
storage.getKey = function(key,callback)
{
	chrome.storage.sync.get(key,function(data){
		try{
			callback(data);
		}catch(e){
			aError(e.message);
			aError(e.stack);
			if(chrome.runtime.lastError)
				aError(chrome.runtime.lastError.message);
		}
	});
},
storage.setKey = function(key, value, callback)
{
	var pkg = {};
	pkg[key] = value;
	chrome.storage.sync.set(pkg,callback);
},
storage.getAll = function(callback)
{
	chrome.storage.sync.get(null,function(data){
		try{
			callback(data);
		}catch(e){
			aError(e.message);
			aError(e.stack);
			if(chrome.runtime.lastError)
				aError(chrome.runtime.lastError.message);
		}
	});
},
//-- higher->

//options
storage.options = {},
storage.options.initialized = false,
storage.options.defaultValues = null,
storage.options.init = function(optionsOwner, callback, force)
{
	if(!storage.options.initialized||force){
		storage.options.defaultValues = {};
		for(var key in optionsOwner)
			storage.options.defaultValues[key] = optionsOwner[key];

		storage.options.initialized = true;
		storage.options.get(
			function(options)
			{
				options = options || {};
				for(var key in optionsOwner)
				{
					if(key in options)
						optionsOwner[key] = options[key];
					else
						options[key] = optionsOwner[key];
				}
				storage.options.set(options, callback);
			}
		);
	}
},
storage.options.get = function(callback)
{
	if(!storage.options.initialized){
		storage.options.init(window.OV, 
			function()
			{
				storage.options.get(callback);
			}
		);
	}
	else{
		storage.getKey("options",
			function(pkg)
			{
				callback(pkg["options"]);
			}
		);
	}
},
storage.options.set = function(options, callback)
{
	storage.setKey("options", options, callback);
},
storage.options.setOption = function(key,value, callback)
{
	storage.options.get(
		function(options)
		{
			options[key] = value;
			storage.options.set(options, callback);
		}
	);
},
storage.options.getOption = function(key, callback)
{
	storage.options.get(
		function(pkg)
		{
			callback(pkg[key]);
		}
	);
},
storage.options.syncFromStorage = function(owner, attrib)
{
	storage.options.getOption(key,
		function(value)
		{
			storage.options._syncValue(owner, attrib, value);
		}
	);
},
storage.options._isSet = function(value)
{
	return !(typeof value === 'undefined' || value === null);
},
storage.options._syncValue = function(owner, attrib, value)
{
	if(storage.options._isSet(value))
		owner[attrib] = value;
	else
		storage.options.setOption(attrib, owner[attrib]);
},
storage.options.syncFromStorageMulti = function(owner, attribs, callback)
{
	storage.options.get(
		function(optionValues)
		{
			attribs.forEach(
				function(attrib)
				{
					storage.options._syncValue(owner, attrib, optionValues[attrib]);
				}
			);
			if(callback)
				callback();
		}
	);

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
	if(callback)
		storage.setKey(keyName, sceneSetting,
		function()
		{
			storage.scenes.get(callback);
		}
	);
	else
		storage.setKey(keyName, sceneSetting);
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
