fun = {};
fun.CanvasManager = function()
{
	this.activeShaders = [];
    this.init = function()
    {
        canvas = g.canvas;
        window.addEventListener( 'resize', this.onWindowResize);
    };
	this.deInitialize = function(){
        window.removeEventListener( 'resize', this.onWindowResize);
	};
	this.setActiveShaders = function(activeShaders){
		this.activeShaders = activeShaders;
		for(var i = 0; i<this.activeShaders.length; i++){
			if(!this.activeShaders[i]){
				debugger;
			}
		}

	}
    this.onWindowResize = function(event)
    {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        screenWidth = canvas.width;
        screenHeight = canvas.height;

        window.gl.viewport( 0, 0, canvas.width, canvas.height );
        //terrainShader.setResolution(parameters.screenWidth,parameters.screenHeight);
        //generalshader.setResolution(parameters.screenWidth,parameters.screenHeight);
        mat4.perspective(perspectiveMatrix,
			1.65/2.0,  screenWidth/screenHeight, 0.1, 1000.0);
		for(var i = 0; i<this.activeShaders.length; i++){
			this.activeShaders[i].setPerspective(perspectiveMatrix);
		}
    }

}
fun.SceneManager = function()
{
    var scene = null;
    this.init=function(sceneObj, settings) 
    {
        scene = new sceneObj();
        scene.init(settings);
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
