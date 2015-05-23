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
	g.ShowFps = false;
	g.saveSceneName = "trolol";
	g.buttonHandler = null;
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
	initCanvas();

	var scenes = initScenes(savedPresets);
	g.sceneSelector.setRandomScene();
	initGUI();
	initSceneManager(scenes);
	aLog("init finished, beginning sceneManager.update", 1);
	setFps(g.ShowFps);
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
	g.customSceneHandler = new CustomSceneHandler(g.sceneSelector);
	g.customSceneHandler.refreshCustomScenes(savedPresets);
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
var ButtonHandler = function()
{
	this.buttons = {}
};
ButtonHandler.prototype.makeButton = function(label, callback)
{
	this.buttons[label] = {}
	this.buttons[label][label] = callback;
	return this.buttons[label];
};

var initGUI = function()
{
	//init
	initStatsLibrary();
	var datGUI = initDatGUI();
	var gui = new GUI(datGUI);
	g.buttonHandler = new ButtonHandler();

	//adding Options Folder
	var options = gui.appendFolder("Options");
    options.addSetting(g, "ShowFps");
    options.addSetting(g, "transparentBackground");
	var optionsBtn = g.buttonHandler.makeButton("-->)Options(<--",
		function()
		{
			g.port.postMessage(AV.openOptions);
		}
	);
	options.addSetting(optionsBtn, "-->)Options(<--");

	//adding Save Folder
	var save = gui.appendFolder("Save");
	save.addSetting(g, 'saveSceneName');
	var saveBtn = g.buttonHandler.makeButton("-->)Save(<--", saveButtonCallback);
	save.addSetting(saveBtn, "-->)Save(<--");

	//adding Scene-Settings Folder
	gui.appendFolder("Scene-Settings");

	//adding scene selection drop down
	gui.repopulateSceneList();

	g.gui = gui;
};
var saveButtonCallback = function()
{
	var cBack = function()
	{
		g.customSceneHandler.saveCustomScene(g.sceneManager.currentScene);
	}
	//make sure savename not occupado
	setSaveName(cBack);
},
init = function()
{
	storage.scenes.get(startup);
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
