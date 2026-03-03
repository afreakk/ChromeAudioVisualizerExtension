import type { HexagonPulseSetting } from '@/src/scene/scenes/hexagonPulse/setting';
import { setSceneSettings } from '../settingsManager';

export function hexagonPulseSettings(
    sceneName: string,
    settings: HexagonPulseSetting,
    settingsFolder: any,
    isExternalUi: boolean,
): void {
    // Hexagon grid
    settingsFolder
        .add(settings, 'tileSize', 20, 80)
        .step(1)
        .name('Tile Size')
        .onChange((value: number) => {
            settings.tileSize = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'numLayers', 3, 10)
        .step(1)
        .name('Number of Layers')
        .onChange((value: number) => {
            settings.numLayers = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'rotationSpeed', 0, 0.02)
        .name('Rotation Speed')
        .onChange((value: number) => {
            settings.rotationSpeed = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    // Colors
    settingsFolder
        .add(settings, 'baseHue', 0, 360)
        .name('Base Hue')
        .onChange((value: number) => {
            settings.baseHue = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'hueRange', 0, 180)
        .name('Hue Range')
        .onChange((value: number) => {
            settings.hueRange = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'saturation', 0.3, 1)
        .name('Saturation')
        .onChange((value: number) => {
            settings.saturation = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'brightness', 0.3, 1)
        .name('Brightness')
        .onChange((value: number) => {
            settings.brightness = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    // Effects
    settingsFolder
        .add(settings, 'pulseIntensity', 0.5, 3)
        .name('Pulse Intensity')
        .onChange((value: number) => {
            settings.pulseIntensity = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'distortionAmount', 0, 2)
        .name('Distortion')
        .onChange((value: number) => {
            settings.distortionAmount = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'decayRate', 0.5, 5)
        .name('Decay Rate')
        .onChange((value: number) => {
            settings.decayRate = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'highlightIntensity', 0, 1)
        .name('Highlight Intensity')
        .onChange((value: number) => {
            settings.highlightIntensity = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    // Starfield
    settingsFolder
        .add(settings, 'showStars')
        .name('Show Stars')
        .onChange((value: boolean) => {
            settings.showStars = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'starCount', 20, 200)
        .step(1)
        .name('Star Count')
        .onChange((value: number) => {
            settings.starCount = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'starSpeed', 0.2, 3)
        .name('Star Speed')
        .onChange((value: number) => {
            settings.starSpeed = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    // Background
    settingsFolder
        .add(settings, 'backgroundR', 0, 0.2)
        .name('Background Red')
        .onChange((value: number) => {
            settings.backgroundR = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'backgroundG', 0, 0.2)
        .name('Background Green')
        .onChange((value: number) => {
            settings.backgroundG = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'backgroundB', 0, 0.2)
        .name('Background Blue')
        .onChange((value: number) => {
            settings.backgroundB = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
}
