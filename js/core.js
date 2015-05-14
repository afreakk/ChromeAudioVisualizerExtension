//System class
var System = function(datGUI)
{
	this.gui = new GUI(datGUI)
};
System.prototype.update = function(scene)
{
	if(g.debugFps)
	{
		setFps(true);
		g.stats.begin();
		this.updateScene(scene);
		g.stats.end();
	}
	else
	{
		setFps(false);
		this.updateScene(scene);
	}
	g.port.postMessage("r");
};
System.prototype.updateScene = function(scene)
{
	if(!g.byteFrequency)
		return
	scene.clearBg(g.transparentBackground);
	scene.update();
}
System.prototype.refreshGUI = function(scene)
{
    this.gui.refresh(scene.settings);
	this.gui.reCheckValuesInternally();
};

//GUI class
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
	{
        if(elements.hasOwnProperty(elem))
		{
			aLog("adding gui setting: "+elem);
			if(elem == 'spectrumJumps')
				this.guiElements.push(this.gui.add(elements, elem).step(1));
			else
				this.guiElements.push(this.gui.add(elements, elem));
		}
	}
};
GUI.prototype.reCheckValuesInternally = function()
{
	for (var i=0; i<this.gui.__controllers.length; i++) 
		this.gui.__controllers[i].updateDisplay();
};

//core functions
function canvasResize()
{
	g.canvas.width = window.innerWidth;
	g.canvas.height = window.innerHeight;
	var top = window.scrollY.toString()+"px";
	var left = window.scrollX.toString()+"px";
	g.canvas.style.top = top;
	g.canvas.style.left = left;
	g.stats.domElement.style.top = top;
	g.stats.domElement.style.left = left;

	//calculations
    s.widthInHalf = g.canvas.width/2;
    s.heightInHalf= g.canvas.height/2;
}
function copyCanvasDim(canvas)
{
	canvas.width = g.canvas.width;
	canvas.height = g.canvas.height;
	canvas.style.top = g.canvas.style.top;
	canvas.style.left = g.canvas.style.left;
	canvas.style.pointerEvents = g.canvas.style.pointerEvents;
}

function aLog(msg, layer)
{
	if(typeof layer != 'undefined')
		console.log(msg);
}

function togglePause()
{
	g.pause = !g.pause;
	console.log("toggling pause: "+g.pause);
	if(g.pause)
	{
		g.canvas.style.visibility = "hidden";
		g.datStyle.visibility = "hidden";
		g.stats.domElement.style.visibility = 'hidden';
		g.sceneManager.cleanUpCurrentScene();
	}
	else
	{
		canvasResize();
		g.canvas.style.visibility = "visible";
		g.datStyle.visibility = "visible";
		g.stats.domElement.style.visibility = 'visible';
		g.sceneManager.sceneSelector.setRandomScene();
		g.sceneManager.initCurrentScene();
		g.sceneManager.update();
	}
}
