var Tvs = ''+
			'attribute vec2 grid;' +
            'attribute float yPoint;' +
            'uniform mat4 perspective;' +
			'uniform float time;' +
            'varying vec3 pos;' +
 
			'void main() {' +
                'float mountainHeight = 30.0;' +
                'vec3 camPos = vec3(0.0, 75.0, 25.0);' +
                'pos = vec3(grid.x, (yPoint/2.0+0.5)*mountainHeight- (grid.y/1.1), grid.y);' +
				'gl_Position = perspective*vec4( pos-camPos, 1.0 );' +
                'pos.y = yPoint/2.0+0.5;' +
 
			'}';
var Tfs = ''+
			'uniform float time;'+
			'uniform vec2 resolution;'+
			'uniform vec4 colorOffset;'+
            'varying vec3 pos;'+
			'void main( void ) {'+
                'vec4 endC = vec4(0.0,0.0,0.0,1.0);'+
                'endC.b += 1.0-pos.y;'+
                'endC.g += pos.y;'+
                'float yellow = 1.0-abs(endC.b-endC.g);'+
                'endC.r += yellow;'+
                'endC.g += yellow;'+
                'gl_FragColor = endC * colorOffset;'+
 
			'}';
function TerrainShader()
{
    this.program = createProgram( Tvs, Tfs );
    this.vertexBase_position    = null;
    this.vertexHeight_position  = null;

    this.resolution = null;
	this.colorOffset = null;
    this.time       = null;
    this.perspective= null;
    this.init=function(projectionMatrix)
    {
        this.vertexBase_position    = gl.getAttribLocation( this.program, "grid" );   
        this.vertexHeight_position  = gl.getAttribLocation( this.program, "yPoint" );   

        this.colorOffset = gl.getUniformLocation( this.program, 'colorOffset' );
        this.resolution = gl.getUniformLocation( this.program, 'resolution' );
        this.time       = gl.getUniformLocation( this.program, 'time' );
        this.perspective= gl.getUniformLocation( this.program, 'perspective' );
    }
    this.setResolution=function(width, height)
    {
        gl.useProgram( this.program );
        gl.uniform2f( this.resolution, width, height );
    }
    this.setColorOffset=function(r, b, g, a)
    {
        gl.useProgram( this.program );
        gl.uniform4f( this.colorOffset, r, g, b, a );
    }
    this.setTime=function(time)
    {
        gl.useProgram( this.program );
        gl.uniform1f( this.time, time );
    }
    this.setPerspective=function(matrix)
    {
        gl.useProgram( this.program );
        gl.uniformMatrix4fv( this.perspective, false, matrix ); 
    }
    this.drawGrid=function(baseBuffer, yBuffer, indexBuffer, stripGrid, verticesY)
    {
        gl.useProgram( this.program );

        gl.bindBuffer( gl.ARRAY_BUFFER, baseBuffer );
        gl.vertexAttribPointer( terrainShader.vertexBase_position, 2, gl.FLOAT, false, 0, 0 );

        gl.bindBuffer( gl.ARRAY_BUFFER, yBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( verticesY ), gl.DYNAMIC_DRAW );
        gl.vertexAttribPointer( terrainShader.vertexHeight_position, 1, gl.FLOAT, false, 0, 0 );

        gl.enableVertexAttribArray( terrainShader.vertexBase_position );
        gl.enableVertexAttribArray( terrainShader.vertexHeight_position );

        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.drawElements( gl.TRIANGLE_STRIP, stripGrid.getIndicesCount(), gl.UNSIGNED_SHORT, 0 );

        gl.disableVertexAttribArray( terrainShader.vertexBase_position );
        gl.disableVertexAttribArray( terrainShader.vertexHeight_position );
    }
}

