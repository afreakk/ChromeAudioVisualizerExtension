var s = s || {};
s.widthInHalf = 0.0;
s.heightInHalf = 0.0;

s.rotationOffset = Math.PI/4.0;
s.clrOffset = 0.0;
var AudioScenes = AudioScenes || {},

getAllSceneNames=function(customScenes)
{
	allScenes = [];
	for(var sceneName in AudioScenes){
		var scene = new AudioScenes[sceneName];
		allScenes.push(scene.name);
	}
	for(var customSceneName in customScenes){
		allScenes.push(customSceneName.split(AV.strDelim)[1]);
	}
	return allScenes;
},
getFrequency=function(from, to)
{
	var total = 0;
	if(!g.byteFrequency)
		return 0;
	var i;
	for (i = Math.round(from); i < Math.round(to); i++)
		total += g.byteFrequency[i];
	return total||0;
},
getLow=function(){
	var third = g.frequencyBinCount/3;
	return getFrequency(0,third);
},
getMid=function(){
	var third = g.frequencyBinCount/3;
	return getFrequency(third, third*2);
},
getHigh=function(){
	var third = g.frequencyBinCount/3;
	return getFrequency(third*2, g.frequencyBinCount-1)*10;
};
function getVolume(){
	return getFrequency(0, g.frequencyBinCount/16);
};
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
function parseSettings(scene, settings, preset)
{
	scene.settings = new settings();
	if(preset === "default")
		return scene.name = scene.originalName;
	for(var preSetSetting in preset)
		scene.settings[preSetSetting] = preset[preSetSetting];
	return scene.name;
}


function spin(i, data)
{
	var max = g.frequencyBinCount-1;
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
	var max = g.frequencyBinCount-1;
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
