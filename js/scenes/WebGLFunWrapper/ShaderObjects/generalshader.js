var Gvs = ''+
			'attribute vec3 vertexPos;'+
            'uniform mat4 perspective;'+
            'varying vec3 pos;'+
 
			'void main() {'+
                'vec3 camPos = vec3(0.0, 75.0, 25.0);'+
				'gl_Position = perspective*vec4( vertexPos-camPos, 1.0 );'+
                'pos = vertexPos;'+
 
			'}';
var Gfs = ''+
			'uniform float time;'+
			'uniform vec2 resolution;'+
            'varying vec3 pos;'+
			'void main( void ) {'+
                'vec4 endC = vec4(cos(pos.x+time),sin(pos.y+time),tan(pos.z+time),1.0);'+
                'gl_FragColor = endC;'+
 
			'}';

function GeneralShader()
{
    this.program = createProgram( Gvs, Gfs);
    this.vertex_position = null;

    this.resolution = null;
    this.time       = null;
    this.perspective= null;
    this.init=function(projectionMatrix)
    {
        this.vertex_position  = gl.getAttribLocation( this.program, "vertexPos" );   

        this.resolution = gl.getUniformLocation( this.program, 'resolution' );
        this.time       = gl.getUniformLocation( this.program, 'time' );
        this.perspective= gl.getUniformLocation( this.program, 'perspective' );
    }
    this.setResolution=function(width, height)
    {
        gl.useProgram( this.program );
        gl.uniform2f( this.resolution, width, height );
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
	this.drawElements=function(indexBuffer, indexBufferLen, vertexBuffer){
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.drawElements(
			gl.TRIANGLE_STRIP,
			indexBufferLen,
			gl.UNSIGNED_SHORT, 0
		);
	}
    this.drawLine=function(vertexArray, vertexBuffer)
    {
        gl.useProgram( this.program );

        gl.bindBuffer( gl.ARRAY_BUFFER, vertexBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( vertexArray ), gl.STREAM_DRAW );
        gl.vertexAttribPointer( this.vertex_position, 3, gl.FLOAT, false, 0, 0 );


        gl.enableVertexAttribArray( this.vertex_position );

        gl.drawArrays( gl.LINE_STRIP,0,vertexArray.length/3 );

        gl.disableVertexAttribArray( this.vertex_position );
    }
}

