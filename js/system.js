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
	window.g.port.postMessage(AV.music);
};
System.prototype.updateScene = function(scene)
{
	if(!g.byteFrequency)
		return
	if(	g.canvas.width != document.body.clientWidth ||
		g.canvas.height != window.innerHeight)
		canvasResize();
	if(!OV.DrawMode&&g.ctx.clearRect)
		g.ctx.clearRect(0,0,g.canvas.width,g.canvas.height);
	if(!OV.transparentBackground&&!OV.DrawMode)
		scene.clearBg();
	scene.update();
}

