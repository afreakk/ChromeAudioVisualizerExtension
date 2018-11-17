AV.scripts = {};
//commented out webgl scenes,
//seems to be a bug in chrome extension/content script regarding webgl
AV.scripts.scenes = [
		'js/scenes/butter/bundle.js',
	"js/scenes/shaders/shaders.js",
	"js/scenes/sceneHelpers.js",
	"js/scenes/colorMixScene.js",
	"js/scenes/particleCircle.js",
	"js/scenes/dotsAndLines.js",
	"js/scenes/worldScene.js",
	"js/scenes/circleScene.js",
	"js/scenes/wormScene.js",
	"js/scenes/wartScene.js",
	"js/scenes/genericScene.js",
	"js/scenes/roundSpectrum.js",
	"js/scenes/hexagonScene.js",
	"js/scenes/seventiesScene.js",
		'js/scenes/butter.js',
		'js/scenes/butterVanilla.js',
	"js/scenes/madnessScene.js",
	"js/scenes/paintingScene.js",
	"js/scenes/dancingCubes.js",
	"js/scenes/somewebglscene.js",
	"js/scenes/xxx.js",
        //'js/scenes/WebGLFunWrapper/ExtLibs/gl-matrix-min.js',
        'js/scenes/WebGLFunWrapper/ExtLibs/perlinsimplexnoise.js',
        'js/scenes/WebGLFunWrapper/3DObjects/shape.js',
        'js/scenes/WebGLFunWrapper/3DObjects/terrain.js',
        'js/scenes/WebGLFunWrapper/ShaderObjects/terrainshader.js',
        'js/scenes/WebGLFunWrapper/ShaderObjects/generalshader.js',
        'js/scenes/WebGLFunWrapper/Core/shader.js',
        'js/scenes/WebGLFunWrapper/Core/keyhandler.js',
        'js/scenes/WebGLFunWrapper/Core/managers.js',
        'js/scenes/WebGLFunWrapper/Scenes/terrainscene.js',
        'js/scenes/WebGLFunWrapper/main.js',
        'js/scenes/terrainScene.js'
];

AV.scripts.libs = [
	"lib/dat.gui.js",
	"lib/stats.min.js",
	"lib/gl-matrix.js"
//	"lib/bootstrap.css",
//	"lib/bootstrap-theme.css",
];

AV.scripts.appFramework = [
	"js/tools.js",
	"js/webglHelpers.js",
	"js/storageLayer.js",
	"js/sceneManager.js",
	"js/sceneSelector.js",
	"js/customSceneHandler.js",
	"js/system.js",
	"js/gui.js",
];

AV.scriptsToInject = ["settings/setting.js"]
.concat(AV.scripts.libs)
.concat(AV.scripts.appFramework)
.concat(AV.scripts.scenes)
.concat(["js/init.js"]);

AV.stylesToInject = ["css/main.css"];