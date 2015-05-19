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
	g.saveSceneName = "trolol";
	g.saveButton = null;
	g.presets = null;
	g.gui = null;
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
var startup = function(savedPresets)
{
	aLog("init begun");
	g.port.postMessage("rofl");
	initCanvas();

	var scenes = initScenes(savedPresets);
	g.sceneSelector.setRandomScene();
	initGUI();
	initSceneManager(scenes);
	aLog("init finished, beginning sceneManager.update", 1);
    g.sceneManager.update();
};
var initSceneManager = function(scenes)
{
    g.sceneManager = new SceneManager(scenes, g.sceneSelector);
	canvasResize();
	system = new System();
	g.sceneManager.init(system);
};
var initScenes = function(savedPresets)
{
	g.sceneSelector = new SceneSelector();
	g.sceneSelector.insertPresets(savedPresets, true);
    var scenes = {};
    for(var sceneName in AudioScenes)
    {
		aLog("found scene: "+sceneName, 1);
        var scene = new AudioScenes[sceneName];
		scene.originalName = scene.name;
        g.sceneSelector.insertScene(scene.name);
        scenes[scene.name] = scene;
    }
	return scenes;
};
var initGUI = function()
{
	initStatsLibrary();
	var datGUI = initDatGUI();
    datGUI.add(g, "debugFps");
    datGUI.add(g, "transparentBackground");
	datGUI.add(g, 'saveSceneName');
	g.saveButton = {};
	var label = '(->Save<-)';
	g.saveButton[label] = saveButtonCallback;
	datGUI.add(g.saveButton, label);
	g.gui = new GUI(datGUI);
	g.gui.initSceneList(g.sceneSelector);
};
var saveButtonCallback = function()
{
	var cBack = g.sceneManager.savePreset.bind(g.sceneManager);
	setSaveName(cBack);
}
var init = function()
{
	chrome.storage.sync.get(null, startup);
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
