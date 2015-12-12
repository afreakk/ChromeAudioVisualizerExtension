
DotsAndLinesFlatSettings = function()
{
    this.colorStrength = 1.0;
    this.colorOffset = Math.PI;
	this.spectrumJumps = 32;
	this.colorWidth = 0.001;
	this.musicColorInfluenceReducer =40000;
	this.innerWidth = Math.PI;
	this.particleWidth = 0.06;
	this.musicScale = 1.0;
	this.circleMax = Math.PI*2;
	this.dotAmnt = 128;
	this.lineWidth=1.0;
};
AudioScenes.DotsAndLinesFlat = function()
{
    this.name = "DotsAndLinesFlat";
};
AudioScenes.DotsAndLinesFlat.prototype.getClr = function(rgbS,scaled_average_c)
{
    return rgbToHex(
            (Math.sin(rgbS)/2.0+0.5)*scaled_average_c,
            (Math.cos(rgbS)/2.0+0.5)*scaled_average_c,
            (Math.sin(rgbS+this.settings.colorOffset)/2.0+0.5)*scaled_average_c
            );
}
AudioScenes.DotsAndLinesFlat.prototype.parseSettings = function(preset)
{
	parseSettings(this,DotsAndLinesFlatSettings, preset);
};
AudioScenes.DotsAndLinesFlat.prototype.clearBg = function()
{
	g.ctx.fillStyle = '#000000';
	g.ctx.fillRect(0,0,g.canvas.width,g.canvas.height);
}
AudioScenes.DotsAndLinesFlat.prototype.update = function()
{
    var xs = this.settings;

	g.ctx.lineWidth=xs.lineWidth;
	var z = 0;
	var barWidth = (xs.circleMax/xs.dotAmnt)/2;
	var x,y,oldX,oldY;
	for(var i=0; i<xs.dotAmnt; i++)
	{

		z = indexSpinner(z, xs.spectrumJumps);
		var specValue = g.byteFrequency[z]? g.byteFrequency[z] : 0;
		scaledSpec = specValue*xs.musicScale,
		g.ctx.fillStyle=this.getClr(s.clrOffset,xs.colorStrength*scaledSpec),
		s.clrOffset += xs.colorWidth-scaledSpec/xs.musicColorInfluenceReducer;
		g.ctx.strokeStyle = g.ctx.fillStyle;

		var theta = ((i/xs.dotAmnt)*xs.circleMax)+barWidth,
		cw2 = g.canvas.width/2,
		ch2 = g.canvas.height/2;


		x = Math.sin(theta)*(xs.innerWidth+scaledSpec)+cw2,
		y =	Math.cos(theta)*(xs.innerWidth+scaledSpec)+ch2;
		drawCircle(x,y, xs.particleWidth*scaledSpec);

		if(oldX) {
			g.ctx.beginPath();
			g.ctx.moveTo(oldX,oldY);
			g.ctx.lineTo(x,y);
			g.ctx.stroke();
		}
		oldX = x, oldY = y;
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
