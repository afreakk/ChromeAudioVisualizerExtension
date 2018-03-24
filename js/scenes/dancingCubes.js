var FunniThing = function(x,y){
	this.init = function(x,y){
		this.x = x;
		this.y = y;
	};
	this.init(x,y);
	this.update = function(v,width,height,speed,directionChangeSpeed){
		this.x += Math.sin(v*directionChangeSpeed)*v*speed;
		this.y += Math.cos(v*directionChangeSpeed)*v*speed;
		if(this.x > g.canvas.width + width){
			this.x = -width;
		}
		if(this.x < -width){
			this.x = g.canvas.width + width;
		}
		if(this.y > g.canvas.height + height){
			this.y = -width;
		}
		if(this.y < -height){
			this.y = g.canvas.height + height;
		}
	};
	this.draw = function(v,width,height,borderR,borderG,borderB,borderWidth,colorStr,colorChangeSpeed){
		g.ctx.fillStyle = this.getClr(v,colorStr,colorChangeSpeed);
		g.ctx.fillRect(this.x, this.y, width, height);
		g.ctx.strokeStyle = rgbToHex(borderR,borderG,borderB);
		g.ctx.lineWidth = borderWidth;
		g.ctx.strokeRect(this.x, this.y, width, height);
	};
	this.getClr = function(v,colorStr,colorChangeSpeed){
		var change = v*colorChangeSpeed;
		return rgbToHex(
			(Math.sin(change)/2.0+0.5)*v*colorStr,
			(Math.cos(change)/2.0+0.5)*v*colorStr,
			(Math.tan(change)/2.0+0.5)*v*colorStr
		);
	};
};

DancingCubesSettings = function()
{
    this.danceSpeed = 0.05;
	this.directionChangeSpeed = 0.05;

	this.particleCount = 140;

	this.cubeWidth = 25;
	this.cubeHeight = 25;

	this.backgroundRed = 0;
	this.backgroundGreen = 0;
	this.backgroundBlue = 0;
	this.backgroundAlpha = 0.99;

	this.cubeBorderRed = 10;
	this.cubeBorderGreen = 10;
	this.cubeBorderBlue = 10;

	this.cubeBorderWidth = 2;

	this.cubeColorStrength = 0.75;
	this.cubeColorChangeSpeed = 0.05;
};
AudioScenes.DancingCubes = function()
{
    this.name = "DancingCubes";
	this.particles = [];
};
AudioScenes.DancingCubes.prototype.parseSettings = function(preset)
{
	parseSettings(this,DancingCubesSettings, preset);
};
AudioScenes.DancingCubes.prototype.clearBg = function()
{
	g.ctx.fillStyle = 'rgba('+this.settings.backgroundRed+
		','+this.settings.backgroundGreen+','+this.settings.backgroundBlue+','+this.settings.backgroundAlpha+')';
	g.ctx.fillRect(0,0,g.canvas.width,g.canvas.height);
}
AudioScenes.DancingCubes.prototype.update = function()
{
    var xs = this.settings;
	for(var i=0; i<xs.particleCount; i++){
		if(!this.particles[i]){
			this.particles[i] = new FunniThing(
				Math.random()*g.canvas.width,
				Math.random()*g.canvas.height,
				25,
				25
			);
		}
		var sum = 0;
		if(!isNaN(g.byteFrequency[i])){
			sum =g.byteFrequency[i];
		}
		this.particles[i].update(sum,xs.cubeWidth,xs.cubeHeight,xs.danceSpeed,xs.directionChangeSpeed);
		this.particles[i].draw(sum,xs.cubeWidth,xs.cubeHeight,xs.cubeBorderRed,xs.cubeBorderGreen,xs.cubeBorderBlue,xs.cubeBorderWidth,xs.cubeColorStrength,xs.cubeColorChangeSpeed);
	}
};
