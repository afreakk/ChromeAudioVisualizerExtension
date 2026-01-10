import { setSceneSettings } from "../settingsManager";
import { SeventiesSceneSetting } from "@/src/scene/scenes/seventiesScene/setting";

export function seventiesSceneSettings(
    sceneName: string,
    settings: SeventiesSceneSetting,
    settingsFolder: any,
    isExternalUi: boolean
): void {
    // Circle Spawning
    const spawnFolder = settingsFolder.addFolder('Circle Spawning');
    spawnFolder.add(settings, 'spawnThreshold', 0, 2000000).name('Spawn Threshold').onChange((value: number) => {
        settings.spawnThreshold = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    spawnFolder.add(settings, 'crowdSuppression', 0.0, 0.01).name('Crowd Suppression').onChange((value: number) => {
        settings.crowdSuppression = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    spawnFolder.add(settings, 'circleResolution', 1, 50).step(1).name('Circles Per Spawn').onChange((value: number) => {
        settings.circleResolution = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    spawnFolder.add(settings, 'targetSize', 10, 200).name('Target Size').onChange((value: number) => {
        settings.targetSize = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });

    // Movement & Animation
    const movementFolder = settingsFolder.addFolder('Movement & Animation');
    movementFolder.add(settings, 'fadeSpeed', 0.0, 2.0).name('Fade Speed').onChange((value: number) => {
        settings.fadeSpeed = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    movementFolder.add(settings, 'speedMusicScale', 1, 50).name('Speed Multiplier').onChange((value: number) => {
        settings.speedMusicScale = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    movementFolder.add(settings, 'speedReducer', 100, 20000).name('Speed Reducer').onChange((value: number) => {
        settings.speedReducer = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    movementFolder.add(settings, 'expansionSpeed', 0.0, 3.0).name('Expansion Speed').onChange((value: number) => {
        settings.expansionSpeed = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    movementFolder.add(settings, 'hueRotationSpeed', 0.0, 5.0).name('Color Rotation Speed').onChange((value: number) => {
        settings.hueRotationSpeed = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    movementFolder.add(settings, 'volumeSensitivity', 0.5, 5.0).name('Volume Sensitivity').onChange((value: number) => {
        settings.volumeSensitivity = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });

    // Visual Appearance
    const appearanceFolder = settingsFolder.addFolder('Visual Appearance');
    appearanceFolder.add(settings, 'lineWidth', 1, 20).name('Line Width').onChange((value: number) => {
        settings.lineWidth = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    appearanceFolder.add(settings, 'saturation', 0, 100).name('Color Saturation').onChange((value: number) => {
        settings.saturation = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    appearanceFolder.add(settings, 'lightness', 0, 100).name('Color Lightness').onChange((value: number) => {
        settings.lightness = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    appearanceFolder.add(settings, 'enableFill').name('Enable Fill').onChange((value: boolean) => {
        settings.enableFill = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    appearanceFolder.add(settings, 'fillOpacity', 0.0, 1.0).name('Fill Opacity').onChange((value: number) => {
        settings.fillOpacity = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });

    // Circle Creation
    const creationFolder = settingsFolder.addFolder('Circle Creation');
    creationFolder.add(settings, 'initialRadiusStep', 0.5, 10).name('Initial Radius Step').onChange((value: number) => {
        settings.initialRadiusStep = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    creationFolder.add(settings, 'targetSizeVariation', 0, 50).name('Target Size Variation').onChange((value: number) => {
        settings.targetSizeVariation = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    creationFolder.add(settings, 'hueStep', 0, 50).name('Hue Step Between Circles').onChange((value: number) => {
        settings.hueStep = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    creationFolder.add(settings, 'hueVariation', 0, 100).name('Hue Variation').onChange((value: number) => {
        settings.hueVariation = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    creationFolder.add(settings, 'spreadAmount', 0, 100).name('Position Spread').onChange((value: number) => {
        settings.spreadAmount = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    creationFolder.add(settings, 'opacitySteps', 5, 50).step(1).name('Opacity Steps').onChange((value: number) => {
        settings.opacitySteps = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });

    // Effects
    const effectsFolder = settingsFolder.addFolder('Effects');
    effectsFolder.add(settings, 'enableTrails').name('Enable Motion Trails').onChange((value: boolean) => {
        settings.enableTrails = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    effectsFolder.add(settings, 'trailOpacity', 0.0, 0.5).name('Trail Opacity').onChange((value: number) => {
        settings.trailOpacity = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
}

