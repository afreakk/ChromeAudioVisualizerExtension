ColorMixSettings = function()
{
	this.volumeMultiplier = 0.000001,
	this.redSpeed = 1.0,
	this.greenSpeed = 0.5,
	this.blueSpeed = 0.25;
},
AudioScenes.ColorMixScene = function()
{
	this.name = "ColorMixScene",
	this.buffer = null,
	this.vertex_position, // 0 ?
	this.currentProgram = null,
	this.soundValue = 0,
	this.start_time = new Date().getTime();
},
AudioScenes.ColorMixScene.prototype.cleanUp = function()
{
	WGL.deInitializeGL();
},
AudioScenes.ColorMixScene.prototype.parseSettings = function(preset)
{
	parseSettings(this,ColorMixSettings, preset);
},
AudioScenes.ColorMixScene.prototype.square = function(){
	sq = [- 1.0, - 1.0, 1.0, - 1.0, - 1.0, 1.0, 1.0, - 1.0, 1.0, 1.0, - 1.0, 1.0];
	return new Float32Array(sq);
},
AudioScenes.ColorMixScene.prototype.init = function(){
	this.currentProgram = WGL.initAndGetShader(shaders.twoDVShader, shaders.fShader),
	this.buffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, this.buffer );
	gl.bufferData( gl.ARRAY_BUFFER, this.square(), gl.STATIC_DRAW );
},
AudioScenes.ColorMixScene.prototype.clearBg = function(clearColored)
{
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
},
AudioScenes.ColorMixScene.prototype.update = function(){

	gl.useProgram( this.currentProgram );
	var time = new Date().getTime() - this.start_time;
	var volume = getVolume();
	this.soundValue += volume?volume*this.settings.volumeMultiplier:0;
	gl.uniform1f( gl.getUniformLocation( this.currentProgram, 'time' ), this.soundValue );
	gl.uniform2f( gl.getUniformLocation( this.currentProgram, 'resolution' ),
			g.canvas.width, g.canvas.height );
	gl.uniform3f( gl.getUniformLocation( this.currentProgram, 'colorInfluence'),
			this.settings.redSpeed, this.settings.greenSpeed, this.settings.blueSpeed);

	gl.bindBuffer( gl.ARRAY_BUFFER, this.buffer );
	gl.vertexAttribPointer( this.vertex_position, 2, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( this.vertex_position );
	gl.drawArrays( gl.TRIANGLES, 0, 6 );
	gl.disableVertexAttribArray( this.vertex_position );
};
