
RoundSpectrumSettings = function()
{
    this.colorStrength = 0.75;
    this.colorOffset = Math.PI;
	this.spectrumJumps = 1;
	this.colorWidth = 0.1;
	this.musicColorInfluenceReducer =33000;
	this.innerWidth = g.canvas.width/10;
	this.staticWidth = 1.0;
	this.musicHeightPower = 0.01;
	this.circleMax = Math.PI*2.8;
};
AudioScenes.RoundSpectrum = function()
{
    this.name = "RoundSpectrum";
};
AudioScenes.RoundSpectrum.prototype.getClr = function(rgbS,scaled_average_c)
{
    return rgbToHex(
            (Math.sin(rgbS)/2.0+0.5)*scaled_average_c,
            (Math.cos(rgbS)/2.0+0.5)*scaled_average_c,
            (Math.sin(rgbS+this.settings.colorOffset)/2.0+0.5)*scaled_average_c
            );
}
AudioScenes.RoundSpectrum.prototype.parseSettings = function(preset)
{
	parseSettings(this,RoundSpectrumSettings, preset);
};
AudioScenes.RoundSpectrum.prototype.clearBg = function()
{
	g.ctx.fillStyle = '#000000';
	g.ctx.fillRect(0,0,g.canvas.width,g.canvas.height);
}
AudioScenes.RoundSpectrum.prototype.update = function()
{
    var xs = this.settings;

	var z = 0;
	var barWidth = xs.circleMax/g.frequencyBinCount;
	for(var i=0; i<g.frequencyBinCount; i++)
	{
		z = indexSpinner(z, xs.spectrumJumps);
		var specValue = g.byteFrequency[z]? g.byteFrequency[z] : 0;
		g.ctx.fillStyle=this.getClr(s.clrOffset,xs.colorStrength*specValue);
		s.clrOffset += xs.colorWidth-specValue/xs.musicColorInfluenceReducer;

		var theta = (i/g.frequencyBinCount)*xs.circleMax;
		var p = getTriangle(theta, xs.innerWidth, barWidth,
				xs.staticWidth+specValue*xs.musicHeightPower);
        g.ctx.beginPath();

        g.ctx.moveTo(p[0],p[1]);
        g.ctx.lineTo(p[2],p[3]);
        g.ctx.lineTo(p[4],p[5]);
        g.ctx.lineTo(p[6],p[7]);
        g.ctx.fill();
	}
};

function getTriangle(theta, baseWidth, barWidth, outerWidth)
{
	var cw2 = g.canvas.width/2;
	var ch2 = g.canvas.height/2;
	return	[
		Math.sin(theta)*baseWidth+cw2,
		Math.cos(theta)*baseWidth+ch2,

		(Math.sin(theta)*baseWidth)*outerWidth+cw2,
		(Math.cos(theta)*baseWidth)*outerWidth+ch2,

		(Math.sin(theta+barWidth)*baseWidth)*outerWidth+cw2,
		(Math.cos(theta+barWidth)*baseWidth)*outerWidth+ch2,

		Math.sin(theta+barWidth)*baseWidth+cw2,
		Math.cos(theta+barWidth)*baseWidth+ch2
	];
}
