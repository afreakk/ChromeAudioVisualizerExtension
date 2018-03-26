function Line()
{
    var vertices = [];
    var lengthPerLine = 0.001;
    var anglePerLine = Math.PI/8.0;
    var width = 10.5;
    var height = 1.0;
    var widthCount = 20;
    var heightCount = 20;
    var simplexNoise = new SimplexNoise();
    var smoothing = 10.0;
    var displacer = 1.0;
    var heightInc = 0.285;
    this.getVerticesCount = function() 
    {
        return vertices.length;
    }
    this.getVertices = function(time) 
    {
        var theta = 0.0;
        var zPos = -900.0;
        var i = 0;
        for(var x=0; x<widthCount; x++)
        {
            for(var y=0; y<heightCount; y++)
            {
                var tt = theta+time*10.0;
                vertices[i++]=(Math.sin(tt)/2.0+0.5)*10+Math.cos(tt)*10+Math.sin(tt)*20;
                vertices[i++]=(Math.cos(tt)/2.0+0.5)*10+Math.sin(tt)*10+Math.cos(tt)*20-i*heightInc;
                vertices[i++]=(zPos);
                zPos    += lengthPerLine;
                theta   += anglePerLine;
            }
        }
        return vertices;
    }
}


function CubeVertexData(){
	var vertices = [];
	var indices = [
		0, 1, 2,      0, 2, 3,    // Front face
		4, 5, 6,      4, 6, 7,    // Back face
		8, 9, 10,     8, 10, 11,  // Top face
		12, 13, 14,   12, 14, 15, // Bottom face
		16, 17, 18,   16, 18, 19, // Right face
		20, 21, 22,   20, 22, 23  // Left face
	];
	this.getIndicesCount=function(){
		return indices.length;
	}
	this.getIndices=function(){
		return new Uint16Array(indices);
	}
	this.getVertices=function(){
		return new Float32Array([
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
		]);
	}
}


function TriangleStripGrid(w, h, tileSize, zOffset)
{
    var width= w||325;
    var height= h||200;
    var tSize = tileSize||0.5;
    var zOffset = zOffset||-30.0;
    var simplexNoise = new SimplexNoise();
    var xOffset = ((width-1)/2)*tSize;

    var verticesCount   = width*height*3;
    var indicesCount    = (width*height) + (width-1)*(height-2);
    this.getVerticesCount = function() 
    {
        return verticesCount;
    }

    this.getIndicesCount = function() 
    {
        return indicesCount;
    }
    var xMove = 0;
    var zMove = 0;
    this.setX=function(x)
    {
        xMove = x;
    }

    this.setZ=function(z)
    {
        zMove = z
    }

    this.getVerticesXZ = function() 
    {
        vertices = [];
        var i = 0;
        for (var row=0; row<height; row++ ) 
        {
            for (var col=0; col<width; col++ ) 
            {
                var x = col*tSize-xOffset;
                var z = -row*tSize;
                vertices[i++] = x;
                vertices[i++] = z+zOffset;
            }
        }

        return vertices;
    }
    this.getVerticesY = function(smoothing) 
    {
        vertices = [];
        var i = 0;
        for (var row=0; row<height; row++ ) 
        {
            for (var col=0; col<width; col++ ) 
            {
                var x = col*tSize-xOffset;
                var z = -row*tSize;
                vertices[i++] = simplexNoise.noise(x/smoothing-xMove,z/smoothing-zMove);
            }
        }
        return vertices;
    }

    this.getIndices = function() 
    {

        indices = [];
        var i = 0;

        for ( var row=0; row<height-1; row++ ) 
        {
            if ( (row&1)==0 )  // even rows
            {
                for ( var col=0; col<width; col++ ) 
                {
                    indices[i++] = col + row * width;
                    indices[i++] = col + (row+1) * width;
                }
            } 
            else // odd rows
            { 
                for ( var col=width-1; col>0; col-- ) 
                {
                    indices[i++] = col + (row+1) * width;
                    indices[i++] = col - 1 + + row * width;
                }
            }
        }

        return indices;
    }
}
