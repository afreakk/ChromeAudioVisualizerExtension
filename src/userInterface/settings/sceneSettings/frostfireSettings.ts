import { setSceneSettings } from "../settingsManager";
import { FrostFireSetting } from "@/src/scene/scenes/frostfire/settings";

export function frostFireSettings(sceneName: string, frostFireSettings: FrostFireSetting, settingsFolder: any, isExternalUi: boolean): void {

    settingsFolder.addColor(frostFireSettings, 'frostColor').onChange((value: string) => {
        frostFireSettings.frostColor = value;
        setSceneSettings(frostFireSettings, sceneName, isExternalUi);
    });
    settingsFolder.addColor(frostFireSettings, 'fireColor').onChange((value: string) => {
        frostFireSettings.fireColor = value;
        setSceneSettings(frostFireSettings, sceneName, isExternalUi);
    });
    settingsFolder.addColor(frostFireSettings, 'blendColor').onChange((value: string) => {
        frostFireSettings.blendColor = value;
        setSceneSettings(frostFireSettings, sceneName, isExternalUi);
    });
    settingsFolder.add(frostFireSettings, 'numberOfHexagons', 10, 100.0).onChange((value: number) => {
        frostFireSettings.numberOfHexagons = value;
        setSceneSettings(frostFireSettings, sceneName, isExternalUi);
    });
    settingsFolder.add(frostFireSettings, 'height', 0.2, 1.0).onChange((value: number) => {
        frostFireSettings.height = value;
        setSceneSettings(frostFireSettings, sceneName, isExternalUi);
    });
    settingsFolder.add(frostFireSettings, 'colorBlend', 0.1, 1.0).onChange((value: number) => {
        frostFireSettings.colorBlend = value;
        setSceneSettings(frostFireSettings, sceneName, isExternalUi);
    });
    settingsFolder.add(frostFireSettings, 'dynamicColor', 0.3, 1.0).onChange((value: number) => {
        frostFireSettings.dynamicColor = value;
        setSceneSettings(frostFireSettings, sceneName, isExternalUi);
    });
    settingsFolder.add(frostFireSettings, 'breathing', 0.0, 0.45).onChange((value: number) => {
        frostFireSettings.breathing = value;
        setSceneSettings(frostFireSettings, sceneName, isExternalUi);
    });
}
