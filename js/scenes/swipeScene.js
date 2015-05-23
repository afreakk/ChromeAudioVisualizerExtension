
var avCompOps = [
	'source-over','source-atop','source-in','source-out','destination-over',
	'destination-atop', 'destination-in', 'destination-out','lighter', 'copy','xor'
];
var SwipeSceneSettings = function()
{
	this.compositeOperation = [g.ctx, 'globalCompositeOperation', avCompOps];
	this.spinSpeed = 0.0001;
	this.lineWidth = 0.0005;
	this.particleAmnt = 100;
	this.particleSpread = 0.005;
	this.particleRadiusScale = 0.0004;
	this.thickScale = 0.0025;
	this.colorMoveSpeed = 0.0005;
};

AudioScenes.SwipeScene = function()
{
    this.name = "Swipe";
	this.rand = function(a,b)
	{
		return ~~((Math.random()*(b-a+1))+a);
	},
	this.dToR = function(degrees){
		return degrees * (Math.PI / 180);
	},
	this.init = function(){
		this.origGlobalCompOp = g.ctx.globalCompositeOperation;
		g.ctx.globalCompositeOperation = 'lighter';
		this.circle = {
		  x: (g.canvas.width / 2) + 5,
		  y: (g.canvas.height / 2) + 22,
		  radius: 90,
		  speed: 2,
		  rotation: 0,
		  angleStart: 270,
		  angleEnd: 90,
		  hue: 220,
		  thickness: 18,
		},
		this.particles = [],
		this.setColors();
	},
	this.setColors = function()
	{
		/* Set Constant Properties */
		g.ctx.shadowColor = 'hsla('+this.circle.hue+', 80%, 60%, 1)';
		g.ctx.lineCap = 'round'

		this.gradient1 = g.ctx.createLinearGradient(0, -this.circle.radius, 0, this.circle.radius);
		this.gradient1.addColorStop(0, 'hsla('+this.circle.hue+', 60%, 50%, .25)');
		this.gradient1.addColorStop(1, 'hsla('+this.circle.hue+', 60%, 50%, 0)');

		this.gradient2 = g.ctx.createLinearGradient(0, -this.circle.radius, 0, this.circle.radius);
		this.gradient2.addColorStop(0, 'hsla('+this.circle.hue+', 100%, 50%, 0)');
		this.gradient2.addColorStop(.1, 'hsla('+this.circle.hue+', 100%, 100%, .7)');
		this.gradient2.addColorStop(1, 'hsla('+this.circle.hue+', 100%, 50%, 0)');
	},
	this.updateCircle = function(volume)
	{
		volume = volume ? volume : 0;
		this.circle.thickness = volume*this.settings.thickScale;
		this.circle.speed = volume*this.settings.spinSpeed;
		this.circle.hue += volume*this.settings.colorMoveSpeed;
		if(this.circle.rotation < 360)
			this.circle.rotation += this.circle.speed;
		else
			this.circle.rotation = 0;
    },
    this.renderCircle = function(){
      g.ctx.save();
      g.ctx.translate(this.circle.x, this.circle.y);
      g.ctx.rotate(this.dToR(this.circle.rotation));
      g.ctx.beginPath();
      g.ctx.arc(0, 0, this.circle.radius,
			  this.dToR(this.circle.angleStart), this.dToR(this.circle.angleEnd), true);
	  g.ctx.lineWidth = this.circle.thickness;
      g.ctx.strokeStyle = this.gradient1;
      g.ctx.stroke();
      g.ctx.restore();
    },
    this.renderCircleBorder = function(volume){
      g.ctx.save();
      g.ctx.translate(this.circle.x, this.circle.y);
      g.ctx.rotate(this.dToR(this.circle.rotation));
      g.ctx.beginPath();
      g.ctx.arc(0, 0, this.circle.radius + (this.circle.thickness/2), this.dToR(this.circle.angleStart), this.dToR(this.circle.angleEnd), true);
      g.ctx.lineWidth = volume*this.settings.lineWidth;
      g.ctx.strokeStyle = this.gradient2;
      g.ctx.stroke();
      g.ctx.restore();
    },
        this.renderCircleFlare = function(){
      g.ctx.save();
      g.ctx.translate(this.circle.x, this.circle.y);
      g.ctx.rotate(this.dToR(this.circle.rotation+185));
      g.ctx.scale(1,1);
      g.ctx.beginPath();
      g.ctx.arc(0, this.circle.radius, 30, 0, Math.PI *2, false);
      g.ctx.closePath();
      var gradient3 = g.ctx.createRadialGradient(0, this.circle.radius, 0, 0, this.circle.radius, 30);
      gradient3.addColorStop(0, 'hsla(330, 50%, 50%, .35)');
      gradient3.addColorStop(1, 'hsla(330, 50%, 50%, 0)');
      g.ctx.fillStyle = gradient3;
      g.ctx.fill();
      g.ctx.restore();
    },
    this.renderCircleFlare2 = function(){
      g.ctx.save();
      g.ctx.translate(this.circle.x, this.circle.y);
      g.ctx.rotate(this.dToR(this.circle.rotation+165));
      g.ctx.scale(1.5,1);
      g.ctx.beginPath();
      g.ctx.arc(0, this.circle.radius, 25, 0, Math.PI *2, false);
      g.ctx.closePath();
      var gradient4 = g.ctx.createRadialGradient(0, this.circle.radius, 0, 0, this.circle.radius, 25);
      gradient4.addColorStop(0, 'hsla(30, 100%, 50%, .2)');
      gradient4.addColorStop(1, 'hsla(30, 100%, 50%, 0)');
      g.ctx.fillStyle = gradient4;
      g.ctx.fill();
      g.ctx.restore();
    },
    this.createParticles = function(volume){
		if(this.particles.length < this.settings.particleAmnt)
		{
			var particleSpread = volume*this.settings.particleSpread,
			radiusSpread = volume*this.settings.particleRadiusScale;
			this.particles.push({
				x: (this.circle.x + this.circle.radius
					* Math.cos(this.dToR(this.circle.rotation-85)))
					+ (this.rand(0, this.circle.thickness*2) - this.circle.thickness),
				y: (this.circle.y + this.circle.radius
					* Math.sin(this.dToR(this.circle.rotation-85)))
					+ (this.rand(0, this.circle.thickness*2) - this.circle.thickness),
				vx: this.rand(particleSpread, particleSpread)/1000,
				vy: this.rand(particleSpread, particleSpread)/1000,
				radius: radiusSpread,
				alpha: this.rand(10, 20)/100
        });
      }
    },
    this.updateParticles = function(){
      var i = this.particles.length;
      while(i--){
          var p = this.particles[i];
        p.vx += (this.rand(0, 100)-50)/750;
        p.vy += (this.rand(0, 100)-50)/750;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= .01;

        if(p.alpha < .02){
          this.particles.splice(i, 1)
        }
      }
    },
    this.renderParticles = function(){
      var i = this.particles.length;
      while(i--){
          var p = this.particles[i];
        g.ctx.beginPath();
        g.ctx.fillRect(p.x, p.y, p.radius, p.radius);
        g.ctx.closePath();
        g.ctx.fillStyle = 'hsla(0, 0%, 100%, '+p.alpha+')';
      }
    },
    this.update = function(){
		volume = getVolume();
		this.updateCircle(volume);
		this.setColors();
		this.renderCircle();
		this.renderCircleBorder(volume);
		this.renderCircleFlare();
		this.renderCircleFlare2();
		this.createParticles(volume);
		this.updateParticles();
		this.renderParticles();
	};


};
AudioScenes.SwipeScene.prototype.getClr = function(rgbS,scaled_average_c)
{
    return rgbToHex(
            (Math.sin(rgbS)/2.0+0.5)*scaled_average_c,
            (Math.cos(rgbS)/2.0+0.5)*scaled_average_c,
            (Math.sin(rgbS+this.settings.colorOffset)/2.0+0.5)*scaled_average_c
            );
}
AudioScenes.SwipeScene.prototype.parseSettings = function(preset)
{
	parseSettings(this,SwipeSceneSettings, preset);
};
AudioScenes.SwipeScene.prototype.cleanUp = function()
{
	g.ctx.globalCompositeOperation = this.origGlobalCompOp;
}
AudioScenes.SwipeScene.prototype.clearBg = function(clearColored)
{
	var old = g.ctx.globalCompositeOperation;
	g.ctx.globalCompositeOperation = 'destination-out';
	g.ctx.fillStyle = 'rgba(0, 0, 0, .1)';
	g.ctx.fillRect(0, 0, g.canvas.width, g.canvas.height);
	g.ctx.globalCompositeOperation = old;
};
