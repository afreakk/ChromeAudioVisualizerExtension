import type { CircleBurstSetting } from '@/src/scene/scenes/circleBurst/setting';
import { setSceneSettings } from '../settingsManager';

export function circleBurstSettings(
    sceneName: string,
    settings: CircleBurstSetting,
    settingsFolder: any,
    isExternalUi: boolean,
): void {
    // Circle dimensions
    settingsFolder
        .add(settings, 'baseRadius', 0.05, 0.3)
        .name('Base Radius')
        .onChange((value: number) => {
            settings.baseRadius = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'maxRadius', 0.2, 0.8)
        .name('Max Radius')
        .onChange((value: number) => {
            settings.maxRadius = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'numSpokes', 8, 128)
        .step(1)
        .name('Number of Spokes')
        .onChange((value: number) => {
            settings.numSpokes = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    // Animation
    settingsFolder
        .add(settings, 'rotationSpeed', 0, 2)
        .name('Rotation Speed')
        .onChange((value: number) => {
            settings.rotationSpeed = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'colorCycleSpeed', 0, 1)
        .name('Color Cycle Speed')
        .onChange((value: number) => {
            settings.colorCycleSpeed = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'audioSensitivity', 0.5, 3)
        .name('Audio Sensitivity')
        .onChange((value: number) => {
            settings.audioSensitivity = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    // Visual style
    settingsFolder
        .addColor(settings, 'innerColor')
        .name('Inner Color')
        .onChange((value: string) => {
            settings.innerColor = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .addColor(settings, 'outerColor')
        .name('Outer Color')
        .onChange((value: string) => {
            settings.outerColor = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .addColor(settings, 'backgroundColor')
        .name('Background')
        .onChange((value: string) => {
            settings.backgroundColor = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'glowIntensity', 0, 1.5)
        .name('Glow Intensity')
        .onChange((value: number) => {
            settings.glowIntensity = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'spokeWidth', 0.2, 1)
        .name('Spoke Width')
        .onChange((value: number) => {
            settings.spokeWidth = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
}
