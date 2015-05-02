var s = s || {};
s.widthInHalf = 0.0;
s.heightInHalf = 0.0;

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

function spin(i, data)
{
	var max = AV.fftSize-1;
    while(i > max)
		i -= max;
    while(i < 0)
		i += max;
	var idx = Math.max(Math.min(i, max), 0);
	return data[idx] ? data[idx] : 0;
};
