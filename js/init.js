var gDefined = true;
if(typeof g === 'undefined')
{
	gDefined = false;
	var g = {};
	g.analyzer = null;
	g.canvas = null;
	g.ctx = null;
	g.byteFrequency = [0];
	g.port = null;
	g.canvasZIndex = 2147483646;
	g.pause = false;
	g.sceneManager = null;
	g.datStyle = null;
	g.sceneSelector = null;
	g.transparentBackground = true;
	g.debugFps = true;
}
aLog("namespace g was: "+gDefined ?	"defined, smells foul :(":
									"undefined :) fresh inject."
);

chrome.runtime.onConnect.addListener(function(port) {
	g.port = port;
	port.onMessage.addListener(function(msg) {
		g.byteFrequency = msg;
	});
});
var init = function()
{
	aLog("init begun");
	g.port.postMessage("rofl");
	initCanvas();

    var scenes = {};
    var sceneNames = [];
    for(var sceneName in AudioScenes)
    {
		aLog("found scene: "+sceneName);
        var scene = new AudioScenes[sceneName];
        sceneNames.push(scene.name);
        scenes[scene.name] = scene;
    }

    g.sceneSelector = new SceneSelector(sceneNames);
	g.sceneSelector.setRandomScene();
	initStatsLibrary();

	var datGUI = initDatGUI();
    datGUI.add(g.sceneSelector, "scene", sceneNames);
    datGUI.add(g, "debugFps");
    datGUI.add(g, "transparentBackground");

	canvasResize();
    g.sceneManager = new SceneManager(scenes, g.sceneSelector, datGUI);

	aLog("init finished, beginning sceneManager.update");
    g.sceneManager.update();
};
function initCanvas()
{
	g.canvas = document.createElement('canvas');
	g.canvas.style.zIndex = g.canvasZIndex;
	g.canvas.style.position = "absolute";
	g.canvas.style.border = "0px";
	g.canvas.style.pointerEvents = "none";
	g.canvas.className = "lerret";
	deleteDomClass(g.canvas.className);
	document.body.appendChild(g.canvas);
    g.ctx = g.canvas.getContext('2d');
}

function initDatGUI()
{
	deleteDomClass("dg ac");
    var datGUI = new dat.GUI();
	g.stats.isHidden = !g.debugFps;

	g.datStyle = document.getElementsByClassName("dg ac")[0].style;
	g.datStyle.zIndex = g.canvasZIndex+1;

	return datGUI;
}
function initStatsLibrary()
{
	deleteDomById("stats");

	g.stats = new Stats();
	g.stats.setMode(0); // 0: fps, 1: ms

	g.stats.domElement.style.position = 'absolute';
	g.stats.domElement.style.zIndex = g.canvasZIndex+1;
	document.body.appendChild( g.stats.domElement );
}
