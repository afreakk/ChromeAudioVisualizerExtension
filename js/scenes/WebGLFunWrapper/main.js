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
var glMgr = null;
var timeMgr = null;
var sceneMgr = null;
// <-- End managers 

var terrain = {};


terrain.init = function()
{
    terrain.canvasMgr = new fun.CanvasManager();
    terrain.canvasMgr.init();

    glMgr = new fun.GLManager();
    glMgr.initShaders();

    timeMgr = new fun.TimeManager();

    sceneMgr = new fun.SceneManager();
    sceneMgr.init();

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
