SeventieSceneSettings = function()
{
	this.fadeSpeed = 0.5;
	this.circleResolution = 15;
	this.circleScale = 15;
	this.spawnTreshold = 785000.0;
	this.crowdSurpression = 0.0009;
	this.speedMusicScale = 10;
	this.speedReducer = 5000;
	this.targetSize = 50;
};
AudioScenes.seventiesScene = function()
{
	this.name = "Seventies";
};
AudioScenes.seventiesScene.prototype.parseSettings = function(preset)
{
	parseSettings(this,SeventieSceneSettings, preset);
};
AudioScenes.seventiesScene.prototype.clearBg = function()
{
	g.ctx.fillStyle = '#000000';
	g.ctx.fillRect(0,0,g.canvas.width,g.canvas.height);
};
AudioScenes.seventiesScene.prototype.init = function()
{
	this.c = g.ctx;
	this.width = g.canvas.width;
	this.height = g.canvas.height;
	this.circles = [];
};
AudioScenes.seventiesScene.prototype.update = function()
{
	var vol = getVolume();
	this.startCircles(vol);
	this.updateCircles(vol);
	this.drawCircles();
}
AudioScenes.seventiesScene.prototype.drawCircle=function(x, y, r) {
	var circle = new Path2D();
	circle.arc(x, y, r, 0, 2 * Math.PI);
	this.c.stroke(circle);
}


AudioScenes.seventiesScene.prototype.startCircles=function(vol) {
	if (vol/(this.circles.length*this.settings.crowdSurpression)
		> this.settings.spawnTreshold)
	{
		this.createCircle(vol);
	}
}

AudioScenes.seventiesScene.prototype.updateCircles=function(vol) {
	vol /= this.settings.speedReducer;
	var data = Object.values(g.byteFrequency);
	var bottom = data.slice(0,data.length/10).reduce(function(a,b){
		return a + b;
	}, 0);
	var top = data.slice(data.length/10, data.length).reduce(function(a,b){
		return a + b;
	}, 0);
	var controller = (top - bottom)/this.settings.speedReducer;
	for(var i = 0; i < this.circles.length; i++)
	{
		this.circles[i].x += controller;
		this.circles[i].y += vol;
		this.circles[i].r += vol;
		this.circles[i].hue+=vol;
		if (this.circles[i].r > this.circles[i].target)
		{
			this.circles[i].opacity -= this.settings.fadeSpeed*vol;
			if (this.circles[i].opacity <= 0)
			{
				this.circles.splice(i, 1);
			}
		}
	}
}

AudioScenes.seventiesScene.prototype.drawCircles=function() {
	for(var i = 0; i < this.circles.length; i++)
	{
		var circle = this.circles[i];
		this.c.lineWidth = 4;
		this.c.strokeStyle = "hsla(" + circle.hue + ", 100%, 50%, " + circle.opacity + ")";
		this.drawCircle(circle.x, circle.y, circle.r);
	}
}


AudioScenes.seventiesScene.prototype.createCircle=function(vol) {
	var x = Math.random() * this.width;
	var y = Math.max(0,Math.min(this.height - vol/10, this.height));
	var speed = this.settings.speedMusicScale;
	var hue_start = Math.random() * 360;
	var opacity_step = Math.PI / 20;
	var target_size = this.settings.targetSize;
	var z=0;
	for (var i = 0; i <this.settings.circleResolution; i++)
	{
		this.circles.push
		(
			{
				x: x,
				y: y,
				r: i*2,
				target: target_size,
				speed: speed,
				hue: hue_start + i * 10,
				opacity: 1 - Math.abs(Math.cos(opacity_step * i))
			}
		);
	}
}
