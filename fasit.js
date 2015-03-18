var analyzer = null;
var canvas = null;
var audio = null;
var canvas_context = null;
var context = null;
var sourceNode = null;
var circleWidth = 200;
var circleHeight = 300;
function setCircleShape()
{
    var x = 3.0;
    circleWidth = canvas.width/x;
    circleHeight = canvas.height/x;
}

function init(stream)
{
    canvas = document.getElementById('c');
    canvas_context = canvas.getContext('2d');
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
 
var fftSize = 2048;
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
    var actbarwidth = bar_width -4;

            
    canvas_context.clearRect(0, 0, canvas.width, canvas.height);
    var bin_size = Math.floor(data.length / num_bars);
    var widthInHalf = canvas.width/2;
    var heightInHalf= canvas.height/1.75;
    for (var i = 0; i < num_bars; i += 1) 
    {
        sum = 0;
        for (var j = 0; j < bin_size; j += 1) 
        {
            sum += data[(i * bin_size) + j];
        }
        average = sum / bin_size;
        scaled_average = (average / 512) * canvas.height;
        canvas_context.fillStyle=rgbToHex(scaled_average, scaled_average, 0);
        var s = i*bar_width-Math.PI/4.0;
        var x = Math.sin(s)*circleWidth+widthInHalf;
        var y = Math.cos(s)*circleHeight+heightInHalf;
        canvas_context.fillRect(x, y, actbarwidth, - scaled_average);
    }
}
function main()
{
    var MediaStreamConstraint = { audio: true };
    chrome.tabCapture.capture(MediaStreamConstraint, init);
}
main();
