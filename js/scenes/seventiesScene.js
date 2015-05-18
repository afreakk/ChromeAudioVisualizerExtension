SeventieSceneSettings = function()
{
	this.maxCircles = 40;
	this.fadeSpeed = 0.5;
	this.circleInCircleScale = 0.001;
	this.circleSizeScale = 0.000001;
	this.spawnTreshold = 785000.0;
	this.crowdSurpression = 1000;
	this.speedMusicScale = 0.00075;
};
AudioScenes.seventiesScene = function()
{
	this.name = "Seventies";
};
AudioScenes.seventiesScene.prototype.parseSettings = function(preset)
{
	parseSettings(this,SeventieSceneSettings, preset);
};
AudioScenes.seventiesScene.prototype.clearBg = function(clearColored)
{
    g.ctx.clearRect(0, 0, g.canvas.width, g.canvas.height);
	if(!clearColored)
	{
		g.ctx.fillStyle = '#000000';
		g.ctx.fillRect(0,0,g.canvas.width,g.canvas.height);
	}
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
	if (this.circles.length < this.settings.maxCircles
		&& vol/(this.circles.length/this.settings.crowdSurpression) > this.settings.spawnTreshold)
	{
		this.createCircle(vol);
	}
}

AudioScenes.seventiesScene.prototype.updateCircles=function(vol) {
	vol /= 10000;
	for(var i = 0; i < this.circles.length; i++)
	{
		this.circles[i].x += this.circles[i].velX*vol;
		this.circles[i].y += this.circles[i].velY*vol;
		this.circles[i].r += Math.max(this.circles[i].speed*vol, 1);
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
	var y = Math.random() * this.height;
	var speed = vol*this.settings.speedMusicScale;
	var hue_start = Math.random() * 360;
	var opacity_step = Math.PI / 20;
	var target_size = this.width / Math.floor(((vol*this.settings.circleSizeScale) * 16) + 6);
	var velX = (Math.random() * 8) - 4;
	var velY = (Math.random() * 8) - 4;
	var z=0;
	for (var i = 0; i < vol*this.settings.circleInCircleScale; i++)
	{
		this.circles.push
		(
			{
				x: x,
				y: y,
				r: i*2,
				velX: velX,
				velY: velY,
				target: target_size,
				speed: speed,
				hue: hue_start + i * 10,
				opacity: 1 - Math.abs(Math.cos(opacity_step * i))
			}
		);
	}
}
