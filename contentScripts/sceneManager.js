var SceneManager = function(scenes, sceneSelector, gui)
{
    this.scenes = scenes;
    this.sceneSelector = sceneSelector;
    this.gui = gui;
    this.currentScene = null;
    this.initNewScene();
};

SceneManager.prototype.update = function()
{
	if(!g.pause)
	{
		g.stats.begin();

		canvasResize();

		if(g.byteFrequency)
			this.currentScene.update();

		if(this.sceneSelector.scene != this.currentScene.name)
			this.initNewScene();

		g.port.postMessage("r");

		g.stats.end();
		window.requestAnimationFrame(this.update.bind(this));
	}
};

SceneManager.prototype.initNewScene = function()
{
    console.log("init scene: " + this.sceneSelector.scene);
    this.currentScene = this.scenes[this.sceneSelector.scene];
    this.gui.refresh(this.currentScene.settings);
    this.currentScene.init();
};
