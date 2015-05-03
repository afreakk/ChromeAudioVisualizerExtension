GenericSceneSettings = function()
{
    this.colorStrength = 0.75;
    this.colorOffset = Math.PI;
	this.barHeight = 1.0;
	this.spectrumJumps = 1.0;
	this.colorWidth = 0.1;
	this.musicColorInfluenceReducer =20000;
};
AudioScenes.GenericScene = function()
{
    this.name = "SpectrumAnalyziz";
};
AudioScenes.GenericScene.prototype.getClr = function(rgbS,scaled_average_c)
{
    return rgbToHex(
            (Math.sin(rgbS)/2.0+0.5)*scaled_average_c,
            (Math.cos(rgbS)/2.0+0.5)*scaled_average_c,
            (Math.sin(rgbS+this.settings.colorOffset)/2.0+0.5)*scaled_average_c
            );
}
AudioScenes.GenericScene.prototype.init = function()
{
	if(!this.settings||hasAnyBrokenValues(this.settings))
		this.settings = new GenericSceneSettings();
};
AudioScenes.GenericScene.prototype.update = function()
{
    var xs = this.settings;
    var data = g.byteFrequency;
    g.ctx.clearRect(0, 0, g.canvas.width, g.canvas.height);
	g.ctx.fillStyle = '#000000';
	g.ctx.fillRect(0,0,g.canvas.width,g.canvas.height);
	var z = 0;
	var boxWidth = (g.canvas.width*2)/AV.fftSize;
	for(var i=0; i<AV.fftSize; i++)
	{
		z = indexSpinner(z, xs.spectrumJumps);
		var specValue = data[z];
		var boxHeight = specValue*xs.barHeight;
		g.ctx.fillStyle=this.getClr(s.clrOffset,xs.colorStrength*specValue);
		g.ctx.fillRect(
			(i/AV.fftSize)*g.canvas.width*2,
			g.canvas.height-boxHeight,
			boxWidth,boxHeight
		);
		s.clrOffset += xs.colorWidth-specValue/xs.musicColorInfluenceReducer;
	}
};
