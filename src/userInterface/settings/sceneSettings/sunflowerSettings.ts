import { SunFlowerSetting } from "@/src/scene/scenes/sunflower/setting";
import { setSceneSettings } from "../settingsManager";

export function sunFlowerSettings(sceneName: string, sunFlowerSettings: SunFlowerSetting, settingsFolder: any, isExternalUi: boolean): void {
    settingsFolder.addColor(sunFlowerSettings, 'innerColor').onChange((value: string) => {
        sunFlowerSettings.innerColor = value;
        setSceneSettings(sunFlowerSettings, sceneName, isExternalUi);
    });

    settingsFolder.addColor(sunFlowerSettings, 'midColor').onChange((value: string) => {
        sunFlowerSettings.midColor = value;
        setSceneSettings(sunFlowerSettings, sceneName, isExternalUi);
    });
    settingsFolder.addColor(sunFlowerSettings, 'outerColor').onChange((value: string) => {
        sunFlowerSettings.outerColor = value;
        setSceneSettings(sunFlowerSettings, sceneName, isExternalUi);
    });
    settingsFolder.add(sunFlowerSettings, 'innerRadiusGain', 0.0, 0.3).onChange((value: number) => {
        sunFlowerSettings.innerRadiusGain = value;
        setSceneSettings(sunFlowerSettings, sceneName, isExternalUi);
    });
    settingsFolder.add(sunFlowerSettings, 'midRadiusGain', 0.3, 0.6).onChange((value: number) => {
        sunFlowerSettings.midRadiusGain = value;
        setSceneSettings(sunFlowerSettings, sceneName, isExternalUi);
    });
    settingsFolder.add(sunFlowerSettings, 'outerRadiusGain', 0.6, 0.9).onChange((value: number) => {
        sunFlowerSettings.outerRadiusGain = value;
        setSceneSettings(sunFlowerSettings, sceneName, isExternalUi);
    });
    settingsFolder.add(sunFlowerSettings, 'radius', 0.05, 0.5).onChange((value: number) => {
        sunFlowerSettings.radius = value;
        setSceneSettings(sunFlowerSettings, sceneName, isExternalUi);
    });
    settingsFolder.add(sunFlowerSettings, 'size', 0.1, 1.5).onChange((value: number) => {
        sunFlowerSettings.size = value;
        setSceneSettings(sunFlowerSettings, sceneName, isExternalUi);
    });
}
