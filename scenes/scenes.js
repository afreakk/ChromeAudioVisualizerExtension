var s = s || {};
s.widthInHalf;
s.heightInHalf;

s.rotationOffset = Math.PI/4.0;
s.clrOffset = 0.0;
var AudioScenes = AudioScenes || {}

var SceneSelector = function(sceneNames)
{
    var i = Math.round(Math.random()*(sceneNames.length-1));
    this.scene = sceneNames[i];
    this.scene = "Wart";
}
