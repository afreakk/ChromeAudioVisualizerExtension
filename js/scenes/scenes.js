var s = s || {};
s.widthInHalf = 0.0;
s.heightInHalf = 0.0;

s.rotationOffset = Math.PI/4.0;
s.clrOffset = 0.0;
var AudioScenes = AudioScenes || {}

function resetBrokenGlobalSceneValues()
{
	s.widthInHalf=defaultIfBroken(s.widthInHalf, 0.0);
	s.heightInHalf=defaultIfBroken(s.heightInHalf, 0.0);
	s.rotationOffset=defaultIfBroken(s.rotationOffset, Math.PI/4.0);
	s.clrOffset=defaultIfBroken(s.clrOffset, 0.0);
}
function defaultIfBroken(num, defaultValue)
{
	if(num != null && !isNaN(num))
		return num;
	return defaultValue;
}

var SceneSelector = function(sceneNames)
{
	this.sceneNames = sceneNames;
	this.setRandomScene();
};
SceneSelector.prototype.setRandomScene = function()
{
    var i = Math.round(Math.random()*(this.sceneNames.length-1));
    this.scene = this.sceneNames[i];
	//this.scene = "Hexagon";
};

function spin(i, data)
{
	var max = AV.fftSize-1;
	if(i>max)
		i=0+(i-max);
    while(i > max)
		i -= max+1;
    while(i < 0)
		i += max+1;
	var idx = clamp(i, 0, max);
	return data[idx] ? data[idx] : 0;
};

function indexSpinner(i, velocity)
{
	i+=velocity;
	var max = AV.fftSize-1;
	while(i>max)
		i -= max+1;
	while(i<0)
		i += max+1;
	return clamp(i, 0, max);
}
function clamp(x, min, max)
{
	return Math.max(Math.min(x, max), min);
}
