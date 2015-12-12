WartSceneSettings = function()
{
    this.heightCount=5;
	this.widthCount =5;
    this.circleSize=0.5;
    this.colorSpeed = 0.0000001;
    this.colorStrength = 0.75;
    this.colorWidth = 0.003;
    this.colorOffset = Math.PI/2.0;
    this.rotationSpeed = 0.00002;
	this.maxSize = 100;
	this.minSize = 3;
	this.padding = 175;
	this.test = 0.75;
	this.spectrumJumps = 10;
};
AudioScenes.WartScene = function()
{
    this.name = "Wart";
};
AudioScenes.WartScene.prototype.getClr = function(rgbS,scaled_average_c)
{
    return rgbToHex(
            (Math.sin(rgbS)/2.0+0.5)*scaled_average_c,
            (Math.cos(rgbS)/2.0+0.5)*scaled_average_c,
            (Math.sin(rgbS+this.settings.colorOffset)/2.0+0.5)*scaled_average_c
            );
}
AudioScenes.WartScene.prototype.parseSettings = function(preset)
{
	parseSettings(this,WartSceneSettings, preset);
};
AudioScenes.WartScene.prototype.clearBg = function()
{
	g.ctx.fillRect(0,0,g.canvas.width,g.canvas.height);
}
AudioScenes.WartScene.prototype.update = function()
{
    var xs = this.settings;
    var data = g.byteFrequency;
	var z = 0;
    for (var i = 0; i < xs.heightCount; i += 1)
    {
        for (var j = 0; j < xs.widthCount; j += 1)
        {
			var sum = spin(z+= xs.spectrumJumps, data);
            var scaled_average_c = sum*xs.colorStrength;
            var scaled_average_v = sum*xs.circleSize;
			if(scaled_average_v<xs.minSize)
				scaled_average_v = xs.minSize;
			if(scaled_average_v>xs.maxSize)
				scaled_average_v = xs.maxSize;

            var x0 = ((j/xs.widthCount)*(g.canvas.width*xs.test))+xs.padding;
            var y0 = ((i/xs.heightCount)*(g.canvas.height*xs.test))+xs.padding;
            s.clrOffset += sum*xs.colorSpeed + j*xs.colorWidth;

            g.ctx.beginPath();
            g.ctx.arc(x0, y0, scaled_average_v, 0, 2 * Math.PI, false);
            g.ctx.fillStyle=this.getClr(s.clrOffset,scaled_average_c);
            g.ctx.fill();
            g.ctx.lineWidth = 5;
            g.ctx.strokeStyle = '#003300';
            g.ctx.stroke();
        }
    }
};

