var g = g || {};
g.analyzer = null;
g.canvas = null;
g.ctx = null;

var init = function(stream)
{
    g.canvas = document.getElementById('c');
    g.ctx = g.canvas.getContext('2d');

    var context = new AudioContext();
    var sourceNode = context.createMediaStreamSource(stream);

    g.analyzer = context.createAnalyser();
    g.analyzer.fftSize = 512;

    sourceNode.connect(g.analyzer);
    sourceNode.connect(context.destination);

    var scenes = {};
    var sceneNames = [];
    for(var sceneName in AudioScenes)
    {
        var scene = new AudioScenes[sceneName];
        sceneNames.push(scene.name);
        scenes[scene.name] = scene;
    }
    var sceneSelector = new SceneSelector(sceneNames);
    var datGUI = new dat.GUI();
    datGUI.add(sceneSelector, "scene", sceneNames);
    datGUI.closed = true;
    var sceneManager = new SceneManager(scenes, sceneSelector, new GUI(datGUI));
    sceneManager.update();
};

var main = function()
{
    chrome.tabCapture.capture({audio: true}, init);
}.call();
