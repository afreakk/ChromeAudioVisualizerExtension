SceneWormSettings = function()
{
    this.moveLength=0.006;
    this.numBars=24;
    this.circleSize=0.2;
    this.rotationSpeed = 10.0;
    this.colorSpeed = 40.0;
    this.colorStrength = 0.005;
    this.colorWidth = 2.5;
    this.colorOffset = Math.PI/2.0
	this.zoom = 10.0;
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
AudioScenes.SceneWorm.prototype.init = function()
{
};

AudioScenes.SceneWorm.prototype.update = function()
{
    s.widthInHalf = g.canvas.width/2;
    s.heightInHalf= g.canvas.height/2;
    var xs = this.settings;
    var circleWidth = g.canvas.width*xs.circleSize;
    var circleHeight = g.canvas.height*xs.circleSize;
    var circleSpread = (Math.PI*4)/xs.numBars;
	var data = g.byteFrequency;
    var bin_size = Math.floor(data.length / xs.numBars);
    var sumtotal = 0;
    g.ctx.clearRect(0, 0, g.canvas.width, g.canvas.height);
	g.ctx.fillRect(0,0,g.canvas.width,g.canvas.height);
	var z = 0;
    for (var i = 0; i < xs.numBars; i += 1)
    {
		var idx = spin(z+= xs.zoom, data.length)
        var sum = data[idx];
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
        g.ctx.lineWidth = 5;
        g.ctx.strokeStyle = '#003300';
        g.ctx.stroke();
        sumtotal += sum;
    }
    sumtotal /= 10000000;
    s.rotationOffset += sumtotal*xs.rotationSpeed;
    s.clrOffset += sumtotal*xs.colorSpeed;
}
