var xxlol = function(x,y,z){
	this.x = x;
	this.y = y;
	this.z = z;
	this.pos=vec3.create();
	this.modelViewMatrix=mat4.create();
	this.normalMatrix=mat4.create();

	this.update = function(
		v,
		speed,
		width,
		height,
		directionChangeSpeed
	){
		this.x += Math.sin(v*directionChangeSpeed)*v*speed;
		this.y += Math.cos(v*directionChangeSpeed)*v*speed;
		this.z += Math.sin(v*directionChangeSpeed)*v*speed;
		this.pos[0]=this.x,
		this.pos[1]=this.y,
		this.pos[2]=this.z;
		mat4.fromTranslation(this.modelViewMatrix, this.pos);
		var s = vec3.create();
		s[0]=(width*v), s[1]=(height*v), s[2]=(width*v);
		var scaleMatrix = mat4.create();
		mat4.scale(scaleMatrix, scaleMatrix, s);
		mat4.mul(this.modelViewMatrix, this.modelViewMatrix, scaleMatrix);
		mat4.invert(this.normalMatrix, this.modelViewMatrix);
		mat4.transpose(this.normalMatrix, this.normalMatrix);
	};
	this.draw = function(
		colorStr,
		colorChangeSpeed,
		program,
		indiceLen,
		v,
		textureSinusIntensity
	){
		gl.uniformMatrix4fv(
			program.normalMatrix,
			gl.FALSE,
			this.normalMatrix
		);
		gl.uniformMatrix4fv(
			program.modelViewMatrix,
			gl.FALSE,
			this.modelViewMatrix
		);
		gl.uniform3f(program.colorInfluence,
			Math.sin(v*colorChangeSpeed)*colorStr,
			Math.cos(v*colorChangeSpeed)*colorStr,
			Math.cos(v*colorChangeSpeed+0.35)*colorStr
		);
		gl.uniform4f(program.worldPos,this.x,this.y,this.z,v*textureSinusIntensity);
		gl.drawElements(
			gl.TRIANGLES,
			indiceLen,
			gl.UNSIGNED_SHORT,
			0
		);
	};
};

DancingCubes3DSinusSetting = function()
{
    this.danceSpeed = 0.00005;
	this.directionChangeSpeed = 0.2012;

	this.cubeCount = 15;
	this.colorStrength = 1.01;

	this.spaceX = 99.091;
	this.spaceY = 99.091;
	this.spaceZ = 99.091;
	this.spaceW = 99.091;
	this.spaceZOffset = 2.5;
	this.colorChangeSpeed = 0.0101;
	this.width = 0.0004;
	this.height = 0.0004;
	this.textureSinusIntensity = 0.05
	this.bgRed = 0.8;
	this.bgGreen = 0.3;
	this.bgBlue = 0.4;
	this.bgAlpha = 0.4;
	this.cubeAlphaModifier = 0.1;
},
AudioScenes.DancingCubes3DSinus = function()
{
    this.name = "DancingCubes3DSinus";
	this.vxBuffer = null,
	this.ixBuffer = null,
	this.currentProgram = null,
	this.soundValue = 0,
	this.cubes=[],
	this.start_time = new Date().getTime();
},
AudioScenes.DancingCubes3DSinus.prototype.cleanUp = function()
{
	WGL.deInitializeGL();
},
AudioScenes.DancingCubes3DSinus.prototype.init = function(){
	WGL.init(),
	this.currentProgram = WGL.getShader(shaders.xxx);
	this.cube = this.getCube();
	this.initBuffers();
	this.initUniforms();
	gl.clearDepth(1.0);                 // Clear everything
	gl.enable(gl.DEPTH_TEST);           // Enable depth testing
	gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
	gl.enable(gl.CULL_FACE);
	gl.cullFace(gl.BACK);
},
AudioScenes.DancingCubes3DSinus.prototype.initUniforms = function()
{
	this.projectionMatrix=mat4.perspective(mat4.create(), 45*Math.PI/180, gl.canvas.clientWidth/gl.canvas.clientHeight, 1, 1000);
},
AudioScenes.DancingCubes3DSinus.prototype.initBuffers = function()
{
	this.vxBuffer = gl.createBuffer();
	this.nrmBuffer = gl.createBuffer();
	this.ixBuffer = gl.createBuffer();

	gl.bindBuffer( gl.ARRAY_BUFFER, this.vxBuffer );
	gl.bufferData(
		gl.ARRAY_BUFFER,
		new Float32Array(this.cube.vertices),
		gl.STATIC_DRAW
	);

	gl.bindBuffer( gl.ARRAY_BUFFER, this.nrmBuffer );
	gl.bufferData(
		gl.ARRAY_BUFFER,
		new Float32Array(this.cube.normals),
		gl.STATIC_DRAW
	);

	gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.ixBuffer );
	gl.bufferData(
		gl.ELEMENT_ARRAY_BUFFER,
		new Uint16Array(this.cube.indices),
		gl.STATIC_DRAW
	);
},
AudioScenes.DancingCubes3DSinus.prototype.parseSettings = function(preset)
{
	parseSettings(this,DancingCubes3DSinusSetting, preset);
},
AudioScenes.DancingCubes3DSinus.prototype.clearBg = function()
{
},
AudioScenes.DancingCubes3DSinus.prototype.update = function(){
	gl.uniform1f(this.currentProgram.cubeAlpha, this.settings.cubeAlphaModifier);
	gl.clearColor(this.settings.bgRed, this.settings.bgGreen, this.settings.bgBlue, this.settings.bgAlpha);  // Clear to black, fully opaque
	gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

	gl.enableVertexAttribArray( this.currentProgram.position );
	gl.bindBuffer( gl.ARRAY_BUFFER, this.vxBuffer );
	gl.vertexAttribPointer(
		this.currentProgram.position,
		3,
		gl.FLOAT,
		gl.FALSE,
		0,
		0
	);

	gl.enableVertexAttribArray( this.currentProgram.vertexNormal );
	gl.bindBuffer( gl.ARRAY_BUFFER, this.nrmBuffer );
	gl.vertexAttribPointer(
		this.currentProgram.vertexNormal,
		3,
		gl.FLOAT,
		gl.FALSE,
		0,
		0
	);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ixBuffer);

	gl.uniformMatrix4fv(
		this.currentProgram.projectionMatrix,
		gl.FALSE,
		this.projectionMatrix
	);
    var xs = this.settings;
	gl.uniform1f(
	this.currentProgram.spaceZOffset,
		xs.spaceZOffset
	);
	gl.uniform4f(
		this.currentProgram.space,
		xs.spaceX,xs.spaceY,xs.spaceZ,xs.spaceW
	);
	for(var i=0; i<xs.cubeCount; i++){
		if(!this.cubes[i]){
			this.cubes[i] = new xxlol(
				Math.random(),
				Math.random(),
				Math.random()
			);
		}
		var sum = 0;
		if(!isNaN(g.byteFrequency[i])){
			sum =g.byteFrequency[i];
		}
		this.cubes[i].update(
			sum,
			xs.danceSpeed,
			xs.width,
			xs.height,
			xs.directionChangeSpeed
		);
		this.cubes[i].draw(
			xs.colorStrength,
			xs.colorChangeSpeed,
			this.currentProgram,
			this.cube.indices.length,
			sum,
			xs.textureSinusIntensity
		);
	}
};
AudioScenes.DancingCubes3DSinus.prototype.getCube = function(){
	return	{
		'vertices' : [
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
		],
		'indices' : [
			0,  1,  2,      0,  2,  3,    // front
			4,  5,  6,      4,  6,  7,    // back
			8,  9,  10,     8,  10, 11,   // top
			12, 13, 14,     12, 14, 15,   // bottom
			16, 17, 18,     16, 18, 19,   // right
			20, 21, 22,     20, 22, 23,   // left
		],
		'normals': [
			// Front
			 0.0,  0.0,  1.0,
			 0.0,  0.0,  1.0,
			 0.0,  0.0,  1.0,
			 0.0,  0.0,  1.0,

			// Back
			 0.0,  0.0, -1.0,
			 0.0,  0.0, -1.0,
			 0.0,  0.0, -1.0,
			 0.0,  0.0, -1.0,

			// Top
			 0.0,  1.0,  0.0,
			 0.0,  1.0,  0.0,
			 0.0,  1.0,  0.0,
			 0.0,  1.0,  0.0,

			// Bottom
			 0.0, -1.0,  0.0,
			 0.0, -1.0,  0.0,
			 0.0, -1.0,  0.0,
			 0.0, -1.0,  0.0,

			// Right
			 1.0,  0.0,  0.0,
			 1.0,  0.0,  0.0,
			 1.0,  0.0,  0.0,
			 1.0,  0.0,  0.0,

			// Left
			-1.0,  0.0,  0.0,
			-1.0,  0.0,  0.0,
			-1.0,  0.0,  0.0,
			-1.0,  0.0,  0.0
		],
		//new Float32Array(
		'txCoords' : [
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
		]
	};
};
