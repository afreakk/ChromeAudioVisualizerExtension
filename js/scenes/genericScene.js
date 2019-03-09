GenericSceneSettings = function()
{
    this.colorStrength = 0.75;
    this.colorOffset = Math.PI*4;
	this.barHeight = 1.0;
	this.spectrumJumps = 1.0;
	this.colorWidth = 0.1;
	this.musicColorInfluenceReducer =25000;
	this.opacity = 1.0;
};
AudioScenes.GenericScene = function()
{
    this.name = "SpectrumAnalyziz";
};
AudioScenes.GenericScene.prototype.getClr = function(rgbS,scaled_average_c)
{
    return "rgba("+
            (Math.sin(rgbS)/2.0+0.5)*scaled_average_c + ", " +
            (Math.cos(rgbS)/2.0+0.5)*scaled_average_c + ", " +
			(Math.sin(rgbS+this.settings.colorOffset)/2.0+0.5)*scaled_average_c + ", " +
			this.settings.opacity + ")";
}
AudioScenes.GenericScene.prototype.parseSettings = function(preset)
{
	parseSettings(this,GenericSceneSettings, preset);
};
AudioScenes.GenericScene.prototype.clearBg = function()
{
	g.ctx.fillStyle = '#000000';
	g.ctx.fillRect(0,0,g.canvas.width,g.canvas.height);
};
AudioScenes.GenericScene.prototype.update = function()
{
    var xs = this.settings;
    var data = g.byteFrequency;
	var z = 0;
	var boxWidth = (g.canvas.width*2)/g.frequencyBinCount;
	for(var i=0; i<g.frequencyBinCount; i++)
	{
		z = indexSpinner(z, xs.spectrumJumps);
		var specValue = data[z] ? data[z] : 0 ;
		var boxHeight = specValue*xs.barHeight;
		g.ctx.fillStyle=this.getClr(s.clrOffset,xs.colorStrength*specValue);
		g.ctx.fillRect(
			(i/g.frequencyBinCount)*g.canvas.width*2,
			g.canvas.height-boxHeight,
			boxWidth,boxHeight
		);
		s.clrOffset += xs.colorWidth-specValue/xs.musicColorInfluenceReducer;
	}
};
