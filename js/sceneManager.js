var SceneManager = function(scenes, sceneSelector, system)
{
    this.scenes = scenes;
    this.sceneSelector = sceneSelector;
	this.currentScene = null;
};
SceneManager.prototype.init = function(system)
{
	this.system = system || this.system;
	canvasResize();
	g.ctx.resetTransform();
	this.initNextScene();
},
SceneManager.prototype.resizeCurrentScene = function()
{
	if(	this.currentScene && 
		"resizeCanvas" in this.currentScene)
		this.currentScene.resizeCanvas();
},
SceneManager.prototype.cleanUpCurrentScene = function()
{
	if(this.currentScene&&'cleanUp' in this.currentScene)
		this.currentScene.cleanUp();
},
SceneManager.prototype.initNextScene=function()
{
	var sceneInited=false;
	var settingsKeyName;
	var tries=0;
	while(!sceneInited)
	{
		try
		{
			sceneInited=true;
			settingsKeyName = this.initCurrentlyChoosenScene();
			this.currentScene.clearBg();
			this.system.update(this.currentScene);
		}
		catch(e)
		{
			sceneInited=false;
			aError(e);
			handleSceneSettingError([e.message], settingsKeyName);
			if(g.sceneSelector.scene)
				this.cleanUpCurrentScene();
			this.sceneSelector.setRandomScene(true);
			refreshCustomScenes();
			if(tries++>10)
				throw "this is not working";
		}
	}
},
SceneManager.prototype.initCurrentlyChoosenScene = function()
{
	resetBrokenGlobalSceneValues();
	var settingsKeyName = this.initScene(g.sceneSelector.scene);
	if(!this.currentScene)
		return settingsKeyName;
	g.saveSceneName = this.currentScene.name;
	setSaveName();
	var settingErrors = g.gui.repopulateFolder(
				this.currentScene.settings, "Scene settings");
	handleSceneSettingError(settingErrors, settingsKeyName);
	return settingsKeyName;
},
SceneManager.prototype.initScene=function(newScene)
{
    aLog("init scene: " + newScene, 1);
	var customScene = null;
	if(newScene in this.scenes)
		this.setDefaultScene(newScene);
	else
		customScene = this.initCustomScene(newScene);
		//level with custom settings

	if(this.currentScene&&'init' in this.currentScene)
		this.currentScene.init();
	return customScene;
},
SceneManager.prototype.setDefaultScene = function(newScene)
{
	this.currentScene = this.scenes[newScene];
	this.currentScene.parseSettings("default");
},
SceneManager.prototype.initCustomScene = function(newScene)
{
	var customScene = g.customSceneHandler.loadCustomScene(newScene);
	aLog("loading custom settings for sceneName: "+customScene.name, 1);
	this.currentScene = this.scenes[customScene.name];
	try
	{
		this.currentScene.parseSettings(customScene.preset);
		this.currentScene.name = newScene;
	}
	catch(e)
	{
		aError(e);
	}
	return customScene.keyName;
},
SceneManager.prototype.update = function()
{
	if(!g.pause)
	{
		window.requestAnimationFrame(this.update.bind(this));
		if(this.sceneSelector.scene != this.currentScene.name)
		{
			this.cleanUpCurrentScene();
			this.initNextScene();
		}
		this.system.update(this.currentScene);
	}
	else
		aLog("scene paused");
};

function handleSceneSettingError(errors, keyName)
{
	errorStr = '';
	errors.forEach(
		function(e)
		{
			if(typeof e === 'string')
				errorStr += e;
		}
	);
	if(errorStr.length>0&&keyName)
		storage.scenes.setError(keyName, errorStr)
}
