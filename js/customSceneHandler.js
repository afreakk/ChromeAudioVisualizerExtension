CustomSceneHandler = function(sceneSelector)
{
	this.presets = null;
	this.sceneSelector = sceneSelector;
},
CustomSceneHandler.prototype.loadCustomScene = function(targetScene)
{
	var sceneName, preset;
	for(var i in this.presets)
	{
		var parts = i.split(AV.strDelim);
		if(parts[1] == targetScene)
		{
			preset = this.presets[i];
			sceneName = parts[0];
			keyName = i;
		}
	}
	var r = {};
	r["preset"] = preset,
	r["name"] = sceneName;
	r["keyName"] = keyName;
	return r;
},
CustomSceneHandler.prototype.saveCustomScene = function(scene)
{
	var keyName = generateSaveName(scene);
	var sceneSetting = scene.settings;
	this.treatSetting(sceneSetting, scene);
	storage.scenes.insert(keyName, sceneSetting,function(scenes)
		{
			var xscene = this.refreshCustomScenes(scenes);
			this.sceneSelector.setScene(xscene);
		}.bind(this)
	);
	aLog("saving as :" + keyName, 1);
},
CustomSceneHandler.prototype.saveFromJson = function(json)
{
	var keyObject = jsonFromSaveName(json.key);
	getAvailableSaveName(function(availableSaveName){
		var saveName = generateSaveNameFromJson(keyObject, availableSaveName);
		storage.scenes.insert(saveName, json.settings, function(scenes){
			this.refreshCustomScenes(scenes);
			this.sceneSelector.setScene(availableSaveName);
		}.bind(this));
	}.bind(this), keyObject.saveName);
	aLog("saving as :" + json.key, 1);
},
CustomSceneHandler.prototype.exportToJson = function(scene)
{
	var keyName = generateSaveName(scene);
	var sceneSetting = scene.settings;
	this.treatSetting(sceneSetting, scene);
	return {key: keyName, settings: sceneSetting};
},
CustomSceneHandler.prototype.refreshCustomScenes = function(scenes)
{
	var scene = this.sceneSelector.insertPresets(scenes);
	this.presets = scenes;
	return scene;
},
CustomSceneHandler.prototype.treatSetting = function(settings, scene)
{	
	if (scene.originalName === 'MilkDrop') {
		//we dont want to store presets, its static anyways.. very hacky but yeah
		//whatever
		delete settings.presets;
	}
	for(var i in settings)
	{
		var x = [].concat(settings[i]);
		if(x.length == 3)
		{
			// it iz g.ctx see swipeSceneSettings
			settings[i][0] = "g.ctx";
		}
	}
},
generateSaveName = function(scene)
{
	return scene.originalName + AV.strDelim + g.saveSceneName;
},
generateSaveNameFromJson = function(obj, saveName){
	return obj.original + AV.strDelim + saveName;
}
jsonFromSaveName = function(saveName){
	var values = saveName.split(AV.strDelim);
	return {original: values[0], saveName: values[1]};
}
