ColorMixSettings = function()
{
	this.lowRedSpeed	=0.005,
	this.midGreenSpeed	=0.005,
	this.highBlueSpeed	=0.005;
	this.revLow = 0.1;
	this.revMid = 0.1;
	this.revHigh = 0.1;
	this.overAllSpeedReducer = 4;
	this.madness = 4;
},
AudioScenes.MadnessScene = function()
{
	this.name = "Madness",
	this.buffer = null,
	this.shader = null,
	this.low = 0,
	this.mid = 0,
	this.high = 0;
},
AudioScenes.MadnessScene.prototype.cleanUp = function()
{
	WGL.deInitializeGL();
},
AudioScenes.MadnessScene.prototype.parseSettings = function(preset)
{
	parseSettings(this,ColorMixSettings, preset);
},
AudioScenes.MadnessScene.prototype.square = function(){
	sq = [- 1.0, - 1.0, 1.0, - 1.0, - 1.0, 1.0, 1.0, - 1.0, 1.0, 1.0, - 1.0, 1.0];
	return new Float32Array(sq);
},
AudioScenes.MadnessScene.prototype.init = function(){
	WGL.init(),
	this.shader = WGL.getShader(shaders.madnessShader);
	this.buffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, this.buffer );
	gl.bufferData( gl.ARRAY_BUFFER, this.square(), gl.STATIC_DRAW );
},
AudioScenes.MadnessScene.prototype.clearBg = function()
{
},
AudioScenes.MadnessScene.prototype.update = function(){

	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
	spec=[];
	spec[0] = (getLow() /100)*this.settings.lowRedSpeed	 - this.settings.revLow;
	spec[1] =(getMid() /100)*this.settings.midGreenSpeed - this.settings.revMid; 
	spec[2] = (getHigh()/100)*this.settings.highBlueSpeed - this.settings.revHigh;

	spec[0] = Math.max(spec[0], this.settings.revLow/2.0);
	spec[1] = Math.max(spec[1], this.settings.revMid/2.0);
	spec[2] = Math.max(spec[2], this.settings.revHigh/2.0);

	for(var i=0; i< spec.length; i++)
		spec[i] = spec[i]/this.settings.overAllSpeedReducer;

	this.low +=	spec[0];
	this.mid =	spec[1];
	this.high+= spec[2];

	//console.log(this.low, this.mid, this.high);

	gl.uniform1f(this.shader.low, this.low);
	gl.uniform1f(this.shader.mid, this.mid);
	gl.uniform1f(this.shader.high, this.high);
	gl.uniform1f(this.shader.madness, this.settings.madness);
	gl.uniform2f(this.shader.resolution, g.canvas.width, g.canvas.height);
	gl.uniform3f(this.shader.colorInfluence, 1.0,
		this.settings.midGreenSpeed, this.settings.highBlueSpeed);

	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
	gl.vertexAttribPointer(this.shader.position, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray( this.shader.position);
	gl.drawArrays(gl.TRIANGLES, 0, 6);
	gl.disableVertexAttribArray(this.shader.position);
};
