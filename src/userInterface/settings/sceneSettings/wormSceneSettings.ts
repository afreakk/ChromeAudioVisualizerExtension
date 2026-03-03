import type { WormSceneSetting } from '@/src/scene/scenes/wormScene/setting';
import { setSceneSettings } from '../settingsManager';

export function wormSceneSettings(
    sceneName: string,
    settings: WormSceneSetting,
    settingsFolder: any,
    isExternalUi: boolean,
): void {
    settingsFolder.add(settings, 'moveLength', 0.0, 0.1).onChange((value: number) => {
        settings.moveLength = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder
        .add(settings, 'numBars', 1, 200)
        .step(1)
        .onChange((value: number) => {
            settings.numBars = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder.add(settings, 'circleSize', 0.0, 1.0).onChange((value: number) => {
        settings.circleSize = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'rotationSpeed', 0.0, 500.0).onChange((value: number) => {
        settings.rotationSpeed = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'colorSpeed', 0.0, 500.0).onChange((value: number) => {
        settings.colorSpeed = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'colorStrength', 0.0, 2.0).onChange((value: number) => {
        settings.colorStrength = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'colorWidth', 0.0, 10.0).onChange((value: number) => {
        settings.colorWidth = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'colorOffset', 0.0, Math.PI * 2).onChange((value: number) => {
        settings.colorOffset = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'spectrumJumps', 0.0, 50.0).onChange((value: number) => {
        settings.spectrumJumps = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'innSnevring', 0.0, 0.01).onChange((value: number) => {
        settings.innSnevring = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
}
