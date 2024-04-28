import * as dat from 'dat.gui';
import { GenericEvent, messageAction, messageTarget } from '@/src/utils/eventMessage';
import { DancingHorizonSetting } from "@/src/scene/scenes/dancingHorizon/setting";
import { SynthBarsSetting } from "@/src/scene/scenes/synthBars/setting";
import { SunFlowerSetting } from "@/src/scene/scenes/sunflower/setting";
import { ISceneSetting } from '@/src/scene/sceneSetting';
import { loadSettings } from '@/src/utils/settings';
import { SetSceneEvent } from '@/src/scene/events/setSceneEvent';
import { sunFlowerSettings } from './sceneSettings/sunflowerSettings';
import { synthBarSettings } from './sceneSettings/synthBarSettings';
import { dancingHorizonSettings } from './sceneSettings/dancingHorizonSettings';
import { setSceneSettings } from './settingsManager';
import { sceneNames } from '@/src/scene/sceneNames';
import { SettingsWindowEvent } from './events/SettingsWindowEvent';
import { FrostFireSetting } from '@/src/scene/scenes/frostfire/settings';
import { frostFireSettings } from './sceneSettings/frostfireSettings';

export class SettingsUserInterface {
    private gui: dat.GUI | null = null;
    private sceneFolder: dat.GUIFolder | null;
    private sceneSettingsFolder: dat.GUIFolder | null = null;
    private generalSettingsFolder: dat.GUIFolder | null = null;
    private isExternalUI: boolean = false;
    private sceneNames: string[] = [];

    constructor(isExternalUI: boolean) {
        this.isExternalUI = isExternalUI;
        this.sceneNames = [];
        for (const scene in sceneNames) {
            this.sceneNames.push(scene);
        }

    }
    public buildScene() {
        this.gui = new dat.GUI();
        this.generalSettingsFolder = this.gui.addFolder("General Settings");
        if (!this.isExternalUI) {
            this.generalSettingsFolder.add({
                openInWindow: () => {
                    const openSettingsWindowEvent = new SettingsWindowEvent(messageTarget.background, messageAction.openSettingsWindow);
                    chrome.runtime.sendMessage(openSettingsWindowEvent.toMessage());
                }
            }, 'openInWindow').name('Open settings in Window');
        }
        this.generalSettingsFolder.add({
            toggleFullScreen: () => {
                this.toggleFullScreen();
            }
        }, 'toggleFullScreen').name('Toggle Fullscreen');
        this.generalSettingsFolder.open();

        const selection = {
            selectedSceneName: this.sceneNames[0].toString(),
        };
        this.sceneFolder = this.gui.addFolder("Scenes");
        const sceneSelector = this.sceneFolder.add(selection, 'selectedSceneName', sceneNames).name('Select Scene');

        sceneSelector.onChange((selectedSceneName: string) => {
            this.setScene(selectedSceneName);
        });

        this.sceneFolder.open();

        this.setScene(selection.selectedSceneName);
    }
    private toggleFullScreen() {
        const fullScreenEventMessage = new GenericEvent(messageTarget.animation, messageAction.toggleFullScreen);
        if (!this.isExternalUI) {
            const fullScreenEvent = new CustomEvent(messageAction.toggleFullScreen, {
                detail: { event: fullScreenEventMessage.toMessage() }
            });
            window.dispatchEvent(fullScreenEvent);
        } else {
            chrome.runtime.sendMessage(fullScreenEventMessage.toMessage());
        }
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
    }

    private buildSettings(sceneName: string): ISceneSetting {
        // Remove the existing settings folder if it exists
        if (this.sceneSettingsFolder) {
            this.sceneFolder.removeFolder(this.sceneSettingsFolder);
        }

        // Create a new folder for scene-specific settings
        this.sceneSettingsFolder = this.sceneFolder.addFolder('Scene Settings');
        this.sceneSettingsFolder.open();


        const settings = loadSettings<ISceneSetting>(sceneName);
        if (sceneName === sceneNames.SunFlower.toString()) {
            let sunFlowerSetting = settings ? settings as SunFlowerSetting : new SunFlowerSetting();
            this.sceneSettingsFolder.add({
                reset: () => {
                    sunFlowerSetting = new SunFlowerSetting();
                    setSceneSettings(sunFlowerSetting, sceneName, this.isExternalUI);
                    this.buildSettings(sceneName);
                }
            }, 'reset').name('Reset Settings');

            sunFlowerSettings(sceneName, sunFlowerSetting, this.sceneSettingsFolder, this.isExternalUI);

            return sunFlowerSetting;
        } else if (sceneName === sceneNames.SynthBars.toString()) {
            let synthbarSetting = settings ? settings as SynthBarsSetting : new SynthBarsSetting();
            this.sceneSettingsFolder.add({
                reset: () => {
                    synthbarSetting = new SynthBarsSetting();
                    setSceneSettings(synthbarSetting, sceneName, this.isExternalUI);
                    this.buildSettings(sceneName);
                }
            }, 'reset').name('Reset Settings');
            synthBarSettings(sceneName, synthbarSetting, this.sceneSettingsFolder, this.isExternalUI);

            return synthbarSetting;
        } else if (sceneName === sceneNames.FrostFire.toString()) {
            let frostFireSetting = settings ? settings as FrostFireSetting : new FrostFireSetting();
            this.sceneSettingsFolder.add({
                reset: () => {
                    frostFireSetting = new FrostFireSetting();
                    setSceneSettings(frostFireSetting, sceneName, this.isExternalUI);
                    this.buildSettings(sceneName);
                }
            }, 'reset').name('Reset Settings');
            frostFireSettings(sceneName, frostFireSetting, this.sceneSettingsFolder, this.isExternalUI);

            return frostFireSetting;
        } else if (sceneName === sceneNames.DancingHorizon.toString()) {
            let dancingHorizonSetting = settings ? settings as DancingHorizonSetting : new DancingHorizonSetting();
            setSceneSettings(dancingHorizonSetting, sceneName, this.isExternalUI);

            this.sceneSettingsFolder.add({
                reset: () => {
                    dancingHorizonSetting = new DancingHorizonSetting();
                    setSceneSettings(dancingHorizonSetting, sceneName, this.isExternalUI);
                    this.buildSettings(sceneName);
                }
            }, 'reset').name('Reset Settings');
            dancingHorizonSettings(sceneName, dancingHorizonSetting, this.sceneSettingsFolder, this.isExternalUI);

            return dancingHorizonSetting;
        }
        return {};
    }

    public destroy(): void {
        // Proper cleanup of GUI components
        if (this.sceneSettingsFolder !== null) {
            this.sceneFolder.removeFolder(this.sceneSettingsFolder);
            this.sceneSettingsFolder = null;
        }
        if (this.sceneFolder !== null) {
            this.gui.removeFolder(this.sceneFolder);
            this.sceneFolder = null;
        }
        if (this.generalSettingsFolder !== null) {
            this.gui.removeFolder(this.generalSettingsFolder);
            this.generalSettingsFolder = null;
        }

        // Destroy the main GUI
        if (this.gui !== null) {
            this.gui.destroy();
            this.gui = null;
        }
    }
}
