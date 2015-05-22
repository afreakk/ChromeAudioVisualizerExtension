//System class
var System = function()
{
};
System.prototype.update = function(scene)
{
	if(g.ShowFps)
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
	if(typeof layer != 'undefined'
		&&layer == 3)
		console.log(msg);
}

function togglePause()
{
	g.pause = !g.pause;
	aLog("toggling pause: "+g.pause, 1);
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
