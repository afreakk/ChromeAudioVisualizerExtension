import { ChromaWaveSetting } from "@/src/scene/scenes/chromaWave/setting";
import { setSceneSettings } from "../settingsManager";

export function chromaWaveSettings(
    sceneName: string,
    settings: ChromaWaveSetting,
    settingsFolder: any,
    isExternalUi: boolean
): void {
    // Frequency band speeds
    settingsFolder.add(settings, 'lowSpeed', 0.001, 0.02).name('Bass Speed').onChange((value: number) => {
        settings.lowSpeed = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'midSpeed', 0.001, 0.02).name('Mid Speed').onChange((value: number) => {
        settings.midSpeed = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'highSpeed', 0.001, 0.02).name('Treble Speed').onChange((value: number) => {
        settings.highSpeed = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });

    // Base movement
    settingsFolder.add(settings, 'baseLowSpeed', 0, 0.3).name('Base Bass Speed').onChange((value: number) => {
        settings.baseLowSpeed = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'baseMidSpeed', 0, 0.3).name('Base Mid Speed').onChange((value: number) => {
        settings.baseMidSpeed = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'baseHighSpeed', 0, 0.3).name('Base Treble Speed').onChange((value: number) => {
        settings.baseHighSpeed = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });

    // Visual intensity
    settingsFolder.add(settings, 'intensity', 0.3, 2).name('Intensity').onChange((value: number) => {
        settings.intensity = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'waveFrequency', 1, 10).name('Wave Frequency').onChange((value: number) => {
        settings.waveFrequency = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'colorShift', 0.5, 3).name('Color Shift').onChange((value: number) => {
        settings.colorShift = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });

    // Effect style
    settingsFolder.add(settings, 'patternStyle', { 'Waves': 0, 'Spirals': 1, 'Plasma': 2 }).name('Pattern Style').onChange((value: number) => {
        settings.patternStyle = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'distortionAmount', 0, 1.5).name('Distortion').onChange((value: number) => {
        settings.distortionAmount = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
}
