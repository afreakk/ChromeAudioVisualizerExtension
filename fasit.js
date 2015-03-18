var analyzer = null;
var canvas = null;
var audio = null;
var ctx = null;
var context = null;
var sourceNode = null;
var circleWidth = 200;
var circleHeight = 300;
function setCircleShape()
{
    var x = 4.0;
    circleWidth = canvas.width/x;
    circleHeight = canvas.height/x;
}

function init(stream)
{
    canvas = document.getElementById('c');
    ctx = canvas.getContext('2d');
    setCircleShape();

    context = new AudioContext();
    sourceNode = context.createMediaStreamSource(stream);

    analyzer = context.createAnalyser();
    analyzer.fftSize = fftSize;

    sourceNode.connect(analyzer);
    sourceNode.connect(context.destination);

    freqAnalyser();
}

function componentToHex(c) {
    var hex = Math.min(Math.round(c),255).toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
} 
 
var fftSize = 512;
var num_bars = 120;
var width=4;
function freqAnalyser() 
{
    window.requestAnimationFrame(freqAnalyser);
    var sum;
    var average;
    var scaled_average;
    //var bar_width = (canvas.width / num_bars)*width;
    var bar_width = (Math.PI*4)/num_bars;
    var data = new Uint8Array(fftSize);
    analyzer.getByteFrequencyData(data);
            
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var bin_size = Math.floor(data.length / num_bars);
    var widthInHalf = canvas.width/2;
    var heightInHalf= canvas.height/2;
    var offset = Math.PI/4.0
    for (var i = 0; i < num_bars; i += 1) 
    {
        sum = 0;
        for (var j = 0; j < bin_size; j += 1) 
        {
            sum += data[(i * bin_size) + j];
        }
        average = sum / bin_size;
        scaled_average = (average /512 ) * canvas.height;
        var scaled_average_c = scaled_average /2.5;
        var scaled_average_v = scaled_average /100.0;
        ctx.fillStyle=rgbToHex(scaled_average_c, scaled_average_c, 0);
        var s = i*bar_width-offset;
        var s2 = (i+0.5)*bar_width-offset;
        var x = (Math.sin(s)*circleWidth)+widthInHalf;
        var y = (Math.cos(s)*circleHeight)+heightInHalf;
        var x1 = (Math.sin(s)*circleWidth*scaled_average_v)+widthInHalf;
        var y1 = (Math.cos(s)*circleHeight*scaled_average_v)+heightInHalf;
        var x2 = (Math.sin(s2)*circleWidth*scaled_average_v)+widthInHalf;
        var y2 = (Math.cos(s2)*circleHeight*scaled_average_v)+heightInHalf;
        var x3 = (Math.sin(s2)*circleWidth)+widthInHalf;
        var y3 = (Math.cos(s2)*circleHeight)+heightInHalf;
        ctx.beginPath();
        ctx.moveTo(x,y);
        ctx.lineTo(x1,y1);
        ctx.lineTo(x2,y2);
        ctx.lineTo(x3,y3);
        ctx.fill();
    }
}
function main()
{
    var MediaStreamConstraint = { audio: true };
    chrome.tabCapture.capture(MediaStreamConstraint, init);
}
main();
