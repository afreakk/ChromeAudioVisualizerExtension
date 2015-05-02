var gWasUndefined = false;
if(typeof g === 'undefined')
{
	gWasUndefined = true;
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
aLog("g=='undefined': "+gWasUndefined);

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
	g.canvas.style.zIndex = g.canvasZIndex;
	g.canvas.style.position = "absolute";
	g.canvas.style.border = "0px";
	g.canvas.className = "lerret";
	deleteDomClass(g.canvas.className);
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

	var datGUI = initDatGUI();
    datGUI.add(g.sceneSelector, "scene", sceneNames);

    g.sceneManager = new SceneManager(scenes, g.sceneSelector, new GUI(datGUI));

	initStatsLibrary();
	canvasResize();
	aLog("init finished, beginning sceneManager.update");
    g.sceneManager.update();
};

function initDatGUI()
{
	deleteDomClass("dg ac");
    var datGUI = new dat.GUI();
	datGUI.closed = true;

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
function deleteDomClass(className)
{
	deleteDom(document.body.getElementsByClassName(className));
}
function deleteDomById(id)
{
	deleteDom(document.getElementById(id));
}
function deleteDom(elemList)
{
	if(elemList)
	{
		if(elemList.length)
		{
			if(elemList.length>0)
				[].forEach.call(elemList,_deleteDom);
		}
		else
			_deleteDom(elemList);
		
	}
}
function _deleteDom(elem)
{
	aLog("removing element:");
	aLog(elem);
	if(elem.length)
	{
		aLog("that element was a list in delete individualDom");
		deleteDom(elem);
		return;
	}
	try{
		elem.parent.removeChild(elem);
	}catch(e){
		try{
			document.body.removeChild(elem);
		}catch(e){
			aLog("tried removing:");
			aLog(elem);
			aLog("got xception:");
			aLog(e);
		}
	}
}
