
function Terrain()
{
    var yBuffer     = gl.createBuffer();
    var baseBuffer  = gl.createBuffer();
    var indexBuffer = gl.createBuffer();
    var xMove = 0;
    var zMove = 0;
	var stripGrid = null;
    this.init=function(settings)
    {
		yBuffer     = gl.createBuffer();
		baseBuffer  = gl.createBuffer();
		indexBuffer = gl.createBuffer();

		stripGrid   = new TriangleStripGrid(settings.width, settings.height, settings.tileSize, settings.zOffset);
        gl.bindBuffer( gl.ARRAY_BUFFER, baseBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( stripGrid.getVerticesXZ() ),
			gl.DYNAMIC_DRAW );

        gl.bindBuffer( gl.ARRAY_BUFFER, yBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( stripGrid.getVerticesY(100) ),
			gl.DYNAMIC_DRAW );

        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array( stripGrid.getIndices() ),
			gl.DYNAMIC_DRAW );

    }
    this.draw = function(settings, sumSpectrum)
    {
		if(	settings.redOffset !== this.oldR ||
			settings.blueOffset !== this.oldB ||
			settings.greenOffset !== this.oldG ||
			settings.alphaOffset !== this.oldA 
		)
		{
			terrainShader.setColorOffset(
				settings.redOffset,
				settings.blueOffset,
				settings.greenOffset,
				settings.alphaOffset
			);
			this.oldR = settings.redOffset, this.oldB = settings.blueOffset;
			this.oldG = settings.greenOffset, this.oldA = settings.alphaOffset;
		}
		if(!this.oldWith){
			this.oldWith = settings.width, this.oldHeight = settings.height,
			this.oldTileSize = settings.tileSize, this.oldZOffset = settings.zOffset;
		}
		if(	settings.width !== this.oldWith ||
			settings.height !== this.oldHeight ||
			settings.tileSize !== this.oldTileSize ||
			settings.zOffset !== this.oldZOffset )
		{
			this.init(settings);
			this.oldWith = settings.width, this.oldHeight = settings.height,
			this.oldTileSize = settings.tileSize, this.oldZOffset = settings.zOffset;
		}
		var speed = (settings.moveSpeed * sumSpectrum)/ 1000;
		oldXmove = xMove, oldZMove = zMove;
        if(key.Left)
            xMove += dt/1000;
        if(key.Right)
            xMove -= dt/1000;
        if(key.Up)
            zMove += dt/1000;
        if(key.Down)
            zMove -= dt/1000;
		if(oldXmove === zMove && oldZMove === zMove){
			zMove += speed, xMove += speed;
		}
		if(isNaN(xMove)){
			xMove = 0
		}
		if(isNaN(zMove)){
			zMove = 0
		}
        stripGrid.setX(xMove);
        stripGrid.setZ(zMove);
        terrainShader.drawGrid( baseBuffer, yBuffer, indexBuffer, stripGrid,
			stripGrid.getVerticesY(settings.smoothing*sumSpectrum));
    }
}

function CubeModel(){
	var cube = new CubeVertexData();
    var vertexBuffer    = gl.createBuffer();
    var indexBuffer = gl.createBuffer();
	this.init=function(){
        gl.bindBuffer( gl.ARRAY_BUFFER, vertexBuffer );
        gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array( cube.getVertices() ),
			gl.STREAM_DRAW
		);
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(
			gl.ELEMENT_ARRAY_BUFFER,
			new Uint16Array( cube.getIndices() ),
			gl.DYNAMIC_DRAW
		);
	};
    this.draw = function()
    {
        generalShader.drawElements(
			indexBuffer,
			cube.getIndicesCount(),
			vertexBuffer
		);
    };
}

function Player()
{
    var line            = new Line();
    var vertexBuffer    = gl.createBuffer();
    this.init=function()
    {
        gl.bindBuffer( gl.ARRAY_BUFFER, vertexBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( line.getVertices() ), gl.STREAM_DRAW );

    }
    this.draw = function()
    {
        generalShader.drawLine( line.getVertices(time/1000.0), vertexBuffer );
    }
}
