var WGL = {};
WGL.initAndGetShader = function(shader)
{
	aLog("initializing webgl",3);
	window.gl = initCanvas("webgl");
	var shaderProgram = WGL.createProgram( shader.vShader, shader.fShader );
	WGL.onCanvasResize();
	canvasResize();
	gl.useProgram(shaderProgram);
	shaders.setUniforms(shaderProgram, shader.uniforms);
	shaders.setAttributes(shaderProgram, shader.attributes);
	console.dir(shaderProgram);
	return shaderProgram;
},
WGL.deInitializeGL = function()
{
	aLog("deinitializing webgl",3);
	window.gl = null;
	initCanvas("2d");
	canvasResize();
},
WGL.createProgram = function( vertex, fragment ) {
	var program = gl.createProgram();
	var vs = WGL.createShader( vertex, gl.VERTEX_SHADER );
	var fs = WGL.createShader( '#ifdef GL_ES\nprecision highp float;\n#endif\n\n' + fragment,
							gl.FRAGMENT_SHADER );
	if (vs == null||fs == null)
		return null;

	gl.attachShader( program, vs );
	gl.attachShader( program, fs );

	gl.deleteShader( vs );
	gl.deleteShader( fs );

	gl.linkProgram( program );
	if ( !gl.getProgramParameter( program, gl.LINK_STATUS ) ) {
		aLog( "ERROR:\n" +
		"VALIDATE_STATUS: " + gl.getProgramParameter( program, gl.VALIDATE_STATUS ) + "\n" +
		"ERROR: " + gl.getError() + "\n\n" +
		"- Vertex Shader -\n" + vertex + "\n\n" +
		"- Fragment Shader -\n" + fragment );
		return null;
	}
	return program;
},
WGL.createShader=function( src, type ) {
	var shader = gl.createShader( type );
	gl.shaderSource( shader, src );
	gl.compileShader( shader );
	if ( !gl.getShaderParameter( shader, gl.COMPILE_STATUS ) ) {
		alert( ( type == gl.VERTEX_SHADER ? "VERTEX" : "FRAGMENT" ) + " SHADER:\n" +
				gl.getShaderInfoLog( shader ) );
		return null;
	}
	return shader;
},
WGL.onCanvasResize=function(){
	gl.viewport( 0, 0, g.canvas.width, g.canvas.height );
};
