var SceneManager = function(scenes, sceneSelector, system)
{
    this.scenes = scenes;
    this.sceneSelector = sceneSelector;
	this.currentScene = null;
};
SceneManager.prototype.init = function(system)
{
	this.system = system
    this.initCurrentlyChoosenScene();
},
SceneManager.prototype.resizeCurrentScene = function()
{
	if(	this.currentScene && 
		"resizeCanvas" in this.currentScene)
		this.currentScene.resizeCanvas();
},
SceneManager.prototype.cleanUpCurrentScene = function()
{
	if('cleanUp' in this.currentScene)
		this.currentScene.cleanUp();
},
SceneManager.prototype.initCurrentlyChoosenScene = function()
{
	var oldScene;
	if(this.currentScene)
		oldScene = this.currentScene.name;
	try
	{
		resetBrokenGlobalSceneValues();
		var custom = this.initScene(g.sceneSelector.scene);
		g.saveSceneName = this.currentScene.name;
		setSaveName();
		var errors = g.gui.repopulateFolder(this.currentScene.settings, "Scene-Settings");
		if(custom&&errors.length>0)
			handleSceneSettingError(errors, custom);
	}
	catch(e)
	{
		aError(e);
		if(oldScene)
		{
			this.cleanUpCurrentScene();
			this.sceneSelector.setScene(oldScene);
			this.initCurrentlyChoosenScene();
		}
		refreshCustomScenes();
	}
},
SceneManager.prototype.initScene=function(newScene)
{
    aLog("init scene: " + newScene, 1);
	var customScene = null;
	if(newScene in this.scenes)
		this.initDefaultScene(newScene);
	else
		customScene = this.initCustomScene(newScene);
		//level with custom settings

	if('init' in this.currentScene)
		this.currentScene.init();
	return customScene;
},
SceneManager.prototype.initDefaultScene = function(newScene)
{
	this.currentScene = this.scenes[newScene];
	this.currentScene.parseSettings("default");
},
SceneManager.prototype.initCustomScene = function(newScene)
{
	var customScene = g.customSceneHandler.loadCustomScene(newScene);
	aLog("loading custom settings for sceneName: "+customScene.name, 1);
	this.currentScene = this.scenes[customScene.name];
	this.currentScene.parseSettings(customScene.preset);
	this.currentScene.name = newScene;
	return customScene.keyName;
},
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
},
SceneManager.prototype.update = function()
{
	if(!g.pause)
	{
		window.requestAnimationFrame(this.update.bind(this));
		this.system.update(this.currentScene);
		if(this.sceneSelector.scene != this.currentScene.name)
		{
			this.cleanUpCurrentScene();
			this.initCurrentlyChoosenScene();
		}
	}
	else
		aLog("scene paused");
};
