var analyzer = null;
var canvas = null;
var audio = null;
var canvas_context = null;
var context = null;
var sourceNode = null;

function init(stream)
{
    canvas = document.getElementById('c');
    canvas_context = canvas.getContext('2d');

    context = new AudioContext();
    sourceNode = context.createMediaStreamSource(stream);

    analyzer = context.createAnalyser();
    analyzer.fftSize = fftSize;

    sourceNode.connect(analyzer);
    sourceNode.connect(context.destination);

    freqAnalyser();
}

var fftSize = 2048;
var num_bars = 120;
var width=4;
function componentToHex(c) {
    var hex = Math.min(Math.round(c),255).toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
} 
 
function freqAnalyser() 
{
    window.requestAnimationFrame(freqAnalyser);
    var sum;
    var average;
    var scaled_average;
    var bar_width = (canvas.width / num_bars)*width;
    var data = new Uint8Array(fftSize);
    analyzer.getByteFrequencyData(data);
    var actbarwidth = bar_width -2;
    canvas_context.clearRect(0, 0, canvas.width, canvas.height);
    var bin_size = Math.floor(data.length / num_bars);
    for (var i = 0; i < num_bars; i += 1) 
    {
        sum = 0;
        for (var j = 0; j < bin_size; j += 1) 
        {
            sum += data[(i * bin_size) + j];
        }
        average = sum / bin_size;
        scaled_average = (average / 256) * canvas.height;
        console.log(rgbToHex(scaled_average, scaled_average, 0));
        canvas_context.fillStyle=rgbToHex(scaled_average, scaled_average, 0);
        canvas_context.fillRect(i*bar_width, canvas.height, actbarwidth, - scaled_average);
    }
}
function main()
{
    var MediaStreamConstraint = { audio: true };
    chrome.tabCapture.capture(MediaStreamConstraint, init);
}
main();
