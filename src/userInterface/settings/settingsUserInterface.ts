import * as dat from 'dat.gui';
import { SetSceneEvent } from '@/src/scene/events/setSceneEvent';
import { sceneNames } from '@/src/scene/sceneNames';
import { sceneRegistry } from '@/src/scene/sceneRegistry';
import type { ISceneSetting } from '@/src/scene/sceneSetting';
import { GenericEvent, messageAction, messageTarget } from '@/src/utils/eventMessage';
import { loadSettings, saveSettings } from '@/src/utils/settings';
import { SettingsWindowEvent } from './events/SettingsWindowEvent';
import { setSceneSettings } from './settingsManager';

export class SettingsUserInterface {
    private gui: dat.GUI | null = null;
    private sceneFolder: dat.GUIFolder | null = null;
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
        this.generalSettingsFolder = this.gui.addFolder('General Settings');
        if (!this.isExternalUI) {
            this.generalSettingsFolder
                .add(
                    {
                        openInWindow: () => {
                            const openSettingsWindowEvent = new SettingsWindowEvent(
                                messageTarget.background,
                                messageAction.openSettingsWindow,
                            );

                            window.sandboxEventMessageHolder?.source?.postMessage(openSettingsWindowEvent.toMessage(), {
                                targetOrigin: window.sandboxEventMessageHolder.origin,
                            });
                        },
                    },
                    'openInWindow',
                )
                .name('Open settings in Window');
        }
        this.generalSettingsFolder
            .add(
                {
                    toggleFullScreen: () => {
                        this.toggleFullScreen();
                    },
                },
                'toggleFullScreen',
            )
            .name('Toggle Fullscreen');
        const fpsState = { showFps: loadSettings<boolean>('showFps') ?? false };
        this.generalSettingsFolder
            .add(fpsState, 'showFps')
            .name('Show FPS')
            .onChange((value: unknown) => {
                const enabled = value as boolean;
                saveSettings('showFps', enabled);
                const showFpsEventMessage = new GenericEvent(messageTarget.animation, messageAction.showFpsOverlay);
                if (!this.isExternalUI) {
                    const showFpsEvent = new CustomEvent(messageAction.showFpsOverlay, {
                        detail: { event: showFpsEventMessage.toMessage(), value: enabled },
                    });
                    window.dispatchEvent(showFpsEvent);
                } else {
                    chrome.runtime.sendMessage({ ...showFpsEventMessage.toMessage(), value: enabled });
                }
            });
        this.generalSettingsFolder.open();

        const selection = {
            selectedSceneName: this.sceneNames[0].toString(),
        };
        this.sceneFolder = this.gui.addFolder('Scenes');
        const sceneSelector = this.sceneFolder.add(selection, 'selectedSceneName', sceneNames).name('Select Scene');

        sceneSelector.onChange((selectedSceneName) => {
            this.setScene(selectedSceneName as string);
        });

        this.sceneFolder.open();

        this.setScene(selection.selectedSceneName);
    }
    private toggleFullScreen() {
        const fullScreenEventMessage = new GenericEvent(messageTarget.animation, messageAction.toggleFullScreen);
        if (!this.isExternalUI) {
            const fullScreenEvent = new CustomEvent(messageAction.toggleFullScreen, {
                detail: { event: fullScreenEventMessage.toMessage() },
            });
            window.dispatchEvent(fullScreenEvent);
        } else {
            chrome.runtime.sendMessage(fullScreenEventMessage.toMessage());
        }
    }
    private setScene(sceneName: string) {
        const settings = this.buildSettings(sceneName);
        const sceneEventMessage = new SetSceneEvent(
            messageTarget.animation,
            messageAction.setScene,
            sceneName,
            settings,
        );
        if (!this.isExternalUI) {
            const changeSceneEvent = new CustomEvent(messageAction.setScene, {
                detail: { event: sceneEventMessage.toMessage() },
            });
            window.dispatchEvent(changeSceneEvent);
        } else {
            chrome.runtime.sendMessage(sceneEventMessage.toMessage());
        }
    }

    private buildSettings(sceneName: string): ISceneSetting {
        if (this.sceneSettingsFolder && this.sceneFolder) {
            this.sceneFolder.removeFolder(this.sceneSettingsFolder);
        }

        this.sceneSettingsFolder = this.sceneFolder!.addFolder('Scene Settings');
        this.sceneSettingsFolder.open();

        const entry = sceneRegistry.find((e) => e.sceneName.toString() === sceneName);
        if (!entry) {
            return {};
        }

        let settings: ISceneSetting = loadSettings<ISceneSetting>(sceneName) ?? entry.createDefaultSettings();

        setSceneSettings(settings, sceneName, this.isExternalUI);

        this.sceneSettingsFolder
            .add(
                {
                    reset: () => {
                        settings = entry.createDefaultSettings();
                        setSceneSettings(settings, sceneName, this.isExternalUI);
                        this.buildSettings(sceneName);
                    },
                },
                'reset',
            )
            .name('Reset Settings');

        entry.buildSettingsUI(sceneName, settings, this.sceneSettingsFolder, this.isExternalUI);

        return settings;
    }

    public destroy(): void {
        // Proper cleanup of GUI components
        if (this.sceneSettingsFolder !== null && this.sceneFolder !== null) {
            this.sceneFolder.removeFolder(this.sceneSettingsFolder);
            this.sceneSettingsFolder = null;
        }
        if (this.sceneFolder !== null && this.gui !== null) {
            this.gui.removeFolder(this.sceneFolder);
            this.sceneFolder = null;
        }
        if (this.generalSettingsFolder !== null && this.gui !== null) {
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
