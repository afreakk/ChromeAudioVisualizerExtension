import presets from 'butterchurn-presets';
import type { ButterchurnSetting } from '@/src/scene/scenes/butterchurn/setting';
import { setSceneSettings } from '../settingsManager';

export function buildButterchurnSetting(
    sceneName: string,
    butterchurnSettings: ButterchurnSetting,
    settingsFolder: any,
    isExternalUi: boolean,
    onCleanup?: (cb: () => void) => void,
): void {
    settingsFolder
        .add(butterchurnSettings, 'preset', Object.keys(presets))
        .onChange((value: string) => {
            butterchurnSettings.preset = value;
            setSceneSettings(butterchurnSettings, sceneName, isExternalUi);
        })
        .listen();

    // Update dropdown when preset cycles automatically
    const presetCycleListener = (event: Event) => {
        butterchurnSettings.preset = (event as CustomEvent<string>).detail;
    };
    window.addEventListener('butterchurn-preset-cycled', presetCycleListener);
    onCleanup?.(() => window.removeEventListener('butterchurn-preset-cycled', presetCycleListener));
    settingsFolder.add(butterchurnSettings, 'blendLength').onChange((value: number) => {
        butterchurnSettings.blendLength = value;
        setSceneSettings(butterchurnSettings, sceneName, isExternalUi);
    });
    settingsFolder.add(butterchurnSettings, 'cycleSeconds').onChange((value: number) => {
        butterchurnSettings.cycleSeconds = value;
        setSceneSettings(butterchurnSettings, sceneName, isExternalUi);
    });
    settingsFolder.add(butterchurnSettings, 'cyclePresets').onChange((value: boolean) => {
        butterchurnSettings.cyclePresets = value;
        setSceneSettings(butterchurnSettings, sceneName, isExternalUi);
    });
}
