SceneCircleSettings = function()
{
    this.circleSize = 0.07;
    this.topSize= 0.095;
    this.numBars=64;
    this.barHeight=0.003;
    this.rotationSpeed = 8.5;
    this.colorSpeed = 20.0;
    this.colorStrength = 0.05;
    this.colorWidth = 2.5;
    this.colorOffset = Math.PI/2.0
};

AudioScenes.SceneCircle = function()
{
    this.name = "Circle";
    this.settings = new SceneCircleSettings();
};
AudioScenes.SceneCircle.prototype.getClr = function(rgbS,scaled_average_c)
{
    return rgbToHex(
            (Math.sin(rgbS)/2.0+0.5)*scaled_average_c,
            (Math.cos(rgbS)/2.0+0.5)*scaled_average_c,
            (Math.sin(rgbS+this.settings.colorOffset)/2.0+0.5)*scaled_average_c
            );
}
AudioScenes.SceneCircle.prototype.init = function()
{
    s.widthInHalf = g.canvas.width/2;
    s.heightInHalf= g.canvas.height/2;
};

AudioScenes.SceneCircle.prototype.update = function()
{
    var xs = this.settings;
    var circleWidth = g.canvas.width*xs.circleSize;
    var circleHeight = g.canvas.height*xs.circleSize;
    var bar_width = (Math.PI*4)/xs.numBars;
    var data = new Uint8Array(g.analyzer.fftSize);
    g.analyzer.getByteFrequencyData(data);
    var bin_size = Math.floor(data.length / xs.numBars);
    var sumtotal = 0;
    g.ctx.clearRect(0, 0, g.canvas.width, g.canvas.height);
    for (var i = 0; i < xs.numBars; i += 1)
    {
        var sum = 0;
        for (var j = 0; j < bin_size; j += 1)
            sum += data[(i * bin_size) + j];
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
    }
    sumtotal /= 10000000;
    s.rotationOffset += sumtotal*xs.rotationSpeed;
    s.clrOffset += sumtotal*xs.colorSpeed;
}
