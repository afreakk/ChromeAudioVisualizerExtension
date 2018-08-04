
TerrainSceneSetting = function()
{
	this.moveSpeed = 0.001554;
	this.smoothing = 0.0029;
	this.width = 325;
	this.height = 200;
	this.tileSize = 0.5;
	this.zOffset = -30;
	this.redOffset = 1.0;
	this.greenOffset = 1.0;
	this.blueOffset = 1.0;
	this.alphaOffset = 1.0;
},
AudioScenes.TerrainScene = function()
{
    this.name = "ProceduralTerrain";
},
AudioScenes.TerrainScene.prototype.cleanUp = function()
{
	terrain.deInitialize();
	WGL.deInitializeGL();
},
AudioScenes.TerrainScene.prototype.init = function(){

	WGL.init(),
	terrain.init(this.settings);

},
AudioScenes.TerrainScene.prototype.parseSettings = function(preset)
{
	parseSettings(this,TerrainSceneSetting, preset);
},
AudioScenes.TerrainScene.prototype.parseSettings = function(preset)
{
	parseSettings(this,TerrainSceneSetting, preset);
},
AudioScenes.TerrainScene.prototype.clearBg = function()
{
},
AudioScenes.TerrainScene.prototype.update = function(){
	if(!OV.transparentBackground)
		gl.clearColor(1, 1, 1, 1);
	else
		gl.clearColor(0.1, 0.1, 0.1, 0.1);
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
	terrain.update(this.settings);
};


