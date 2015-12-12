SceneCircleSettings = function()
{
    this.circleSize = 0.09;
    this.topSize= 0.12;
    this.numBars=40;
    this.barHeight=0.02;
    this.rotationSpeed = 20;
    this.colorSpeed = 80.5;
    this.colorStrength = 0.9;
    this.colorWidth = Math.PI;
    this.colorOffset = Math.PI;
	this.spectrumJumps = 1.0;
};

AudioScenes.SceneCircle = function()
{
    this.name = "Circle";
};
AudioScenes.SceneCircle.prototype.getClr = function(rgbS,scaled_average_c)
{
    return rgbToHex(
            (Math.sin(rgbS)/2.0+0.5)*scaled_average_c,
            (Math.cos(rgbS)/2.0+0.5)*scaled_average_c,
            (Math.sin(rgbS+this.settings.colorOffset)/2.0+0.5)*scaled_average_c
            );
}
AudioScenes.SceneCircle.prototype.parseSettings = function(preset)
{
	parseSettings(this,SceneCircleSettings, preset);
};
AudioScenes.SceneCircle.prototype.clearBg = function()
{
	g.ctx.fillRect(0,0,g.canvas.width,g.canvas.height);
};

AudioScenes.SceneCircle.prototype.update = function()
{
    var xs = this.settings;
    var circleWidth = g.canvas.width*xs.circleSize;
    var circleHeight = g.canvas.height*xs.circleSize;
    var bar_width = (Math.PI*4)/xs.numBars;
	var data = g.byteFrequency;
    var bin_size = Math.floor(data.length / xs.numBars);
    var sumtotal = 0;
	g.ctx.fill();
	var z = 0;
    for (var i = 0; i < xs.numBars; i += 1)
    {
		var sum = spin(z+= xs.spectrumJumps, data);
        sumtotal += sum;
        var scaled_average_c = sum*xs.colorStrength;
        var scaled_average_v = sum*xs.barHeight;
        var cwa = Math.max(circleWidth* scaled_average_v,0.0);
        var cha = Math.max(circleHeight*scaled_average_v,0.0);
        var s0 = (i)*bar_width-s.rotationOffset;
        var s1 = (i-xs.topSize*scaled_average_v)*bar_width-s.rotationOffset;
        var s2 = (i+xs.topSize*scaled_average_v)*bar_width-s.rotationOffset;
        var s3 = (i+1)*bar_width-s.rotationOffset;
        var x0 = (Math.sin(s0)*circleWidth)+s.widthInHalf;
        var y0 = (Math.cos(s0)*circleHeight)+s.heightInHalf;
        var x1 = (Math.sin(s1)*cwa)+s.widthInHalf;
        var y1 = (Math.cos(s1)*cha)+s.heightInHalf;
        var x2 = (Math.sin(s2)*cwa)+s.widthInHalf;
        var y2 = (Math.cos(s2)*cha)+s.heightInHalf;
        var x3 = (Math.sin(s3)*circleWidth)+s.widthInHalf;
        var y3 = (Math.cos(s3)*circleHeight)+s.heightInHalf;
        var rgbS = i/xs.colorWidth+s.clrOffset;
        g.ctx.fillStyle=this.getClr(rgbS,scaled_average_c);
        g.ctx.beginPath();
        g.ctx.moveTo(x0,y0);
        g.ctx.lineTo(x1,y1);
        g.ctx.lineTo(x2,y2);
        g.ctx.lineTo(x3,y3);
        g.ctx.fill();
/*		g.ctx.lineWidth = 5;
		g.ctx.strokeStyle = '#000000';
		g.ctx.stroke();
		low fps
		*/
    }
    sumtotal /= 10000000;
    s.rotationOffset += sumtotal*xs.rotationSpeed;
    s.clrOffset += sumtotal*xs.colorSpeed;
}
