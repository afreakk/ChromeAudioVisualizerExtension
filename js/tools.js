//buttonhandler begin
var buttonHandler = {};
buttonHandler.buttons = {};
buttonHandler.makeButton = function(label, callback)
{
	buttonHandler.buttons[label] = {}
	buttonHandler.buttons[label][label] = callback;
	return buttonHandler.buttons[label];
},
buttonHandler.styleButton = function(btn)
{
	btn.domElement.style.borderRadius="10px";
	btn.domElement.style.background="green";
},
//buttonhandler end

defIfUndef=function(x, val){
	return typeof x === 'undefined' ? val : x;
},
isUndef=function(x){ //not sure if in uze
	return typeof x === 'undefined';
},
initUndef=function(owner, attribName, value)
{
	owner[attribName] = defIfUndef(owner[attribName],value);
},
componentToHex=function(c)
{
    var hex = Math.min(Math.round(c),255).toString(16);
    return hex.length == 1 ? "0" + hex : hex;
};

function rgbToHex(r, g, b)
{
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
function refreshCustomScenes()
{
	storage.scenes.get(
		function(scenes)
		{
			//also do hard refresh of values in scenelist
			//(cuz ur deleting in options at the same time)
			g.customSceneHandler.refreshCustomScenes(scenes)
		}
	);
}
function hasAnyBrokenValues(settings)
{
	for(var i in settings)
	{
		if(settings[i]===null||isNaN(settings[i]))
			return true;
	}
	return false;
}
function setFps(visible)
{
	if(!visible&&!g.stats.isHidden)
	{
		g.stats.domElement.style.visibility = 'hidden';
		g.stats.isHidden = true;
	}
	else if(visible&&g.stats.isHidden)
	{
		g.stats.domElement.style.visibility = 'visible';
		g.stats.isHidden = false;
	}
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
	if('length' in elem)
	{
		if(elem.length>0){
			aLog("peeling DOMList");
			deleteDom(elem);
			return
		}
	}
	else
	{
		aLog("==BEGIN== trying to remove element:");
		aLog(elem);
		var success = true;
		try
		{
			if('parent' in elem && 'removeChild' in elem.parent)
				elem.parent.removeChild(elem);
			else if('parentElement' in elem && 'removeChild' in elem.parentElement)
				elem.parentElement.removeChild(elem);
			else
				document.body.removeChild(elem);
		}
		catch(e)
		{
			aLog(e);
			success = false;
		}
		aLog("==END== "+ success?	"successfully removed element":
									"failed to remove element"
		);
	}
}
function getIncrementalString(origStr)
{
	var lenMinOne = origStr.length-1;
	var incremStr;
	if(isNaN(origStr[lenMinOne]))
		incremStr = origStr + "0";
	else
	{
		var y = parseInt(origStr[lenMinOne])+1;
		if(y>9)
			incremStr = origStr + "0";
		else
			incremStr = origStr.substring(0, lenMinOne)+y;
	}
	return incremStr;
}
generateSaveName = function(scene)
{
	return scene.originalName + AV.strDelim + g.saveSceneName;
},
generateSaveNameFromJson = function(obj, saveName){
	return obj.original + AV.strDelim + saveName;
}
jsonFromSaveName = function(saveName){
	var values = saveName.split(AV.strDelim);
	return {original: values[0], saveName: values[1]};
}
saveFromJson = function(json, callback){
	var keyObject = jsonFromSaveName(json.key);
	getAvailableSaveName(function(availableSaveName){
		var saveName = generateSaveNameFromJson(keyObject, availableSaveName);
		storage.scenes.insert(saveName, json.settings, callback);
	}, keyObject.saveName);
}
//core functions
function canvasResize()
{
	g.canvas.width = document.body.clientWidth;
	g.canvas.height = window.innerHeight;

	var top = window.scrollY.toString()+"px";
	var left = window.scrollX.toString()+"px";

	g.canvas.style.top = top;
	g.canvas.style.left = left;
	g.stats.domElement.style.top = top;
	g.stats.domElement.style.left = left;

	//calculations
    s.widthInHalf = g.canvas.width/2;
    s.heightInHalf= g.canvas.height/2;
	if(window.gl)
		WGL.onCanvasResize();
	g.sceneManager.resizeCurrentScene();
}
function copyCanvasDim(canvas)
{
	canvas.width = g.canvas.width;
	canvas.height = g.canvas.height;
	canvas.style.top = g.canvas.style.top;
	canvas.style.left = g.canvas.style.left;
	canvas.style.pointerEvents = g.canvas.style.pointerEvents;
}

fullDebug=false;
function aLog(msg, layer)
{
	if((typeof layer != 'undefined'
		&&layer == 3)||fullDebug)
		console.log(msg);
}
function aError(e)
{
	//console.log("caller of error is " + arguments.callee.caller.toString());
	console.error(e);
}

function togglePause()
{
	g.pause = !g.pause;
	aLog("toggling pause: "+g.pause, 1);
	if(g.pause)
	{
		g.canvas.style.visibility = "hidden";
		g.datStyle.visibility = "hidden";
		g.stats.domElement.style.visibility = 'hidden';
		g.sceneManager.cleanUpCurrentScene();
		if(OV.FullScreen)
			g.port.postMessage(AV.disableFullScreen);
	}
	else
	{
		storage.options.init(window.OV,
		function()
		{
			canvasResize();
			g.canvas.style.visibility = "visible";
			g.datStyle.visibility = "visible";
			setFps(g.showFps);
			g.sceneManager.sceneSelector.setRandomScene();
			g.sceneManager.init();
			g.sceneManager.update();
			if(OV.FullScreen)
				g.port.postMessage(AV.setFullScreen);
		}, true);
	}
}

function setSaveName(callback)
{
	storage.scenes.get(
		function(savedPresets)
		{
			var occupado = false;
			for(var preset in savedPresets)
			{
				var presetName = preset.split(AV.strDelim)[1];
				if(presetName == g.saveSceneName)
					occupado = true;
			}
			for(var sceneNameKey in g.sceneManager.scenes)
			{
				if(g.saveSceneName == sceneNameKey)
					occupado = true;
			}
			for(var sceneName in AudioScenes)
			{
				aLog("found scene: "+sceneName, 1);
				var scene = new AudioScenes[sceneName];
				scene.originalName = scene.name;
				g.sceneSelector.insertActualScene(scene.name);
				scenes[scene.name] = scene;
			}
			if(occupado)
			{
				if(g.saveSceneName.indexOf("_custom") === -1)
					g.saveSceneName = g.saveSceneName + "_custom";
				else
					g.saveSceneName = getIncrementalString(g.saveSceneName);
				setSaveName(callback);
			}
			else
			{
				g.gui.reCheckChildElements();
				if(callback)
					callback();
			}
		}
	);
}
function getAvailableSaveName(callback, wantedName)
{
	storage.scenes.get(
		function(savedPresets)
		{
			var occupado = false;
			for(var preset in savedPresets)
			{
				var presetName = preset.split(AV.strDelim)[1];
				if(presetName == wantedName)
					occupado = true;
			}
			/*
			for(var sceneNameKey in g.sceneManager.scenes)
			{
				if(wantedName == sceneNameKey)
					occupado = true;
			}
			*/
			for(var sceneName in AudioScenes)
			{
				aLog("found scene: "+sceneName, 1);
				var scene = new AudioScenes[sceneName];
				if(wantedName == scene.name)
					occupado = true;
			}
			if(occupado)
			{
				if(wantedName.indexOf("_custom") === -1)
					wantedName = wantedName + "_custom";
				else
					wantedName = getIncrementalString(wantedName);
				getAvailableSaveName(callback, wantedName);
			}
			else
			{
				if(callback)
					callback(wantedName);
			}
		}
	);
}
