var analyzer = null;
var canvas = null;
var audio = null;
var ctx = null;
var context = null;
var sourceNode = null;
var circleWidth = 200;
var circleHeight = 300;
function init(stream)
{
    canvas = document.getElementById('c');
    ctx = canvas.getContext('2d');

    context = new AudioContext();
    sourceNode = context.createMediaStreamSource(stream);

    analyzer = context.createAnalyser();
    analyzer.fftSize = fftSize;

    sourceNode.connect(analyzer);
    sourceNode.connect(context.destination);

    sceneInit();
    sceneUpdate();
}
function main()
{
    var MediaStreamConstraint = { audio: true };
    chrome.tabCapture.capture(MediaStreamConstraint, init);
}
main();
