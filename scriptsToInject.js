AV.scripts = {};
AV.scripts.scenes = [
	"js/scenes/shaders/shaders.js",
	"js/scenes/scenes.js",
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
	"js/scenes/swipeScene.js"
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
	"js/customSceneHandler.js",
	"js/system.js",
	"js/gui.js",
];

AV.scriptsToInject = ["settings/setting.js"]
.concat(AV.scripts.libs)
.concat(AV.scripts.appFramework)
.concat(AV.scripts.scenes)
.concat(["js/init.js"]);
