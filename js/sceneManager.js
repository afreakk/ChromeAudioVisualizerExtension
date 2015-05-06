var SceneManager = function(scenes, sceneSelector, gui)
{
    this.scenes = scenes;
    this.sceneSelector = sceneSelector;
	this.system = new System(gui);
	this.currentScene = null;
    this.initCurrentScene();
};
SceneManager.prototype.cleanUpCurrentScene = function()
{
	if('cleanUp' in this.currentScene)
		this.currentScene.cleanUp();
}
SceneManager.prototype.initCurrentScene = function()
{
    aLog("init scene: " + this.sceneSelector.scene);
	resetBrokenGlobalSceneValues();
    this.currentScene = this.scenes[this.sceneSelector.scene];
    this.currentScene.parseSettings();
	if('init' in this.currentScene)
		this.currentScene.init();
	this.system.refreshGUI(this.currentScene);
};
SceneManager.prototype.update = function()
{
	if(!g.pause)
	{
		this.system.update(this.currentScene);
		if(this.sceneSelector.scene != this.currentScene.name)
		{
			this.cleanUpCurrentScene();
			this.initCurrentScene();
		}
		window.requestAnimationFrame(this.update.bind(this));
	}
	else
		aLog("scene paused");
};
