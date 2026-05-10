import * as dat from 'dat.gui';
import { SetSceneEvent } from '@/src/scene/events/setSceneEvent';
import { sceneNames } from '@/src/scene/sceneNames';
import { sceneRegistry } from '@/src/scene/sceneRegistry';
import type { ISceneSetting } from '@/src/scene/sceneSetting';
import {
    captureSource,
    GenericEvent,
    messageAction,
    messageTarget,
    RestartCaptureEvent,
} from '@/src/utils/eventMessage';
import {
    customPresetKey,
    customPresetName,
    deletePreset,
    isCustomPreset,
    loadAllPresets,
    savePreset,
} from '@/src/utils/presetManager';
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
    private sceneCleanups: (() => void)[] = [];
    private currentBaseScene: string | null = null;
    private sceneSelectorController: dat.GUIController | null = null;
    private captureSourceController: dat.GUIController | null = null;
    private currentSceneKey: string = '';
    private currentSettings: ISceneSetting = {};
    private pendingRestartNonce: string | null = null;
    private initialCaptureSource: captureSource = captureSource.tab;
    private runtimeAckListener: ((message: unknown) => void) | null = null;
    private windowAckListener: ((event: MessageEvent) => void) | null = null;

    constructor(isExternalUI: boolean, initialCaptureSource: captureSource = captureSource.tab) {
        this.isExternalUI = isExternalUI;
        this.initialCaptureSource = initialCaptureSource;
        this.sceneNames = [];
        for (const scene in sceneNames) {
            this.sceneNames.push(scene);
        }
        this.registerRestartCaptureAckListener();
    }

    private setCaptureSourceDisabled(disabled: boolean): void {
        const select = this.captureSourceController?.domElement.querySelector('select');
        if (select instanceof HTMLSelectElement) {
            select.disabled = disabled;
        }
    }

    private sendRestartCapture(source: captureSource): void {
        const nonce = crypto.randomUUID();
        this.pendingRestartNonce = nonce;
        const event = new RestartCaptureEvent(nonce, source);
        if (this.isExternalUI) {
            chrome.runtime.sendMessage(event.toMessage());
        } else {
            window.sandboxEventMessageHolder?.source?.postMessage(event.toMessage(), {
                targetOrigin: window.sandboxEventMessageHolder.origin,
            });
        }
    }

    private handleRestartCaptureAck(nonce: unknown, success: unknown, activeSource: unknown): void {
        if (typeof nonce !== 'string' || nonce !== this.pendingRestartNonce) {
            return;
        }
        this.pendingRestartNonce = null;
        this.setCaptureSourceDisabled(false);

        const next: captureSource =
            activeSource === captureSource.microphone ? captureSource.microphone : captureSource.tab;
        // Mirror background state without firing onChange (which would start a new restart).
        // Skip dat.gui's updateDisplay because OptionController bails when the <select> is the
        // active element (dat.gui issue #552); set DOM directly and keep state in sync.
        if (this.captureSourceController) {
            const stateObj = this.captureSourceController.object as { captureSource: captureSource };
            if (stateObj.captureSource !== next) {
                stateObj.captureSource = next;
                const select = this.captureSourceController.domElement.querySelector('select');
                if (select) (select as HTMLSelectElement).value = next;
            }
        }

        if (success === false) {
            console.warn('Capture source restart failed; dropdown mirrors background state');
        }
    }

    private registerRestartCaptureAckListener(): void {
        if (this.isExternalUI) {
            this.runtimeAckListener = (message: unknown) => {
                const m = message as {
                    action?: string;
                    nonce?: unknown;
                    success?: unknown;
                    activeSource?: unknown;
                } | null;
                if (m?.action === messageAction.restartCaptureAck) {
                    this.handleRestartCaptureAck(m.nonce, m.success, m.activeSource);
                }
            };
            chrome.runtime.onMessage.addListener(this.runtimeAckListener);
        } else {
            this.windowAckListener = (event: MessageEvent) => {
                const data = event.data as {
                    action?: string;
                    nonce?: unknown;
                    success?: unknown;
                    activeSource?: unknown;
                } | null;
                if (data?.action !== messageAction.restartCaptureAck) return;
                const trustedOrigin = window.sandboxEventMessageHolder?.origin;
                if (!trustedOrigin || event.origin !== trustedOrigin) return;
                this.handleRestartCaptureAck(data.nonce, data.success, data.activeSource);
            };
            window.addEventListener('message', this.windowAckListener);
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

        // captureSource is session-only. Initial value is threaded in from the caller — the
        // background is the single source of truth. Live changes round-trip through the ack,
        // which carries the authoritative activeSource for the dropdown to mirror.
        const captureSourceState = {
            captureSource: this.initialCaptureSource,
        };
        this.captureSourceController = this.generalSettingsFolder
            .add(captureSourceState, 'captureSource', {
                'Current tab (default)': captureSource.tab,
                'Microphone / system audio': captureSource.microphone,
            })
            .name('Capture source')
            .onChange((value: unknown) => {
                const source = value === captureSource.microphone ? captureSource.microphone : captureSource.tab;
                this.setCaptureSourceDisabled(true);
                this.sendRestartCapture(source);
            });
        this.generalSettingsFolder.open();

        const defaultScene = this.sceneNames[0].toString();
        const storedSelectedScene = loadSettings<string>('selectedScene');
        const validSceneNames = new Set(sceneRegistry.map((entry) => entry.sceneName.toString()));
        let selectedScene = storedSelectedScene ?? defaultScene;
        if (storedSelectedScene && !isCustomPreset(storedSelectedScene) && !validSceneNames.has(storedSelectedScene)) {
            console.warn(`Stored scene "${storedSelectedScene}" no longer exists; falling back to default`);
            selectedScene = defaultScene;
            saveSettings('selectedScene', selectedScene);
        }
        if (isCustomPreset(selectedScene)) {
            const presets = loadAllPresets();
            if (!presets[customPresetName(selectedScene)]) {
                selectedScene = defaultScene;
                saveSettings('selectedScene', selectedScene);
            }
        }
        const selection = {
            selectedSceneName: selectedScene,
        };
        this.sceneFolder = this.gui.addFolder('Scenes');

        this.buildSceneSelector(selection);

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
    private buildSceneOptions(): Record<string, string> {
        const options: Record<string, string> = {};
        for (const scene in sceneNames) {
            options[scene] = scene;
        }
        const presets = loadAllPresets();
        for (const name of Object.keys(presets)) {
            options[`* ${name}`] = customPresetKey(name);
        }
        return options;
    }

    private buildSceneSelector(selection: { selectedSceneName: string }): void {
        if (this.sceneSelectorController) {
            this.sceneSelectorController.remove();
        }
        const options = this.buildSceneOptions();
        this.sceneSelectorController = this.sceneFolder!.add(selection, 'selectedSceneName', options).name(
            'Select Scene',
        );
        this.sceneSelectorController.onChange((selectedSceneName) => {
            saveSettings('selectedScene', selectedSceneName as string);
            this.setScene(selectedSceneName as string);
        });
    }

    private rebuildSceneSelector(selectedValue: string): void {
        const selection = { selectedSceneName: selectedValue };
        this.buildSceneSelector(selection);
        saveSettings('selectedScene', selectedValue);
        this.setScene(selectedValue);
    }

    private setScene(sceneKey: string) {
        const settings = this.buildSettings(sceneKey);
        const baseScene = this.currentBaseScene ?? sceneKey;
        const sceneEventMessage = new SetSceneEvent(
            messageTarget.animation,
            messageAction.setScene,
            baseScene,
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

    private buildSettings(sceneKey: string): ISceneSetting {
        for (const cleanup of this.sceneCleanups) cleanup();
        this.sceneCleanups = [];

        if (this.sceneSettingsFolder && this.sceneFolder) {
            this.sceneFolder.removeFolder(this.sceneSettingsFolder);
        }

        this.sceneSettingsFolder = this.sceneFolder!.addFolder('Scene Settings');
        this.sceneSettingsFolder.open();

        this.currentSceneKey = sceneKey;

        let baseSceneName: string;
        let settings: ISceneSetting;

        if (isCustomPreset(sceneKey)) {
            const presetName = customPresetName(sceneKey);
            const presets = loadAllPresets();
            const preset = presets[presetName];
            if (!preset) {
                this.currentBaseScene = null;
                return {};
            }
            baseSceneName = preset.baseScene;
            settings = JSON.parse(JSON.stringify(preset.settings));
        } else {
            baseSceneName = sceneKey;
            const entry = sceneRegistry.find((e) => e.sceneName.toString() === baseSceneName);
            if (!entry) {
                this.currentBaseScene = null;
                return {};
            }
            settings = entry.createDefaultSettings();
        }

        this.currentBaseScene = baseSceneName;
        this.currentSettings = settings;

        const entry = sceneRegistry.find((e) => e.sceneName.toString() === baseSceneName);
        if (!entry) {
            return {};
        }

        setSceneSettings(settings, baseSceneName, this.isExternalUI);

        this.sceneSettingsFolder
            .add(
                {
                    reset: () => {
                        settings = entry.createDefaultSettings();
                        this.currentSettings = settings;
                        setSceneSettings(settings, baseSceneName, this.isExternalUI);
                        this.buildSettings(sceneKey);
                    },
                },
                'reset',
            )
            .name('Reset Settings');

        entry.buildSettingsUI(baseSceneName, settings, this.sceneSettingsFolder, this.isExternalUI, (cb) =>
            this.sceneCleanups.push(cb),
        );

        // Custom Scenes sub-folder (collapsed by default)
        const customScenesFolder = this.sceneSettingsFolder.addFolder('Custom Scenes');

        const saveAsNewState = { presetName: '' };
        customScenesFolder.add(saveAsNewState, 'presetName').name('New Scene Name');
        customScenesFolder
            .add(
                {
                    saveAsNew: () => {
                        const trimmed = saveAsNewState.presetName.trim();
                        if (!trimmed) return;
                        savePreset(trimmed, baseSceneName, this.currentSettings);
                        saveAsNewState.presetName = '';
                        this.rebuildSceneSelector(customPresetKey(trimmed));
                    },
                },
                'saveAsNew',
            )
            .name('Save as New Scene');

        if (isCustomPreset(sceneKey)) {
            const presetName = customPresetName(sceneKey);
            customScenesFolder
                .add(
                    {
                        savePreset: () => {
                            savePreset(presetName, baseSceneName, this.currentSettings);
                        },
                    },
                    'savePreset',
                )
                .name('Save Scene');

            const deleteState = { armed: false };
            const deleteController = customScenesFolder
                .add(
                    {
                        deletePreset: () => {
                            if (!deleteState.armed) {
                                deleteState.armed = true;
                                deleteController.name('Click again to confirm');
                                return;
                            }
                            deletePreset(presetName);
                            this.rebuildSceneSelector(this.sceneNames[0]);
                        },
                    },
                    'deletePreset',
                )
                .name('Delete Scene');
        }

        return settings;
    }

    public onPresetsChanged(): void {
        if (!this.sceneSelectorController || !this.sceneFolder) return;
        const current = this.currentSceneKey;
        if (isCustomPreset(current)) {
            const presets = loadAllPresets();
            const name = customPresetName(current);
            if (!presets[name]) {
                this.rebuildSceneSelector(this.sceneNames[0]);
                return;
            }
        }
        const selection = { selectedSceneName: current };
        this.buildSceneSelector(selection);
    }

    public destroy(): void {
        for (const cleanup of this.sceneCleanups) cleanup();
        this.sceneCleanups = [];

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

        if (this.runtimeAckListener) {
            chrome.runtime.onMessage.removeListener(this.runtimeAckListener);
            this.runtimeAckListener = null;
        }
        if (this.windowAckListener) {
            window.removeEventListener('message', this.windowAckListener);
            this.windowAckListener = null;
        }

        this.captureSourceController = null;
        this.pendingRestartNonce = null;
    }
}
