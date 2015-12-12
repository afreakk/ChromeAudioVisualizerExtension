
ParticleCircleSettings = function()
{
    this.colorStrength = 0.75;
    this.colorOffset = Math.PI;
	this.spectrumJumps = 1;
	this.colorWidth = 0.1;
	this.musicColorInfluenceReducer =33000;
	this.innerWidth = g.canvas.width/1000;
	this.particleWidth = 0.06;
	this.musicScale = 1.01;
	this.circleMax = Math.PI*2.8;
};
AudioScenes.ParticleCircle = function()
{
    this.name = "ParticleCircle";
};
AudioScenes.ParticleCircle.prototype.getClr = function(rgbS,scaled_average_c)
{
    return rgbToHex(
            (Math.sin(rgbS)/2.0+0.5)*scaled_average_c,
            (Math.cos(rgbS)/2.0+0.5)*scaled_average_c,
            (Math.sin(rgbS+this.settings.colorOffset)/2.0+0.5)*scaled_average_c
            );
}
AudioScenes.ParticleCircle.prototype.parseSettings = function(preset)
{
	parseSettings(this,ParticleCircleSettings, preset);
};
AudioScenes.ParticleCircle.prototype.clearBg = function()
{
	g.ctx.fillStyle = '#000000';
	g.ctx.fillRect(0,0,g.canvas.width,g.canvas.height);
}
AudioScenes.ParticleCircle.prototype.update = function()
{
    var xs = this.settings;

	var z = 0;
	var barWidth = xs.circleMax/g.frequencyBinCount;
	for(var i=0; i<g.frequencyBinCount; i++)
	{
		z = indexSpinner(z, xs.spectrumJumps);
		var specValue = g.byteFrequency[z]? g.byteFrequency[z] : 0;
		scaledSpec = specValue*xs.musicScale,
		g.ctx.fillStyle=this.getClr(s.clrOffset,xs.colorStrength*specValue),
		s.clrOffset += xs.colorWidth-specValue/xs.musicColorInfluenceReducer;

		var theta = (i/g.frequencyBinCount)*xs.circleMax,
		cw2 = g.canvas.width/2,
		ch2 = g.canvas.height/2;

		var x = Math.sin(theta)*(xs.innerWidth+scaledSpec)+cw2,
			y =	Math.cos(theta)*(xs.innerWidth+scaledSpec)+ch2;
		drawCircle(x,y, xs.particleWidth*scaledSpec);
	}
};
function drawCircle(x, y, radius)
{
	g.ctx.beginPath();
	g.ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
	g.ctx.fill();
	/*
	g.ctx.lineWidth = 5;
	g.ctx.strokeStyle = '#003300';
	g.ctx.stroke();
	*/
}
