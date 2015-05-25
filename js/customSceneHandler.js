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
	this.treatSetting(sceneSetting);
	storage.scenes.insert(keyName, sceneSetting,function(scenes)
		{
			var xscene = this.refreshCustomScenes(scenes);
			this.sceneSelector.setScene(xscene);
		}.bind(this)
	);
	aLog("saving as :" + keyName, 1);
},
CustomSceneHandler.prototype.refreshCustomScenes = function(scenes)
{
	var scene = this.sceneSelector.insertPresets(scenes);
	this.presets = scenes;
	return scene;
},
CustomSceneHandler.prototype.treatSetting = function(settings)
{
	for(var i in settings)
	{
		var x = [].concat(settings[i]);
		if(x.length == 3)
		{
			// it iz g.ctx see swipeSceneSettings
			settings[i][0] = "g.ctx";
		}
	}
};
function generateSaveName(scene)
{
	return scene.originalName+AV.strDelim+g.saveSceneName;
}
