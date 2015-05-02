var s = s || {};
s.widthInHalf;
s.heightInHalf;

s.rotationOffset = Math.PI/4.0;
s.clrOffset = 0.0;
var AudioScenes = AudioScenes || {}

var SceneSelector = function(sceneNames)
{
	this.sceneNames = sceneNames;
	this.setRandomScene();
};
SceneSelector.prototype.setRandomScene = function()
{
    var i = Math.round(Math.random()*(this.sceneNames.length-1));
    this.scene = this.sceneNames[i];
};
