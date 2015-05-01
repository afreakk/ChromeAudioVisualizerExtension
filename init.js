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
	g.init = false;
	g.sceneManager = null;
}

chrome.runtime.onConnect.addListener(function(port) {
	g.port = port;
	port.onMessage.addListener(function(msg) {
		if(msg.msg == 'data')
			g.byteFrequency = msg.data;
		else if(msg.msg == 'toggle')
		{
			g.pause = !g.pause;
			handlePause();
		}
	});
});
var init = function()
{
	console.log("begin init");
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
    var sceneSelector = new SceneSelector(sceneNames);
    var datGUI = new dat.GUI();
	document.getElementsByClassName("dg ac")[0].style.zIndex = g.canvasZIndex+1;
    datGUI.add(sceneSelector, "scene", sceneNames);
    g.sceneManager = new SceneManager(scenes, sceneSelector, new GUI(datGUI));
	datGUI.closed = true;
	console.log("begin sceneManager update");
	g.init = true;
    g.sceneManager.update();
};

console.log("INITFILE INJECTED");
