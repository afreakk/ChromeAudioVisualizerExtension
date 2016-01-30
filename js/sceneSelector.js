var SceneSelector = function()
{
	this.sceneNames = [];
	this.actualScenes = [];
	this.scene = null;
};
SceneSelector.prototype.setRandomScene = function(noStartup)
{
	if(this.sceneNames.indexOf(OV.startupScene)!=-1&&!noStartup){
		this.scene = OV.startupScene;
	}
	else{
		var i = Math.round(Math.random()*(this.sceneNames.length-1));
		this.scene = this.sceneNames[i];
	}
};
SceneSelector.prototype.setScene = function(name)
{
	this.scene = name;
};
SceneSelector.prototype.insertPresets = function(savedPresets)
{
	var oldList = this.sceneNames;
	this.sceneNames = this.actualScenes.slice();
	var retVal;
	for(var preset in savedPresets)
	{
		var presetName = preset.split(AV.strDelim)[1];
		aLog("inserting presetScene: "+presetName,1);
		this.sceneNames.push(presetName);
		if(oldList.indexOf(presetName) === -1)
			retVal = this.sceneNames[this.sceneNames.length-1]
	}
	this.sceneNames = this.sceneNames.sort();
	if(g.gui)
		g.gui.refreshSetting(g.sceneSelector, 'scene', g.sceneSelector.sceneNames);
	return retVal;
};
SceneSelector.prototype.insertActualScene = function(scene)
{
	this.sceneNames.push(scene);
	this.actualScenes.push(scene);
}
