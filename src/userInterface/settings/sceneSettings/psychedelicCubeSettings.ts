import type { PsychedelicCubeSetting } from '@/src/scene/scenes/psychedelicCube/setting';
import { setSceneSettings } from '../settingsManager';

export function psychedelicCubeSettings(
    sceneName: string,
    settings: PsychedelicCubeSetting,
    settingsFolder: any,
    isExternalUi: boolean,
): void {
    settingsFolder
        .add(settings, 'volumeMultiplier', 0.0, 0.05)
        .name('Color Cycle Speed')
        .onChange((value: number) => {
            settings.volumeMultiplier = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'spinSpeed', 0.0, 0.02)
        .name('Rotation Speed')
        .onChange((value: number) => {
            settings.spinSpeed = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'cubeVolumeScale', 0.0, 0.02)
        .name('Size Pulse (Bass)')
        .onChange((value: number) => {
            settings.cubeVolumeScale = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'pulseIntensity', 0.0, 0.5)
        .name('Brightness Pulse')
        .onChange((value: number) => {
            settings.pulseIntensity = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'redSpeed', 0.0, 0.05)
        .name('Red Shift (Low Freq)')
        .onChange((value: number) => {
            settings.redSpeed = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'greenSpeed', 0.0, 0.05)
        .name('Green Shift (Mid Freq)')
        .onChange((value: number) => {
            settings.greenSpeed = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'blueSpeed', 0.0, 0.05)
        .name('Blue Shift (High Freq)')
        .onChange((value: number) => {
            settings.blueSpeed = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'colorSeparation', 0.0, 2.0)
        .name('RGB Phase Offset')
        .onChange((value: number) => {
            settings.colorSeparation = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'bgRed', 0.0, 1.0)
        .name('Background Red')
        .onChange((value: number) => {
            settings.bgRed = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'bgGreen', 0.0, 1.0)
        .name('Background Green')
        .onChange((value: number) => {
            settings.bgGreen = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'bgBlue', 0.0, 1.0)
        .name('Background Blue')
        .onChange((value: number) => {
            settings.bgBlue = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'bgAlpha', 0.0, 1.0)
        .name('Background Opacity')
        .onChange((value: number) => {
            settings.bgAlpha = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
}
