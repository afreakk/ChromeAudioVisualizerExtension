import type { DancingCubes3DSinusSetting } from '@/src/scene/scenes/dancingCubes3DSinus/setting';
import { setSceneSettings } from '../settingsManager';

export function dancingCubes3DSinusSettings(
    sceneName: string,
    settings: DancingCubes3DSinusSetting,
    settingsFolder: any,
    isExternalUi: boolean,
): void {
    settingsFolder.add(settings, 'danceSpeed', 0.0, 0.001).onChange((value: number) => {
        settings.danceSpeed = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'directionChangeSpeed', 0.0, 1.0).onChange((value: number) => {
        settings.directionChangeSpeed = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder
        .add(settings, 'cubeCount', 1, 50)
        .step(1)
        .onChange((value: number) => {
            settings.cubeCount = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder.add(settings, 'colorStrength', 0.0, 2.0).onChange((value: number) => {
        settings.colorStrength = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'spaceX', 0.0, 200.0).onChange((value: number) => {
        settings.spaceX = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'spaceY', 0.0, 200.0).onChange((value: number) => {
        settings.spaceY = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'spaceZ', 0.0, 200.0).onChange((value: number) => {
        settings.spaceZ = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'spaceW', 0.0, 200.0).onChange((value: number) => {
        settings.spaceW = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'spaceZOffset', 0.0, 10.0).onChange((value: number) => {
        settings.spaceZOffset = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'colorChangeSpeed', 0.0, 0.1).onChange((value: number) => {
        settings.colorChangeSpeed = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'width', 0.0, 0.001).onChange((value: number) => {
        settings.width = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'height', 0.0, 0.001).onChange((value: number) => {
        settings.height = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'textureSinusIntensity', 0.0, 1.0).onChange((value: number) => {
        settings.textureSinusIntensity = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'bgRed', 0.0, 1.0).onChange((value: number) => {
        settings.bgRed = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'bgGreen', 0.0, 1.0).onChange((value: number) => {
        settings.bgGreen = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'bgBlue', 0.0, 1.0).onChange((value: number) => {
        settings.bgBlue = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'bgAlpha', 0.0, 1.0).onChange((value: number) => {
        settings.bgAlpha = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'cubeAlphaModifier', 0.0, 1.0).onChange((value: number) => {
        settings.cubeAlphaModifier = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
}
