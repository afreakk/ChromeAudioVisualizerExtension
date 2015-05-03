var SceneManager = function(scenes, sceneSelector, gui)
{
    this.scenes = scenes;
    this.sceneSelector = sceneSelector;
	this.system = new System(gui);
    this.initNewScene();
};
SceneManager.prototype.initNewScene = function()
{
    aLog("init scene: " + this.sceneSelector.scene);
    this.currentScene = this.scenes[this.sceneSelector.scene];
    this.currentScene.init();
	this.system.refreshGUI(this.currentScene);
};
SceneManager.prototype.update = function()
{
	if(!g.pause)
	{
		this.system.update(this.currentScene);
		if(this.sceneSelector.scene != this.currentScene.name)
			this.initNewScene();
		window.requestAnimationFrame(this.update.bind(this));
	}
	else
		aLog("scene paused");
};
