import { setSceneSettings } from "../settingsManager";
import { ParticleCircleSetting } from "@/src/scene/scenes/particleCircle/setting";

export function particleCircleSettings(
    sceneName: string,
    settings: ParticleCircleSetting,
    settingsFolder: any,
    isExternalUi: boolean
): void {
    // Color Settings
    const colorFolder = settingsFolder.addFolder('Color Settings');
    colorFolder.add(settings, 'colorStrength', 0.0, 2.0).name('Color Intensity').onChange((value: number) => {
        settings.colorStrength = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    colorFolder.add(settings, 'colorOffset', 0.0, Math.PI * 2).name('Color Phase Offset').onChange((value: number) => {
        settings.colorOffset = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    colorFolder.add(settings, 'colorWidth', 0.0, 1.0).name('Color Transition Speed').onChange((value: number) => {
        settings.colorWidth = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    colorFolder.add(settings, 'colorBoost', 0.0, 1.0).name('Color Boost').onChange((value: number) => {
        settings.colorBoost = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    colorFolder.add(settings, 'colorAnimationSpeed', 0.0, 0.5).name('Color Animation Speed').onChange((value: number) => {
        settings.colorAnimationSpeed = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });

    // Spectrum Settings
    const spectrumFolder = settingsFolder.addFolder('Spectrum Settings');
    spectrumFolder.add(settings, 'spectrumJumps', 0.0, 10.0).step(1).name('Frequency Jump').onChange((value: number) => {
        settings.spectrumJumps = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    spectrumFolder.add(settings, 'musicColorInfluenceReducer', 1000, 100000).name('Audio Color Influence').onChange((value: number) => {
        settings.musicColorInfluenceReducer = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    spectrumFolder.add(settings, 'musicScale', 0.5, 3.0).name('Audio Position Scale').onChange((value: number) => {
        settings.musicScale = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });

    // Geometry Settings
    const geometryFolder = settingsFolder.addFolder('Geometry Settings');
    geometryFolder.add(settings, 'innerRadiusDivisor', 100, 5000).name('Inner Radius Size').onChange((value: number) => {
        settings.innerRadiusDivisor = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    geometryFolder.add(settings, 'particleWidth', 0.01, 0.5).name('Particle Size').onChange((value: number) => {
        settings.particleWidth = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    geometryFolder.add(settings, 'circleMax', Math.PI, Math.PI * 2).name('Circle Coverage (2π = Full Circle)').onChange((value: number) => {
        settings.circleMax = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    geometryFolder.add(settings, 'sizeMultiplier', 0.0, 2.0).name('Size Multiplier').onChange((value: number) => {
        settings.sizeMultiplier = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });

    // Performance
    const perfFolder = settingsFolder.addFolder('Performance');
    perfFolder.add(settings, 'maxParticles', 64, 512).step(1).name('Max Particles').onChange((value: number) => {
        settings.maxParticles = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });

    // Visual Effects
    const effectsFolder = settingsFolder.addFolder('Visual Effects');
    effectsFolder.add(settings, 'enableRotation').name('Enable Rotation').onChange((value: boolean) => {
        settings.enableRotation = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    effectsFolder.add(settings, 'rotationSpeed', 0.0, 0.1).name('Rotation Speed').onChange((value: number) => {
        settings.rotationSpeed = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    effectsFolder.add(settings, 'enableGlow').name('Enable Glow').onChange((value: boolean) => {
        settings.enableGlow = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    effectsFolder.add(settings, 'glowIntensity', 0, 50).name('Glow Intensity').onChange((value: number) => {
        settings.glowIntensity = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    effectsFolder.add(settings, 'glowThreshold', 0, 20).name('Glow Threshold').onChange((value: number) => {
        settings.glowThreshold = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    effectsFolder.add(settings, 'enableStroke').name('Enable Stroke').onChange((value: boolean) => {
        settings.enableStroke = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    effectsFolder.add(settings, 'strokeWidth', 0.5, 5).name('Stroke Width').onChange((value: number) => {
        settings.strokeWidth = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    effectsFolder.add(settings, 'enableTrails').name('Enable Motion Trails').onChange((value: boolean) => {
        settings.enableTrails = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    effectsFolder.add(settings, 'trailOpacity', 0.0, 0.5).name('Trail Opacity').onChange((value: number) => {
        settings.trailOpacity = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    effectsFolder.add(settings, 'showCenterCircle').name('Show Center Circle').onChange((value: boolean) => {
        settings.showCenterCircle = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    effectsFolder.add(settings, 'centerCircleOpacity', 0.0, 1.0).name('Center Circle Opacity').onChange((value: number) => {
        settings.centerCircleOpacity = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
}

