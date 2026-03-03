import type { PaintSplashSetting } from '@/src/scene/scenes/paintSplash/setting';
import { setSceneSettings } from '../settingsManager';

export function paintSplashSettings(
    sceneName: string,
    settings: PaintSplashSetting,
    settingsFolder: any,
    isExternalUi: boolean,
): void {
    // Splash configuration
    settingsFolder
        .add(settings, 'numSplashes', 6, 64)
        .step(1)
        .name('Number of Splashes')
        .onChange((value: number) => {
            settings.numSplashes = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'baseSize', 0.005, 0.1)
        .name('Base Size')
        .onChange((value: number) => {
            settings.baseSize = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'maxSize', 0.05, 0.3)
        .name('Max Size')
        .onChange((value: number) => {
            settings.maxSize = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    // Movement
    settingsFolder
        .add(settings, 'spreadRadius', 0.1, 0.8)
        .name('Spread Radius')
        .onChange((value: number) => {
            settings.spreadRadius = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'rotationSpeed', 0, 2)
        .name('Rotation Speed')
        .onChange((value: number) => {
            settings.rotationSpeed = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    // Colors
    settingsFolder
        .add(settings, 'colorSpeed', 0, 2)
        .name('Color Cycle Speed')
        .onChange((value: number) => {
            settings.colorSpeed = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'colorSaturation', 0.3, 1)
        .name('Color Saturation')
        .onChange((value: number) => {
            settings.colorSaturation = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'colorBrightness', 0.3, 1)
        .name('Color Brightness')
        .onChange((value: number) => {
            settings.colorBrightness = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    // Effects
    settingsFolder
        .add(settings, 'fadeAmount', 0.01, 0.2)
        .name('Trail Fade')
        .onChange((value: number) => {
            settings.fadeAmount = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'glowIntensity', 0, 1)
        .name('Glow Intensity')
        .onChange((value: number) => {
            settings.glowIntensity = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'audioSensitivity', 0.5, 3)
        .name('Audio Sensitivity')
        .onChange((value: number) => {
            settings.audioSensitivity = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'trailPersistence')
        .name('Trail Persistence')
        .onChange((value: boolean) => {
            settings.trailPersistence = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
}
