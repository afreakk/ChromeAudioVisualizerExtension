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

terrain = {};

terrain.init = function()
{
    canvasMgr = new fun.CanvasManager();
    canvasMgr.init();

    glMgr = new fun.GLManager();
    glMgr.initShaders();

    timeMgr = new fun.TimeManager();

    sceneMgr = new fun.SceneManager();
    sceneMgr.init();

    key = new KeyManager();
    key.init();

    canvasMgr.onWindowResize();
}

terrain.update = function(settings)
{
    timeMgr.handleTime();
    sceneMgr.update(settings);
}
