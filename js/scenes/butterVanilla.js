ButterSceneVanillaSettings = function()
{
};
AudioScenes.ButterSceneVanilla = function()
{
    this.name = "MilkDrop Vanilla";
};
AudioScenes.ButterSceneVanilla.prototype.init = function(){
	g.port.postMessage(AV.butterOn);
    initCanvas('buttergl', true);
    this.visualizer = butter.start(function(){
        return Object.values(g.byteFrequency.timeByteArray||g.byteFrequency);
    },function(){
        return Object.values(g.byteFrequency.timeByteArrayL||g.byteFrequency);
    }, function(){
        return Object.values(g.byteFrequency.timeByteArrayR||g.byteFrequency);
    },g.canvas, s.widthInHalf*2, s.heightInHalf*2);
    this.visualizer.setRendererSize(s.widthInHalf*2, s.heightInHalf*2);
};
AudioScenes.ButterSceneVanilla.prototype.cleanUp = function()
{
    delete this.visualizer;
    g.port.postMessage(AV.butterOff);
	initCanvas("2d");
	canvasResize();
},
AudioScenes.ButterSceneVanilla.prototype.parseSettings = function(preset)
{
	parseSettings(this,ButterSceneVanillaSettings, preset);
};
AudioScenes.ButterSceneVanilla.prototype.clearBg = function()
{
};
AudioScenes.ButterSceneVanilla.prototype.resizeCanvas = function()
{
    if (this.visualizer) {
        this.visualizer.setRendererSize(s.widthInHalf*2, s.heightInHalf*2);
    }
};
AudioScenes.ButterSceneVanilla.prototype.update = function()
{
    this.visualizer.render();
};
