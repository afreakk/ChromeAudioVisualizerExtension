var widthInHalf;
var heightInHalf;

function sceneInit()
{
    widthInHalf = canvas.width/2;
    heightInHalf= canvas.height/2;
}

var Settings = function()
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
var settings = new Settings();

var gui = new dat.GUI();
gui.add(settings, 'circleSize');
gui.add(settings, 'topSize');
gui.add(settings, 'barHeight');
gui.add(settings, 'numBars');
gui.add(settings, 'rotationSpeed');
gui.add(settings, 'colorSpeed');
gui.add(settings, 'colorStrength');
gui.add(settings, 'colorWidth');
gui.add(settings, 'colorOffset');

function getClr(rgbS,scaled_average_c)
{
    return rgbToHex(
            (Math.sin(rgbS)/2.0+0.5)*scaled_average_c,
            (Math.cos(rgbS)/2.0+0.5)*scaled_average_c,
            (Math.sin(rgbS+settings.colorOffset)/2.0+0.5)*scaled_average_c
            );
}

function systemUpdate()
{
    window.requestAnimationFrame(sceneUpdate);
}

var offset = Math.PI/4.0;
var clrOffset = 0.0;

function sceneUpdate()
{
    var circleWidth = canvas.width*settings.circleSize;
    var circleHeight = canvas.height*settings.circleSize;
    systemUpdate();
    var bar_width = (Math.PI*4)/settings.numBars;
    var data = new Uint8Array(analyzer.fftSize);
    analyzer.getByteFrequencyData(data);
    var bin_size = Math.floor(data.length / settings.numBars);
    var sumx = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < settings.numBars; i += 1)
    {
        var sum = 0;
        for (var j = 0; j < bin_size; j += 1)
            sum += data[(i * bin_size) + j];
        sumx += sum;
        var scaled_average_c = sum*settings.colorStrength;
        var scaled_average_v = sum*settings.barHeight;
        var cwa = Math.max(circleWidth* scaled_average_v,0.0);
        var cha = Math.max(circleHeight*scaled_average_v,0.0);
        var s0 = (i)*bar_width-offset;
        var s1 = (i-settings.topSize*scaled_average_v)*bar_width-offset;
        var s2 = (i+settings.topSize*scaled_average_v)*bar_width-offset;
        var s3 = (i+1)*bar_width-offset;
        var x0 = (Math.sin(s0)*circleWidth)+widthInHalf;
        var y0 = (Math.cos(s0)*circleHeight)+heightInHalf;
        var x1 = (Math.sin(s1)*cwa)+widthInHalf;
        var y1 = (Math.cos(s1)*cha)+heightInHalf;
        var x2 = (Math.sin(s2)*cwa)+widthInHalf;
        var y2 = (Math.cos(s2)*cha)+heightInHalf;
        var x3 = (Math.sin(s3)*circleWidth)+widthInHalf;
        var y3 = (Math.cos(s3)*circleHeight)+heightInHalf;
        var rgbS = i/settings.colorWidth+clrOffset;
        ctx.fillStyle=getClr(rgbS,scaled_average_c);
        ctx.beginPath();
        ctx.moveTo(x0,y0);
        ctx.lineTo(x1,y1);
        ctx.lineTo(x2,y2);
        ctx.lineTo(x3,y3);
        ctx.fill();
    }
    sumx /= 10000000;
    offset += sumx*settings.rotationSpeed;
    clrOffset += sumx*settings.colorSpeed;
}
