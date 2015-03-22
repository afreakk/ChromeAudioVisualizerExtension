WartSceneSettings = function()
{
    this.heightWidthRatio=32;
    this.circleSize=0.25;
    this.colorSpeed = 0.0000001;
    this.colorStrength = 0.75;
    this.colorWidth = 0.0001;
    this.colorOffset = Math.PI/2.0;
    this.height = 1.0;
    this.rotationSpeed = 0.00002;
};
AudioScenes.WartScene = function()
{
    this.name = "Wart";
    this.settings = new WartSceneSettings();
};
AudioScenes.WartScene.prototype.getClr = function(rgbS,scaled_average_c)
{
    return rgbToHex(
            (Math.sin(rgbS)/2.0+0.5)*scaled_average_c,
            (Math.cos(rgbS)/2.0+0.5)*scaled_average_c,
            (Math.sin(rgbS+this.settings.colorOffset)/2.0+0.5)*scaled_average_c
            );
}
AudioScenes.WartScene.prototype.init = function()
{
    this.arrRotator = new ArrayRotator();
};
AudioScenes.WartScene.prototype.update = function()
{
    var xs = this.settings;
    var data = new Uint8Array(g.analyzer.fftSize);
    g.analyzer.getByteFrequencyData(data);
    var bin_size = Math.floor(data.length / xs.heightWidthRatio);
    g.ctx.clearRect(0, 0, g.canvas.width, g.canvas.height);
    var velocity = 0;
    for (var i = 0; i < xs.heightWidthRatio; i += 1)
    {
        for (var j = 0; j < bin_size; j += 1)
        {
            var z = (data.length-1) - ((i * bin_size) + j);
            var sum = this.arrRotator.spin(data, z, velocity);
            velocity = sum*xs.rotationSpeed;
            var scaled_average_c = sum*xs.colorStrength;
            var scaled_average_v = sum*xs.circleSize;
            var x0 = (j/bin_size+(0.5/bin_size))*(g.canvas.width);
            var y0 = ((i/xs.heightWidthRatio)*xs.height)*g.canvas.height;
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

var ArrayRotator = function()
{
    this.spinner = 0;
};
ArrayRotator.prototype.spin = function(array, idx, velocity)
{
    this.spinner += velocity;
    if(this.spinner > array.length)
        this.spinner = 0;
    var i = Math.round(idx+this.spinner);
    return array[i >= array.length ? i -array.length : i];
};
