var FunniThing = function(x,y,height,width){
	this.init = function(x,y,height,width){
		this.x = x;
		this.y = y;
		this.width = height;
		this.height = width;
	};
	this.init(x,y,height,width);
	this.update = function(v){
		this.x += Math.sin(v)*v;
		this.y += Math.cos(v)*v;
		if(this.x > g.canvas.width + this.width){
			this.x = -this.width;
		}
		if(this.x < -this.width){
			this.x = g.canvas.width + this.width;
		}
		if(this.y > g.canvas.height + this.height){
			this.y = -this.width;
		}
		if(this.y < -this.height){
			this.y = g.canvas.height + this.height;
		}
	};
	this.draw = function(v){
		g.ctx.fillStyle = this.getClr(v);
		g.ctx.fillRect(this.x, this.y, this.width, this.height);
		g.ctx.fillStyle = '#000000';
		g.ctx.strokeRect(this.x, this.y, this.width, this.height);
	};
	this.getClr = function(v){
		return rgbToHex(
			(Math.sin(v)/2.0+0.5)*v*v*v,
			(Math.cos(v)/2.0+0.5)*v*v*v,
			(Math.sin(v)/2.0+0.5)*v*v*v
		);
	};
};

DancingCubesSettings = function()
{
    this.danceSpeed = 0.05;
	this.particleCount = 220;
};
AudioScenes.DancingCubes = function()
{
    this.name = "DancingCubes";
	this.particles = [];
};
AudioScenes.DancingCubes.prototype.getClr = function(rgbS,scaled_average_c)
{
    return rgbToHex(
            (Math.sin(rgbS)/2.0+0.5)*scaled_average_c,
            (Math.cos(rgbS)/2.0+0.5)*scaled_average_c,
            (Math.sin(rgbS+this.settings.colorOffset)/2.0+0.5)*scaled_average_c
            );
}
AudioScenes.DancingCubes.prototype.parseSettings = function(preset)
{
	parseSettings(this,DancingCubesSettings, preset);
};
AudioScenes.DancingCubes.prototype.clearBg = function()
{
	g.ctx.fillStyle = '#000000';
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
			sum =g.byteFrequency[i]*xs.danceSpeed;
		}
		this.particles[i].update(sum);
		this.particles[i].draw(sum);
	}
};
