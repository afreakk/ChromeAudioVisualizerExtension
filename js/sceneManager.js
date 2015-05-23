var SceneManager = function(scenes, sceneSelector, system)
{
    this.scenes = scenes;
    this.sceneSelector = sceneSelector;
	this.currentScene = null;
};
SceneManager.prototype.init = function(system)
{
	this.system = system
    this.initCurrentScene();
};
SceneManager.prototype.cleanUpCurrentScene = function()
{
	if('cleanUp' in this.currentScene)
		this.currentScene.cleanUp();
}
SceneManager.prototype.initCurrentScene = function()
{
    aLog("init scene: " + this.sceneSelector.scene, 1);
	resetBrokenGlobalSceneValues();
	var customScene = null;
	if(this.sceneSelector.scene in this.scenes)
	{
		this.currentScene = this.scenes[this.sceneSelector.scene];
		this.currentScene.parseSettings("default");
	}
	else
	{
		customScene = g.customSceneHandler.loadCustomScene(this.sceneSelector.scene);
		aLog("loading custom settings for sceneName: "+customScene.name, 1);
		this.currentScene = this.scenes[customScene.name];
		this.currentScene.parseSettings(customScene.preset);
		this.currentScene.name = this.sceneSelector.scene;
	}
	//level with custom settings
	if('init' in this.currentScene)
		this.currentScene.init();
	g.saveSceneName = this.currentScene.name;
	setSaveName();
	errors = g.gui.repopulateFolder(this.currentScene.settings, "Scene-Settings");
	if(customScene&&errors.length>0)
		handleSceneSettingError(errors, customScene.keyName);

};
function handleSceneSettingError(errors, keyName)
{
	errorStr = '';
	errors.forEach(
		function(e)
		{
			errorStr += e;
		}
	);
	if(errorStr.length>0)
		storage.scenes.setError(keyName, errorStr)
}
SceneManager.prototype.update = function()
{
	if(!g.pause)
	{
		window.requestAnimationFrame(this.update.bind(this));
		this.system.update(this.currentScene);
		if(this.sceneSelector.scene != this.currentScene.name)
		{
			this.cleanUpCurrentScene();
			this.initCurrentScene();
		}
	}
	else
		aLog("scene paused");
};
