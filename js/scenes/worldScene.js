WorldSceneSetting = function()
{
	this.volumeMultiplier = 0.0001,
	this.redSpeed = 1.0,
	this.greenSpeed = 0.5,
	this.blueSpeed = 0.25;
	this.spinSpeed = 0.0001;
	this.cubeVolumeScale = 0.005;
},
AudioScenes.WorldScene = function()
{
	this.name = "WorldScene",
	this.buffer = null,
	this.vertex_position, // 0 ?
	this.currentProgram = null,
	this.soundValue = 0,
	this.start_time = new Date().getTime();
},
AudioScenes.WorldScene.prototype.cleanUp = function()
{
	WGL.deInitializeGL();
},
AudioScenes.WorldScene.prototype.parseSettings = function(preset)
{
	parseSettings(this,WorldSceneSetting, preset);
},
AudioScenes.WorldScene.prototype.cube = function(){
	var vertices = [
		-1.0,-1.0,-1.0, // triangle 1 : begin
		-1.0,-1.0, 1.0,
		-1.0, 1.0, 1.0, // triangle 1 : end
		1.0, 1.0,-1.0, // triangle 2 : begin
		-1.0,-1.0,-1.0,
		-1.0, 1.0,-1.0, // triangle 2 : end
		1.0,-1.0, 1.0,
		-1.0,-1.0,-1.0,
		1.0,-1.0,-1.0,
		1.0, 1.0,-1.0,
		1.0,-1.0,-1.0,
		-1.0,-1.0,-1.0,
		-1.0,-1.0,-1.0,
		-1.0, 1.0, 1.0,
		-1.0, 1.0,-1.0,
		1.0,-1.0, 1.0,
		-1.0,-1.0, 1.0,
		-1.0,-1.0,-1.0,
		-1.0, 1.0, 1.0,
		-1.0,-1.0, 1.0,
		1.0,-1.0, 1.0,
		1.0, 1.0, 1.0,
		1.0,-1.0,-1.0,
		1.0, 1.0,-1.0,
		1.0,-1.0,-1.0,
		1.0, 1.0, 1.0,
		1.0,-1.0, 1.0,
		1.0, 1.0, 1.0,
		1.0, 1.0,-1.0,
		-1.0, 1.0,-1.0,
		1.0, 1.0, 1.0,
		-1.0, 1.0,-1.0,
		-1.0, 1.0, 1.0,
		1.0, 1.0, 1.0,
		-1.0, 1.0, 1.0,
		1.0,-1.0, 1.0
	];
	return new Float32Array(vertices);
},
AudioScenes.WorldScene.prototype.init = function(){
	this.currentProgram = WGL.initAndGetShader(shaders.threeDShader, shaders.fShaderThreeD),
	gl.useProgram( this.currentProgram );
	this.buffer = gl.createBuffer();
	this.vertices = this.cube();
	this.modelMatrix = mat4.create();
	gl.bindBuffer( gl.ARRAY_BUFFER, this.buffer );
	gl.bufferData( gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW );
	gl.uniformMatrix4fv(gl.getUniformLocation( this.currentProgram, 'projectionMatrix' ),gl.FALSE,
		mat4.perspective(mat4.create(), 45, 16/9, 0, 100));
	var worldMatrix = mat4.create();
	var translateBy = vec3.create();
	translateBy[2] = -5;
	mat4.translate(worldMatrix, worldMatrix, translateBy);
	gl.uniformMatrix4fv(gl.getUniformLocation( this.currentProgram, 'worldMatrix' ),gl.FALSE,
		worldMatrix);
},
AudioScenes.WorldScene.prototype.clearBg = function(clearColored)
{
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
},
AudioScenes.WorldScene.prototype.update = function(){
	var volume = getVolume()/100.0;
	if(isNaN(volume))
		volume=0;
	var t = vec3.create();
	t[0]=0.5, t[1]=0.5, t[2]=0.5;
	mat4.rotate(this.modelMatrix, this.modelMatrix, volume*this.settings.spinSpeed, t);
	var s = vec3.create();
	var sVolume = volume*this.settings.cubeVolumeScale;
	s[0]=sVolume, s[1]=sVolume, s[2]=sVolume;

	var scaleMatrix = mat4.create();
	mat4.scale(scaleMatrix, scaleMatrix, s);

	var sendMatrix = mat4.create(); 
	mat4.mul(sendMatrix, this.modelMatrix, scaleMatrix);

	gl.uniformMatrix4fv(gl.getUniformLocation( this.currentProgram, 'modelMatrix' ),gl.FALSE,
		sendMatrix);

	var time = new Date().getTime() - this.start_time;
	this.soundValue += volume*this.settings.volumeMultiplier;
	gl.uniform1f( gl.getUniformLocation( this.currentProgram, 'time' ), this.soundValue );
	gl.uniform2f( gl.getUniformLocation( this.currentProgram, 'resolution' ),
			g.canvas.width, g.canvas.height );
	gl.uniform3f( gl.getUniformLocation( this.currentProgram, 'colorInfluence'),
			this.settings.redSpeed, this.settings.greenSpeed, this.settings.blueSpeed);

	gl.bindBuffer( gl.ARRAY_BUFFER, this.buffer );
	gl.vertexAttribPointer( this.vertex_position, 3, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( this.vertex_position );
	gl.drawArrays( gl.TRIANGLES, 0, this.vertices.length/3 );
	gl.disableVertexAttribArray( this.vertex_position );
};
