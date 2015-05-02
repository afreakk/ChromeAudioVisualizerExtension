if(typeof g === 'undefined')
{
	var g = {};
	g.analyzer = null;
	g.canvas = null;
	g.ctx = null;
	g.byteFrequency = null;
	g.port = null;
	g.canvasZIndex = 2147483646;
	g.pause = false;
	g.sceneManager = null;
	g.datStyle = null;
	g.sceneSelector = null;
}

chrome.runtime.onConnect.addListener(function(port) {
	g.port = port;
	port.onMessage.addListener(function(msg) {
		g.byteFrequency = msg;
	});
});
var init = function()
{
	aLog("init begun");
	g.port.postMessage("xxx");
	g.canvas = document.createElement('canvas');
	g.canvas.id = "lerret";
	g.canvas.style.zIndex = g.canvasZIndex;
	g.canvas.style.position = "absolute";
	g.canvas.style.border = "0px";
	document.body.appendChild(g.canvas);

    g.ctx = g.canvas.getContext('2d');

    var scenes = {};
    var sceneNames = [];
    for(var sceneName in AudioScenes)
    {
        var scene = new AudioScenes[sceneName];
        sceneNames.push(scene.name);
        scenes[scene.name] = scene;
    }

    g.sceneSelector = new SceneSelector(sceneNames);
	g.sceneSelector.setRandomScene();

    var datGUI = new dat.GUI();
    datGUI.add(g.sceneSelector, "scene", sceneNames);
	datGUI.closed = true;
    g.sceneManager = new SceneManager(scenes, g.sceneSelector, new GUI(datGUI));

	g.datStyle = document.getElementsByClassName("dg ac")[0].style;
	g.datStyle.zIndex = g.canvasZIndex+1;

	initStatsLibrary();

	canvasResize();
	aLog("init finished, beginning sceneManager.update");
    g.sceneManager.update();
};

function initStatsLibrary()
{
	g.stats = new Stats();
	g.stats.setMode(0); // 0: fps, 1: ms

	g.stats.domElement.style.position = 'absolute';
	g.stats.domElement.style.zIndex = g.canvasZIndex+1;
	document.body.appendChild( g.stats.domElement );
}
aLog("INITFILE INJECTED");
