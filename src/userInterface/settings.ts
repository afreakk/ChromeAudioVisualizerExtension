import * as dat from 'dat.gui';
import { messageAction, messageTarget, ChangeSceneEvent } from '@/src/utils/eventMessage';
import { SunFlower } from '@/src/scene/scenes/sunflower/sunflower';
import { SynthBars } from '@/src/scene/scenes/synthBars/synthBars';
import { DancingHorizon } from '@/src/scene/scenes/dancingHorizon/dancingHorizon';
import { DancingHorizonSetting } from "@/src/scene/scenes/dancingHorizon/setting";
import { SynthBarsSetting } from "@/src/scene/scenes/synthBars/setting";
import { SunFlowerSetting } from "@/src/scene/scenes/sunflower/setting";
import { Scene } from '../scene/scene';


export class SettingsUi {
    private gui: dat.GUI;
    private sceneFolder: any = null;
    private settingsFolder: any = null;

    constructor(scenesMap: Map<string, Scene>, isExternalUI: boolean) {
        this.gui = new dat.GUI();
        const sceneNames: string[] = Array.from(scenesMap.keys());
        const selection = {
            selectedSceneName: sceneNames[0], // Default to the first scene
        };
        this.sceneFolder = this.gui.addFolder("Scenes");
        const sceneSelector = this.sceneFolder.add(selection, 'selectedSceneName', sceneNames).name('Select Scene');

        sceneSelector.onChange((selectedSceneName) => {
            const selectedScene = scenesMap.get(selectedSceneName);
            this.buildSettings(selectedScene as Scene);
            const sceneEventMessage = new ChangeSceneEvent(messageTarget.animation, messageAction.changeScene, selectedSceneName);
            if (!isExternalUI) {
                const changeSceneEvent = new CustomEvent(messageAction.changeScene, {
                    detail: { sceneKey: selectedSceneName }
                });
                window.dispatchEvent(changeSceneEvent);
            } else {
                chrome.runtime.sendMessage(sceneEventMessage.toMessage());
            }
            chrome.runtime.sendMessage(sceneEventMessage.toMessage());
        });

        this.sceneFolder.open();
    }

    buildSettings(scene: Scene) {
        // Remove the existing settings folder if it exists
        if (this.settingsFolder) {
            this.sceneFolder.removeFolder(this.settingsFolder); // Correctly remove the folder from the GUI
        }

        // Create a new folder for scene-specific settings
        this.settingsFolder = this.sceneFolder.addFolder('Scene Settings');

        if (scene instanceof SunFlower) {
            // Example settings for SunFlower
            this.settingsFolder.add({ speed: 5 }, 'speed', 1, 10).name('Growth Speed');
            this.settingsFolder.add({ wind: false }, 'wind').name('Wind Effect');
        } else if (scene instanceof SynthBars) {
            // Example settings for SynthBars
            this.settingsFolder.add({ density: 50 }, 'density', 10, 100).name('Bar Density');
            this.settingsFolder.add({ animate: true }, 'animate').name('Animate Bars');
        } else if (scene instanceof DancingHorizon) {
            // Example settings for DancingHorizon
            this.settingsFolder.add({ height: 200 }, 'height', 100, 300).name('Horizon Line Height');
            this.settingsFolder.add({ dynamic: true }, 'dynamic').name('Dynamic Movement');
        }

        // Open the settings folder
        this.settingsFolder.open();
    }

    destroy(): void {
        this.gui.destroy();
    }
}
