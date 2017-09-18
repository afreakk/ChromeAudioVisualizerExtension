fun = {};
fun.CanvasManager = function()
{
    this.init = function()
    {
        canvas = g.canvas;
        window.addEventListener( 'resize', this.onWindowResize, false );
    };
    this.onWindowResize = function(event)
    {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        screenWidth = canvas.width;
        screenHeight = canvas.height;

        window.gl.viewport( 0, 0, canvas.width, canvas.height );
        //terrainShader.setResolution(parameters.screenWidth,parameters.screenHeight);
        //generalshader.setResolution(parameters.screenWidth,parameters.screenHeight);
        mat4.perspective(perspectiveMatrix, 1.65/2.0,  screenWidth/screenHeight, 0.1, 1000.0)
        generalShader.setPerspective(perspectiveMatrix);
        terrainShader.setPerspective(perspectiveMatrix);
    }

}
fun.GLManager = function()
{
    this.initShaders = function()
    {
        var terrainVertex_shader    = Tvs;
        var terrainFragment_shader  = Tfs;
        terrainShader = new TerrainShader(terrainVertex_shader, terrainFragment_shader);
        terrainShader.init();

        var generalVertex_shader    = Gvs;
        var generalFragment_shader  = Gfs;
        
        generalShader = new GeneralShader(generalVertex_shader, generalFragment_shader);
        generalShader.init();
    };
}
fun.SceneManager = function()
{
    var scene = null;
    this.init=function() 
    {
        scene = new TryTerrainScene();
        scene.init();
    };
    this.update=function(settings) 
    {
        scene.update(settings);
    };
}

fun.TimeManager = function()
{
    var start_time = new Date().getTime();
    var lastTime = start_time;
    this.handleTime=function()
    {
        time = new Date().getTime() - start_time;
        dt = time-lastTime;
        lastTime = time;
    };
}
