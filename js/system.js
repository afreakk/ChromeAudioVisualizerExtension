//System class
var System = function()
{
};
System.prototype.update = function(scene)
{
	if(OV.ShowFps)
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
	g.port.postMessage(AV.music);
};
System.prototype.updateScene = function(scene)
{
	if(!g.byteFrequency)
		return
	scene.clearBg(OV.transparentBackground);
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

fullDebug=false;
function aLog(msg, layer)
{
	if((typeof layer != 'undefined'
		&&layer == 3)||fullDebug)
		console.log(msg);
}
function aError(e)
{
	console.error(e);
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
		setFps(g.showFps);
		g.sceneManager.sceneSelector.setRandomScene();
		g.sceneManager.initCurrentlyChoosenScene();
		g.sceneManager.update();
	}
}

function setSaveName(callback)
{
	storage.scenes.get(
		function(savedPresets)
		{
			var occupado = false;
			for(var preset in savedPresets)
			{
				var presetName = preset.split(AV.strDelim)[1];
				if(presetName == g.saveSceneName)
					occupado = true;
			}
			for(var sceneNameKey in g.sceneManager.scenes)
			{
				if(g.saveSceneName == sceneNameKey)
					occupado = true;
			}
			if(occupado)
			{
				if(g.saveSceneName.indexOf("_custom") === -1)
					g.saveSceneName = g.saveSceneName + "_custom";
				else
					g.saveSceneName = getIncrementalString(g.saveSceneName);
				setSaveName(callback);
			}
			else
			{
				g.gui.reCheckValuesInternally();
				if(callback)
					callback();
			}
		}
	);
}
