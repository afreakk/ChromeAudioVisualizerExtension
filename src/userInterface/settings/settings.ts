import * as dat from 'dat.gui';
import { messageAction, messageTarget } from '@/src/utils/eventMessage';
import { SunFlower } from '@/src/scene/scenes/sunflower/sunflower';
import { SynthBars } from '@/src/scene/scenes/synthBars/synthBars';
import { DancingHorizon } from '@/src/scene/scenes/dancingHorizon/dancingHorizon';
import { DancingHorizonSetting } from "@/src/scene/scenes/dancingHorizon/setting";
import { SynthBarsSetting } from "@/src/scene/scenes/synthBars/setting";
import { SunFlowerSetting } from "@/src/scene/scenes/sunflower/setting";
import { IScene } from '@/src/scene/scene';
import { ISceneSetting } from '@/src/scene/sceneSetting';
import { loadSettings, saveSettings } from '@/src/utils/settings';
import { SetSceneEvent } from '@/src/scene/events/setSceneEvent';
import { SetSceneSettingsEvent } from '@/src/scene/events/setSceneSettingsEvent';



export class SettingsUi {
    private gui: dat.GUI;
    private isExternalUI: boolean = false;
    private sceneMap: Map<string, IScene>;
    private sceneFolder: any = null;
    private settingsFolder: any = null;

    constructor(scenesMap: Map<string, IScene>, isExternalUI: boolean) {
        this.gui = new dat.GUI();
        this.isExternalUI = isExternalUI;
        this.sceneMap = scenesMap;
        const sceneNames: string[] = Array.from(scenesMap.keys());
        const selection = {
            selectedSceneName: sceneNames[0],
        };
        this.sceneFolder = this.gui.addFolder("Scenes");
        const sceneSelector = this.sceneFolder.add(selection, 'selectedSceneName', sceneNames).name('Select Scene');

        sceneSelector.onChange((selectedSceneName: string) => {
            this.setScene(selectedSceneName);
        });

        this.sceneFolder.open();

        this.setScene(selection.selectedSceneName);
    }
    private setScene(sceneName: string) {

        const settings = this.buildSettings(sceneName);
        const sceneEventMessage = new SetSceneEvent(messageTarget.animation, messageAction.setScene, sceneName, settings);
        if (!this.isExternalUI) {
            const changeSceneEvent = new CustomEvent(messageAction.setScene, {
                detail: { event: sceneEventMessage.toMessage() }
            });
            window.dispatchEvent(changeSceneEvent);
        } else {
            chrome.runtime.sendMessage(sceneEventMessage.toMessage());
        }
        chrome.runtime.sendMessage(sceneEventMessage.toMessage());
    }

    private buildSettings(sceneName: string): ISceneSetting {
        const scene = this.sceneMap.get(sceneName);
        // Remove the existing settings folder if it exists
        if (this.settingsFolder) {
            this.sceneFolder.removeFolder(this.settingsFolder); // Correctly remove the folder from the GUI
        }

        // Create a new folder for scene-specific settings
        this.settingsFolder = this.sceneFolder.addFolder('Scene Settings');
        this.settingsFolder.open();


        const settings = loadSettings<ISceneSetting>(sceneName);
        if (scene instanceof SunFlower) {
            let sunFlowerSettings = settings ? settings as SunFlowerSetting : new SunFlowerSetting();
            this.settingsFolder.add({
                reset: () => {
                    sunFlowerSettings = new SunFlowerSetting();
                    this.setSceneSettings(sunFlowerSettings, sceneName);
                    this.buildSettings(sceneName);
                }
            }, 'reset').name('Reset Settings');


            this.settingsFolder.addColor(sunFlowerSettings, 'innerColor').onChange((value: string) => {
                sunFlowerSettings.innerColor = value;
                this.setSceneSettings(sunFlowerSettings, sceneName);
            });

            this.settingsFolder.addColor(sunFlowerSettings, 'midColor').onChange((value: string) => {
                sunFlowerSettings.midColor = value;
                this.setSceneSettings(sunFlowerSettings, sceneName);
            });
            this.settingsFolder.addColor(sunFlowerSettings, 'outerColor').onChange((value: string) => {
                sunFlowerSettings.outerColor = value;
                this.setSceneSettings(sunFlowerSettings, sceneName);
            });
            this.settingsFolder.add(sunFlowerSettings, 'innerRadiusGain', 0.0, 0.3).onChange((value: number) => {
                sunFlowerSettings.innerRadiusGain = value;
                this.setSceneSettings(sunFlowerSettings, sceneName);
            });
            this.settingsFolder.add(sunFlowerSettings, 'midRadiusGain', 0.3, 0.6).onChange((value: number) => {
                sunFlowerSettings.midRadiusGain = value;
                this.setSceneSettings(sunFlowerSettings, sceneName);
            });
            this.settingsFolder.add(sunFlowerSettings, 'outerRadiusGain', 0.6, 0.9).onChange((value: number) => {
                sunFlowerSettings.outerRadiusGain = value;
                this.setSceneSettings(sunFlowerSettings, sceneName);
            });
            this.settingsFolder.add(sunFlowerSettings, 'radius', 0.05, 0.5).onChange((value: number) => {
                sunFlowerSettings.radius = value;
                this.setSceneSettings(sunFlowerSettings, sceneName);
            });
            this.settingsFolder.add(sunFlowerSettings, 'size', 0.1, 1.5).onChange((value: number) => {
                sunFlowerSettings.size = value;
                this.setSceneSettings(sunFlowerSettings, sceneName);
            });
            return sunFlowerSettings;
        } else if (scene instanceof SynthBars) {
            let synthbarSettings = settings ? settings as SynthBarsSetting : new SynthBarsSetting();
            this.settingsFolder.add({
                reset: () => {
                    synthbarSettings = new SynthBarsSetting();
                    this.setSceneSettings(synthbarSettings, sceneName);
                    this.buildSettings(sceneName);
                }
            }, 'reset').name('Reset Settings');


            this.settingsFolder.addColor(synthbarSettings, 'bottomColor').onChange((value: string) => {
                synthbarSettings.bottomColor = value;
                this.setSceneSettings(synthbarSettings, sceneName);
            });
            this.settingsFolder.addColor(synthbarSettings, 'topColor').onChange((value: string) => {
                synthbarSettings.topColor = value;
                this.setSceneSettings(synthbarSettings, sceneName);
            });

            this.settingsFolder.add(synthbarSettings, 'noiseGain', 0.0, 1.0).onChange((value: number) => {
                synthbarSettings.noiseGain = value;
                this.setSceneSettings(synthbarSettings, sceneName);
            });
            this.settingsFolder.add(synthbarSettings, 'numberOfbars', 5.0, 80.0).onChange((value: number) => {
                synthbarSettings.numberOfbars = value;
                this.setSceneSettings(synthbarSettings, sceneName);
            });

            return synthbarSettings;
        } else if (scene instanceof DancingHorizon) {
            let dancingHorizonSettings = settings ? settings as DancingHorizonSetting : new DancingHorizonSetting();
            this.setSceneSettings(dancingHorizonSettings, sceneName);


            this.settingsFolder.add({
                reset: () => {
                    dancingHorizonSettings = new DancingHorizonSetting();
                    this.setSceneSettings(dancingHorizonSettings, sceneName);
                    this.buildSettings(sceneName);
                }
            }, 'reset').name('Reset Settings');

            this.settingsFolder.addColor(dancingHorizonSettings, 'horizonColorNight').onChange((value: string) => {
                dancingHorizonSettings.horizonColorNight = value;
                this.setSceneSettings(dancingHorizonSettings, sceneName);
            });
            this.settingsFolder.addColor(dancingHorizonSettings, 'horizonColorDay').onChange((value: string) => {
                dancingHorizonSettings.horizonColorDay = value;
                this.setSceneSettings(dancingHorizonSettings, sceneName);
            });
            this.settingsFolder.addColor(dancingHorizonSettings, 'skyColorNight').onChange((value: string) => {
                dancingHorizonSettings.skyColorNight = value;
                this.setSceneSettings(dancingHorizonSettings, sceneName);
            });
            this.settingsFolder.addColor(dancingHorizonSettings, 'skyColorDay').onChange((value: string) => {
                dancingHorizonSettings.skyColorDay = value;
                this.setSceneSettings(dancingHorizonSettings, sceneName);
            });
            this.settingsFolder.addColor(dancingHorizonSettings, 'oceanColorNight').onChange((value: string) => {
                dancingHorizonSettings.oceanColorNight = value;
                this.setSceneSettings(dancingHorizonSettings, sceneName);
            });
            this.settingsFolder.addColor(dancingHorizonSettings, 'oceanColorDay').onChange((value: string) => {
                dancingHorizonSettings.oceanColorDay = value;
                this.setSceneSettings(dancingHorizonSettings, sceneName);
            });
            this.settingsFolder.addColor(dancingHorizonSettings, 'moonColor').onChange((value: string) => {
                dancingHorizonSettings.moonColor = value;
                this.setSceneSettings(dancingHorizonSettings, sceneName);
            });
            this.settingsFolder.addColor(dancingHorizonSettings, 'sunColor').onChange((value: string) => {
                dancingHorizonSettings.sunColor = value;
                this.setSceneSettings(dancingHorizonSettings, sceneName);
            });
            this.settingsFolder.add(dancingHorizonSettings, 'timeGain', 0.1, 1.0).onChange((value: number) => {
                dancingHorizonSettings.timeGain = value;
                this.setSceneSettings(dancingHorizonSettings, sceneName);
            });
            this.settingsFolder.add(dancingHorizonSettings, 'noiseGain', 0.0, 1.0).onChange((value: number) => {
                dancingHorizonSettings.noiseGain = value;
                this.setSceneSettings(dancingHorizonSettings, sceneName);
            });
            this.settingsFolder.add(dancingHorizonSettings, 'cloudDensity', 0.0, 10.0).onChange((value: number) => {
                dancingHorizonSettings.cloudDensity = value;
                this.setSceneSettings(dancingHorizonSettings, sceneName);
            });
            this.settingsFolder.add(dancingHorizonSettings, 'cloudGain', 0.0, 1.0).onChange((value: number) => {
                dancingHorizonSettings.cloudGain = value;
                this.setSceneSettings(dancingHorizonSettings, sceneName);
            });

            return dancingHorizonSettings;
        }
        return {};
    }

    private setSceneSettings(sceneSettings: ISceneSetting, sceneName: string) {
        // Store the settings in local storage
        saveSettings(sceneName, sceneSettings);

        // Send the settings to the animation
        const sceneSettingEventMessage = new SetSceneSettingsEvent(messageTarget.animation, messageAction.setSceneSettings, sceneSettings);
        if (!this.isExternalUI) {
            const changeSceneEvent = new CustomEvent(messageAction.setSceneSettings, {
                detail: { event: sceneSettingEventMessage.toMessage() }
            });
            window.dispatchEvent(changeSceneEvent);
        } else {
            chrome.runtime.sendMessage(sceneSettingEventMessage.toMessage());
        }
    }
    destroy(): void {
        this.gui.destroy();
    }
}
