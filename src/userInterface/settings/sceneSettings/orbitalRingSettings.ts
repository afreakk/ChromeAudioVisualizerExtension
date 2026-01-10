import { OrbitalRingSetting } from "@/src/scene/scenes/orbitalRing/setting";
import { setSceneSettings } from "../settingsManager";

export function orbitalRingSettings(
    sceneName: string,
    settings: OrbitalRingSetting,
    settingsFolder: any,
    isExternalUi: boolean
): void {
    // Ring configuration
    settingsFolder.add(settings, 'dotCount', 16, 256).step(1).name('Dot Count').onChange((value: number) => {
        settings.dotCount = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'baseRadius', 0.1, 0.5).name('Base Radius').onChange((value: number) => {
        settings.baseRadius = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'audioRadiusMultiplier', 0.1, 0.8).name('Audio Radius Scale').onChange((value: number) => {
        settings.audioRadiusMultiplier = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });

    // Dots
    settingsFolder.add(settings, 'dotSize', 0.005, 0.05).name('Dot Size').onChange((value: number) => {
        settings.dotSize = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'dotSizeAudioScale', 0, 0.05).name('Dot Audio Scale').onChange((value: number) => {
        settings.dotSizeAudioScale = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });

    // Lines
    settingsFolder.add(settings, 'lineWidth', 0.5, 4).name('Line Width').onChange((value: number) => {
        settings.lineWidth = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'showConnections').name('Show Connections').onChange((value: boolean) => {
        settings.showConnections = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });

    // Colors
    settingsFolder.add(settings, 'colorSpeed', 0, 1).name('Color Speed').onChange((value: number) => {
        settings.colorSpeed = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'colorSaturation', 0.3, 1).name('Color Saturation').onChange((value: number) => {
        settings.colorSaturation = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'colorBrightness', 0.3, 1).name('Color Brightness').onChange((value: number) => {
        settings.colorBrightness = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });

    // Animation
    settingsFolder.add(settings, 'rotationSpeed', 0, 1).name('Rotation Speed').onChange((value: number) => {
        settings.rotationSpeed = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'audioSensitivity', 0.5, 3).name('Audio Sensitivity').onChange((value: number) => {
        settings.audioSensitivity = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });

    // Effects
    settingsFolder.add(settings, 'glowIntensity', 0, 1).name('Glow Intensity').onChange((value: number) => {
        settings.glowIntensity = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'trailFade', 0.05, 0.5).name('Trail Fade').onChange((value: number) => {
        settings.trailFade = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
}
