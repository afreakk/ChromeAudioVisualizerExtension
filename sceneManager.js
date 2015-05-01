function handlePause()
{
	console.log("handlgin pause");
	if(g.pause)
	{
		g.canvas.style.visibility = "hidden";
	}
	else
	{
		g.canvas.style.visibility = "visible";
		g.sceneManager.update();
	}
}
function canvasResize()
{
	g.canvas.width = window.innerWidth;
	g.canvas.height = window.innerHeight;
	g.canvas.style.top = window.scrollY.toString()+"px";
	g.canvas.style.left = window.scrollX.toString()+"px";
}
var SceneManager = function(scenes, sceneSelector, gui)
{
    this.sceneSelector = sceneSelector;
    this.gui = gui;
    this.scenes = scenes;
    this.currentScene = null;
    this.initNewScene();
};

SceneManager.prototype.update = function()
{
	if(!g.pause)
	{
		window.requestAnimationFrame(this.update.bind(this));
		canvasResize();
		if(!g.byteFrequency)
			return;
		g.port.postMessage("r");
		this.currentScene.update();
		if(this.sceneSelector.scene != this.currentScene.name)
			this.initNewScene();
	}
};

SceneManager.prototype.initNewScene = function()
{
    console.log("init scene: " + this.sceneSelector.scene);
    this.currentScene = this.scenes[this.sceneSelector.scene];
    this.gui.refresh(this.currentScene.settings);
    this.currentScene.init();
};

var GUI = function(datGUI)
{
    this.gui = datGUI;
    this.guiElements = [];
};

GUI.prototype.refresh = function(elements)
{
    while(this.guiElements.length>0)
        this.gui.remove(this.guiElements.pop());
    for(var elem in elements)
        if(elements.hasOwnProperty(elem))
            this.guiElements.push(this.gui.add(elements, elem));
};
