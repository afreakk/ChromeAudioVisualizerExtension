import { setSceneSettings } from "../settingsManager";
import { SynthBarsSetting } from "@/src/scene/scenes/synthBars/setting";

export function synthBarSettings(sceneName: string, synthbarSettings: SynthBarsSetting, settingsFolder: any, isExternalUi: boolean): void {
    settingsFolder.addColor(synthbarSettings, 'bottomColor').onChange((value: string) => {
        synthbarSettings.bottomColor = value;
        setSceneSettings(synthbarSettings, sceneName, isExternalUi);
    });
    settingsFolder.addColor(synthbarSettings, 'topColor').onChange((value: string) => {
        synthbarSettings.topColor = value;
        setSceneSettings(synthbarSettings, sceneName, isExternalUi);
    });

    settingsFolder.add(synthbarSettings, 'noiseGain', 0.0, 1.0).onChange((value: number) => {
        synthbarSettings.noiseGain = value;
        setSceneSettings(synthbarSettings, sceneName, isExternalUi);
    });
    settingsFolder.add(synthbarSettings, 'numberOfbars', 5.0, 80.0).onChange((value: number) => {
        synthbarSettings.numberOfbars = value;
        setSceneSettings(synthbarSettings, sceneName, isExternalUi);
    });
}
