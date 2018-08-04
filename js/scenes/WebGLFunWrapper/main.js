// Global variables, for easy access -->
var canvas;
var gl;
var terrainshader;
var generalShader;
var time = 0;
var screenWidth = 0;
var screenHeight = 0;
var dt = 0;
var perspectiveMatrix = mat4.create();
// <-- end Global variables

// Managers -->
var canvasMgr = null;
var timeMgr = null;
var sceneMgr = null;
// <-- End managers 

var terrain = {};


terrain.init = function(settings)
{
    terrain.canvasMgr = new fun.CanvasManager();
    terrain.canvasMgr.init();

	terrainShader = new TerrainShader();
	terrainShader.init();

    terrain.canvasMgr.setActiveShaders([terrainShader]);

    timeMgr = new fun.TimeManager();

    sceneMgr = new fun.SceneManager();
    sceneMgr.init(TryTerrainScene, settings);

    key = new KeyManager();
    key.init();

    terrain.canvasMgr.onWindowResize();
}

terrain.deInitialize = function()
{
	terrain.canvasMgr.deInitialize();
}

terrain.update = function(settings)
{
    timeMgr.handleTime();
    sceneMgr.update(settings);
}
