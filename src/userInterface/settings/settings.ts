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
import { loadSettings } from '@/src/utils/settings';
import { SetSceneEvent } from '@/src/scene/events/setSceneEvent';
import { sunFlowerSettings } from './sceneSettings/sunflowerSettings';
import { synthBarSettings } from './sceneSettings/synthBarSettings';
import { dancingHorizonSettings } from './sceneSettings/dancingHorizonSettings';
import { setSceneSettings } from './settingsManager';

export class SettingsUserInterface {
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
            let sunFlowerSetting = settings ? settings as SunFlowerSetting : new SunFlowerSetting();
            this.settingsFolder.add({
                reset: () => {
                    sunFlowerSetting = new SunFlowerSetting();
                    setSceneSettings(sunFlowerSetting, sceneName, this.isExternalUI);
                    this.buildSettings(sceneName);
                }
            }, 'reset').name('Reset Settings');

            sunFlowerSettings(sceneName, sunFlowerSetting, this.settingsFolder, this.isExternalUI);

            return sunFlowerSetting;
        } else if (scene instanceof SynthBars) {
            let synthbarSetting = settings ? settings as SynthBarsSetting : new SynthBarsSetting();
            this.settingsFolder.add({
                reset: () => {
                    synthbarSetting = new SynthBarsSetting();
                    setSceneSettings(synthbarSetting, sceneName, this.isExternalUI);
                    this.buildSettings(sceneName);
                }
            }, 'reset').name('Reset Settings');
            synthBarSettings(sceneName, synthbarSetting, this.settingsFolder, this.isExternalUI);

            return synthbarSetting;
        } else if (scene instanceof DancingHorizon) {
            let dancingHorizonSetting = settings ? settings as DancingHorizonSetting : new DancingHorizonSetting();
            setSceneSettings(dancingHorizonSetting, sceneName, this.isExternalUI);

            this.settingsFolder.add({
                reset: () => {
                    dancingHorizonSetting = new DancingHorizonSetting();
                    setSceneSettings(dancingHorizonSetting, sceneName, this.isExternalUI);
                    this.buildSettings(sceneName);
                }
            }, 'reset').name('Reset Settings');
            dancingHorizonSettings(sceneName, dancingHorizonSetting, this.settingsFolder, this.isExternalUI);

            return dancingHorizonSetting;
        }
        return {};
    }

    destroy(): void {
        this.gui.destroy();
    }
}
