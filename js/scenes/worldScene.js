CubeSceneSetting = function()
{
	this.volumeMultiplier = 0.0001,
	this.redSpeed =		0.00002,
	this.greenSpeed =	0.00002,
	this.blueSpeed =	0.00002;

	this.spinSpeed = 0.001;
	this.cubeVolumeScale = 0.0001;
},
AudioScenes.CubeScene = function()
{
	this.name = "SpinningCube",
	this.vxBuffer = null,
	this.ixBuffer = null,
	this.txBuffer = null,
	this.currentProgram = null,
	this.soundValue = 0,
	this.start_time = new Date().getTime();
},
AudioScenes.CubeScene.prototype.cleanUp = function()
{
	WGL.deInitializeGL();
},
AudioScenes.CubeScene.prototype.init = function(){

	WGL.init(),
	this.currentProgram = WGL.getShader(shaders.threeDShader);
	var cube = this.getCube();
	this.vertices = cube.vertices,this.indices = cube.indices,
	this.txCoords = cube.txCoords;
	this.modelMatrix = mat4.create();
	this.initBuffers();
	this.initUniforms();
//	this.initTexture();
	gl.enableVertexAttribArray( this.currentProgram.position );
	gl.enableVertexAttribArray( this.currentProgram.aTxCoords );

},
AudioScenes.CubeScene.prototype.parseSettings = function(preset)
{
	parseSettings(this,CubeSceneSetting, preset);
},
AudioScenes.CubeScene.prototype.clearBg = function()
{
},
AudioScenes.CubeScene.prototype.updateUniforms = function()
{
	if(!OV.transparentBackground)
		gl.clearColor(0.0, 0.0, 0.5, 1.0);
	else
		gl.clearColor(0.0, 0.0, 0.0, 0.0);
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
	var volume = getVolume()/100.0;
	if(isNaN(volume))
		volume=0;
	var t = vec3.create();
	t[0]=0.5, t[1]=0.5, t[2]=0.5;
	mat4.rotate(this.modelMatrix, this.modelMatrix, volume*this.settings.spinSpeed, t);
	var s = vec3.create();
	s[0]=getHigh(), s[1]=getMid(), s[2]=getLow();
	for(var i=0; i<s.length; i++)
		s[i] = Math.max(s[i]*this.settings.cubeVolumeScale, 0.1);
	var scaleMatrix = mat4.create();
	mat4.scale(scaleMatrix, scaleMatrix, s);

	var sendMatrix = mat4.create(); 
	mat4.mul(sendMatrix, this.modelMatrix, scaleMatrix);

	gl.uniformMatrix4fv(this.currentProgram.modelMatrix,gl.FALSE,sendMatrix);

	var time = new Date().getTime() - this.start_time;
	this.soundValue += volume*this.settings.volumeMultiplier;
	gl.uniform1f( this.currentProgram.time, this.soundValue );
	gl.uniform2f( this.currentProgram.resolution,g.canvas.width, g.canvas.height );
	gl.uniform3f( this.currentProgram.colorInfluence,
			this.settings.redSpeed*getLow(), this.settings.greenSpeed*getMid(),
			this.settings.blueSpeed*getHigh());
},
AudioScenes.CubeScene.prototype.initBuffers = function()
{
	this.vxBuffer = gl.createBuffer();
	this.ixBuffer = gl.createBuffer();
	this.txBuffer = gl.createBuffer();


	gl.bindBuffer( gl.ARRAY_BUFFER, this.vxBuffer );
	gl.bufferData( gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW );

	gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.ixBuffer );
	gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW );

	gl.bindBuffer( gl.ARRAY_BUFFER, this.txBuffer );
	gl.bufferData( gl.ARRAY_BUFFER, this.txCoords, gl.STATIC_DRAW );
},
AudioScenes.CubeScene.prototype.drawBuffers = function()
{
	gl.bindBuffer( gl.ARRAY_BUFFER, this.txBuffer );
	gl.vertexAttribPointer( this.currentProgram.aTxCoords, 2, gl.FLOAT, false, 0, 0 );

	gl.bindBuffer( gl.ARRAY_BUFFER, this.vxBuffer );
	gl.vertexAttribPointer( this.currentProgram.position, 3, gl.FLOAT, false, 0, 0 );

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ixBuffer);
	gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
},
AudioScenes.CubeScene.prototype.update = function(){

	this.updateUniforms();
	this.drawBuffers();
},
AudioScenes.CubeScene.prototype.initUniforms = function()
{
	//texturezz
//    gl.activeTexture(gl.TEXTURE0);
 //   gl.bindTexture(gl.TEXTURE_2D, this.neheTexture);
  //  gl.uniform1i(this.currentProgram.samplerUniform, 0);

	//m4trixxx
	gl.uniformMatrix4fv(this.currentProgram.projectionMatrix,
		gl.FALSE, mat4.perspective(mat4.create(), 45, 16/9, 1, 100));

	var worldMatrix = mat4.create();
	var translateBy = vec3.create();
	translateBy[2] = -5;
	mat4.translate(worldMatrix, worldMatrix, translateBy);
	gl.uniformMatrix4fv(this.currentProgram.worldMatrix,gl.FALSE,worldMatrix);
},
AudioScenes.CubeScene.prototype.initTexture = function()
{
	this.neheTexture = gl.createTexture();
	this.neheTexture.image = new Image();
	this.neheTexture.image.crossOrigin = 'anonymous';
    this.neheTexture.image.onload = function() {
		this.handleLoadedTexture(this.neheTexture);
    }.bind(this);
    this.neheTexture.image.src =
		"http://i.ytimg.com/vi/smB6ZJnUNzA/maxresdefault.jpg";
},
AudioScenes.CubeScene.prototype.handleLoadedTexture=function(texture) {
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.bindTexture(gl.TEXTURE_2D, null);
},


//geometry data
AudioScenes.CubeScene.prototype.getCube = function(){
	return	{
		'vertices' : new Float32Array([
		  // Front face
		  -1.0, -1.0,  1.0,
		   1.0, -1.0,  1.0,
		   1.0,  1.0,  1.0,
		  -1.0,  1.0,  1.0,

		  // Back face
		  -1.0, -1.0, -1.0,
		  -1.0,  1.0, -1.0,
		   1.0,  1.0, -1.0,
		   1.0, -1.0, -1.0,

		  // Top face
		  -1.0,  1.0, -1.0,
		  -1.0,  1.0,  1.0,
		   1.0,  1.0,  1.0,
		   1.0,  1.0, -1.0,

		  // Bottom face
		  -1.0, -1.0, -1.0,
		   1.0, -1.0, -1.0,
		   1.0, -1.0,  1.0,
		  -1.0, -1.0,  1.0,

		  // Right face
		   1.0, -1.0, -1.0,
		   1.0,  1.0, -1.0,
		   1.0,  1.0,  1.0,
		   1.0, -1.0,  1.0,

		  // Left face
		  -1.0, -1.0, -1.0,
		  -1.0, -1.0,  1.0,
		  -1.0,  1.0,  1.0,
		  -1.0,  1.0, -1.0,
		]),
		'indices' : new Uint16Array([
		  0, 1, 2,      0, 2, 3,    // Front face
		  4, 5, 6,      4, 6, 7,    // Back face
		  8, 9, 10,     8, 10, 11,  // Top face
		  12, 13, 14,   12, 14, 15, // Bottom face
		  16, 17, 18,   16, 18, 19, // Right face
		  20, 21, 22,   20, 22, 23  // Left face
		]),
		'txCoords' : new Float32Array([
		  // Front face
		  0.0, 0.0,
		  1.0, 0.0,
		  1.0, 1.0,
		  0.0, 1.0,

		  // Back face
		  1.0, 0.0,
		  1.0, 1.0,
		  0.0, 1.0,
		  0.0, 0.0,

		  // Top face
		  0.0, 1.0,
		  0.0, 0.0,
		  1.0, 0.0,
		  1.0, 1.0,

		  // Bottom face
		  1.0, 1.0,
		  0.0, 1.0,
		  0.0, 0.0,
		  1.0, 0.0,

		  // Right face
		  1.0, 0.0,
		  1.0, 1.0,
		  0.0, 1.0,
		  0.0, 0.0,

		  // Left face
		  0.0, 0.0,
		  1.0, 0.0,
		  1.0, 1.0,
		  0.0, 1.0,
		])
	};
};
