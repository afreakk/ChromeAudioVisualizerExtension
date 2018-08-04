function TryTerrainScene()
{
    var terrain = null;
    //var player    = null;
    this.init = function(settings)
    {
        terrain = new Terrain();
        terrain.init(settings);

   //     player = new Player();
    }
    this.update = function(settings)
    {
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
		var sum = 0, i = 0;
		while(g.byteFrequency[i] !== undefined){
			sum += g.byteFrequency[i++];
		}
        terrainShader.setTime(sum*settings.moveSpeed);
        //generalShader.setTime(time);
        terrain.draw(settings, sum);
 //       player.draw();
    }
}
