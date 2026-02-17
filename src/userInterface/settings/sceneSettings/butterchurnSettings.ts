import { ButterchurnSetting } from '@/src/scene/scenes/butterchurn/setting';
import { setSceneSettings } from '../settingsManager';
import butterchurnPresets from 'butterchurn-presets';

export function buildButterchurnSetting(
    sceneName: string,
    butterchurnSettings: ButterchurnSetting,
    settingsFolder: any,
    isExternalUi: boolean
): void {
    settingsFolder
        .add(
            butterchurnSettings,
            'preset',
            Object.keys(butterchurnPresets.getPresets())
        )
        .onChange((value: string) => {
            butterchurnSettings.preset = value;
            setSceneSettings(butterchurnSettings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(butterchurnSettings, 'blendLength')
        .onChange((value: number) => {
            butterchurnSettings.blendLength = value;
            setSceneSettings(butterchurnSettings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(butterchurnSettings, 'cycleSeconds')
        .onChange((value: number) => {
            butterchurnSettings.cycleSeconds = value;
            setSceneSettings(butterchurnSettings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(butterchurnSettings, 'cyclePresets')
        .onChange((value: boolean) => {
            butterchurnSettings.cyclePresets = value;
            setSceneSettings(butterchurnSettings, sceneName, isExternalUi);
        });
}
