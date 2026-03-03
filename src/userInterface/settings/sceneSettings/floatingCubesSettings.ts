import type { FloatingCubesSetting } from '@/src/scene/scenes/floatingCubes/setting';
import { setSceneSettings } from '../settingsManager';

export function floatingCubesSettings(
    sceneName: string,
    settings: FloatingCubesSetting,
    settingsFolder: any,
    isExternalUi: boolean,
): void {
    // Cubes
    settingsFolder
        .add(settings, 'cubeCount', 20, 300)
        .step(1)
        .name('Cube Count')
        .onChange((value: number) => {
            settings.cubeCount = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'cubeSize', 10, 60)
        .name('Cube Size')
        .onChange((value: number) => {
            settings.cubeSize = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'borderWidth', 0, 5)
        .name('Border Width')
        .onChange((value: number) => {
            settings.borderWidth = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    // Movement
    settingsFolder
        .add(settings, 'danceSpeed', 0.01, 0.2)
        .name('Dance Speed')
        .onChange((value: number) => {
            settings.danceSpeed = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'directionChangeSpeed', 0.01, 0.2)
        .name('Direction Change')
        .onChange((value: number) => {
            settings.directionChangeSpeed = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    // Colors
    settingsFolder
        .add(settings, 'colorSpeed', 0.01, 0.2)
        .name('Color Speed')
        .onChange((value: number) => {
            settings.colorSpeed = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'colorStrength', 0.3, 1.5)
        .name('Color Strength')
        .onChange((value: number) => {
            settings.colorStrength = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .addColor(settings, 'borderColor')
        .name('Border Color')
        .onChange((value: string) => {
            settings.borderColor = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    // Background
    settingsFolder
        .addColor(settings, 'backgroundColor')
        .name('Background')
        .onChange((value: string) => {
            settings.backgroundColor = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'trailOpacity', 0.5, 1)
        .name('Trail Opacity')
        .onChange((value: number) => {
            settings.trailOpacity = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    // Effects
    settingsFolder
        .add(settings, 'audioSensitivity', 0.5, 3)
        .name('Audio Sensitivity')
        .onChange((value: number) => {
            settings.audioSensitivity = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'glowIntensity', 0, 1)
        .name('Glow Intensity')
        .onChange((value: number) => {
            settings.glowIntensity = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
}
