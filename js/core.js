//System class
var System = function(gui)
{
	this.gui = gui;
};
System.prototype.update = function(scene)
{
	g.stats.begin();
	//canvasResize();
	if(g.byteFrequency)
		scene.update();
	g.port.postMessage("r");
	g.stats.end();
};
System.prototype.refreshGUI = function(scene)
{
    this.gui.refresh(scene.settings);
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

function aLog(msg)
{
	console.log(msg);
}

function togglePause()
{
	g.pause = !g.pause;
	console.log("toggling pause: "+g.pause);
	if(g.pause)
	{
		g.canvas.style.visibility = "hidden";
		g.canvas.style.pointerEvents = "none";
		g.datStyle.visibility = "hidden";
		g.stats.domElement.style.visibility = 'hidden';
	}
	else
	{
		g.canvas.style.visibility = "visible";
		g.canvas.style.pointerEvents = "auto";
		g.datStyle.visibility = "visible";
		g.stats.domElement.style.visibility = 'visible';
		canvasResize();
		g.sceneManager.initCurrentScene();
		g.sceneManager.update();
	}
}
