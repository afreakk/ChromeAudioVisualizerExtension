SceneWormSettings = function()
{
    this.moveLength=0.01;
    this.numBars=48;
    this.circleSize=0.1;
    this.rotationSpeed = 85.0;
    this.colorSpeed = 150.0;
    this.colorStrength = 0.85;
    this.colorWidth = 2.5;
    this.colorOffset = Math.PI;
	this.spectrumJumps = 10.0;
	this.innSnevring = 0.001;
};

AudioScenes.SceneWorm = function()
{
    this.name = "Worm";
    this.settings = new SceneWormSettings();
};
AudioScenes.SceneWorm.prototype.getClr = function(rgbS,scaled_average_c)
{
    return rgbToHex(
            (Math.sin(rgbS)/2.0+0.5)*scaled_average_c,
            (Math.cos(rgbS)/2.0+0.5)*scaled_average_c,
            (Math.sin(rgbS+this.settings.colorOffset)/2.0+0.5)*scaled_average_c
            );
}
AudioScenes.SceneWorm.prototype.parseSettings = function(preset)
{
	parseSettings(this,SceneWormSettings, preset);
};

AudioScenes.SceneWorm.prototype.clearBg = function()
{
	g.ctx.fillStyle = '#000000';
	g.ctx.fillRect(0,0,g.canvas.width,g.canvas.height);
}
AudioScenes.SceneWorm.prototype.update = function()
{
    var xs = this.settings;
    var circleWidth = g.canvas.width*xs.circleSize;
    var circleHeight = g.canvas.height*xs.circleSize;
    var circleSpread = (Math.PI*4)/xs.numBars;
	var data = g.byteFrequency;
    var bin_size = Math.floor(data.length / xs.numBars);
    var sumtotal = 0;
	var z = 0;
	var yy = 0;
    for (var i = 0; i < xs.numBars; i += 1)
    {
		var sum = Math.max(spin(z+= xs.spectrumJumps, data) - (yy += xs.innSnevring),0);
        var scaled_average_c = sum*xs.colorStrength;
        var scaled_average_v = sum*xs.circleSize;
        var scaled_average_m = sum*xs.moveLength;
        var s0 = i*circleSpread-s.rotationOffset;
        var x0 = Math.sin(s0)*circleWidth*scaled_average_m+s.widthInHalf;
        var y0 = Math.cos(s0)*circleHeight*scaled_average_m+s.heightInHalf;
        var rgbS = i/xs.colorWidth+s.clrOffset;

        g.ctx.beginPath();
        g.ctx.arc(x0, y0, scaled_average_v, 0, 2 * Math.PI, false);
        g.ctx.fillStyle=this.getClr(rgbS,scaled_average_c);
        g.ctx.fill();
        sumtotal += sum;
    }
    sumtotal /= 10000000;
    s.rotationOffset += sumtotal*xs.rotationSpeed;
    s.clrOffset += sumtotal*xs.colorSpeed;
}
