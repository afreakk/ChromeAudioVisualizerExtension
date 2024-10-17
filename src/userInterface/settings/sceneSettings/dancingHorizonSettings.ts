import { DancingHorizonSetting } from "@/src/scene/scenes/dancingHorizon/setting";
import { setSceneSettings } from "../settingsManager";
import { SynthBarsSetting } from "@/src/scene/scenes/synthBars/setting";

export function dancingHorizonSettings(sceneName: string, dancingHorizonSettings: DancingHorizonSetting, settingsFolder: any, isExternalUi: boolean): void {

    settingsFolder.addColor(dancingHorizonSettings, 'horizonColorNight').onChange((value: string) => {
        dancingHorizonSettings.horizonColorNight = value;
        setSceneSettings(dancingHorizonSettings, sceneName, isExternalUi);
    });
    settingsFolder.addColor(dancingHorizonSettings, 'horizonColorDay').onChange((value: string) => {
        dancingHorizonSettings.horizonColorDay = value;
        setSceneSettings(dancingHorizonSettings, sceneName, isExternalUi);
    });
    settingsFolder.addColor(dancingHorizonSettings, 'skyColorNight').onChange((value: string) => {
        dancingHorizonSettings.skyColorNight = value;
        setSceneSettings(dancingHorizonSettings, sceneName, isExternalUi);
    });
    settingsFolder.addColor(dancingHorizonSettings, 'skyColorDay').onChange((value: string) => {
        dancingHorizonSettings.skyColorDay = value;
        setSceneSettings(dancingHorizonSettings, sceneName, isExternalUi);
    });
    settingsFolder.addColor(dancingHorizonSettings, 'oceanColorNight').onChange((value: string) => {
        dancingHorizonSettings.oceanColorNight = value;
        setSceneSettings(dancingHorizonSettings, sceneName, isExternalUi);
    });
    settingsFolder.addColor(dancingHorizonSettings, 'oceanColorDay').onChange((value: string) => {
        dancingHorizonSettings.oceanColorDay = value;
        setSceneSettings(dancingHorizonSettings, sceneName, isExternalUi);
    });
    settingsFolder.addColor(dancingHorizonSettings, 'moonColor').onChange((value: string) => {
        dancingHorizonSettings.moonColor = value;
        setSceneSettings(dancingHorizonSettings, sceneName, isExternalUi);
    });
    settingsFolder.addColor(dancingHorizonSettings, 'sunColor').onChange((value: string) => {
        dancingHorizonSettings.sunColor = value;
        setSceneSettings(dancingHorizonSettings, sceneName, isExternalUi);
    });
    settingsFolder.add(dancingHorizonSettings, 'timeGain', 0.1, 1.0).onChange((value: number) => {
        dancingHorizonSettings.timeGain = value;
        setSceneSettings(dancingHorizonSettings, sceneName, isExternalUi);
    });
    settingsFolder.add(dancingHorizonSettings, 'noiseGain', 0.0, 1.0).onChange((value: number) => {
        dancingHorizonSettings.noiseGain = value;
        setSceneSettings(dancingHorizonSettings, sceneName, isExternalUi);
    });
    settingsFolder.add(dancingHorizonSettings, 'cloudDensity', 0.0, 10.0).onChange((value: number) => {
        dancingHorizonSettings.cloudDensity = value;
        setSceneSettings(dancingHorizonSettings, sceneName, isExternalUi);
    });
    settingsFolder.add(dancingHorizonSettings, 'cloudGain', 0.0, 1.0).onChange((value: number) => {
        dancingHorizonSettings.cloudGain = value;
        setSceneSettings(dancingHorizonSettings, sceneName, isExternalUi);
    });
}
