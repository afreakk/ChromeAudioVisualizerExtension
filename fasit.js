function sceneInit()
{
    var x = 4.0;
    circleWidth = canvas.width/x;
    circleHeight = canvas.height/x;
}

var fftSize = 512;
var num_bars = 64;
var width=4;
var topSize= 0.25;
var height=0.001;
var offset = Math.PI/4.0;
var speedReduction = 450000;
function sceneUpdate() 
{
    window.requestAnimationFrame(sceneUpdate);
    var sum;
    var average;
    var scaled_average;
    var bar_width = (Math.PI*4)/num_bars;
    var data = new Uint8Array(fftSize);
    analyzer.getByteFrequencyData(data);
            
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var bin_size = Math.floor(data.length / num_bars);
    var widthInHalf = canvas.width/2;
    var heightInHalf= canvas.height/2;
    var sumx = 0;
    for (var i = 0; i < num_bars; i += 1) 
    {
        sum = 0;
        for (var j = 0; j < bin_size; j += 1) 
        {
            sum += data[(i * bin_size) + j];
        }
        sumx += sum;
        var scaled_average_c = sum /7.5;
        var scaled_average_v = sum*height;
        ctx.fillStyle=rgbToHex(scaled_average_c, 0, 0);
        var cwa = Math.max(circleWidth* scaled_average_v,0.0);
        var cha = Math.max(circleHeight*scaled_average_v,0.0);
        var s0 = (i)*bar_width-offset;
        var s1 = (i-topSize*scaled_average_v)*bar_width-offset;
        var s2 = (i+topSize*scaled_average_v)*bar_width-offset;
        var s3 = (i+1)*bar_width-offset;
        var x0 = (Math.sin(s0)*circleWidth)+widthInHalf;
        var y0 = (Math.cos(s0)*circleHeight)+heightInHalf;
        var x1 = (Math.sin(s1)*cwa)+widthInHalf;
        var y1 = (Math.cos(s1)*cha)+heightInHalf;
        var x2 = (Math.sin(s2)*cwa)+widthInHalf;
        var y2 = (Math.cos(s2)*cha)+heightInHalf;
        var x3 = (Math.sin(s3)*circleWidth)+widthInHalf;
        var y3 = (Math.cos(s3)*circleHeight)+heightInHalf;
        ctx.beginPath();
        ctx.moveTo(x0,y0);
        ctx.lineTo(x1,y1);
        ctx.lineTo(x2,y2);
        ctx.lineTo(x3,y3);
        ctx.fill();
    }
    offset += sumx/speedReduction;
}
