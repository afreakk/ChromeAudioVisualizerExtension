import { setSceneSettingsMessage } from '@/src/scene/events/setSceneSettingsEvent';
import type { ISceneSetting } from '@/src/scene/sceneSetting';

/**
 * Direct hooks into the animation window's scene state. The embedded dat.gui and
 * SceneManager live in the same JS context, so the animation window registers these
 * at startup and the embedded UI calls them directly. The external settings popup is
 * a genuinely separate window and never gets a host — it sends over chrome.runtime.
 */
export interface EmbeddedUiHost {
    setScene(sceneName: string, sceneSettings: ISceneSetting): void;
    setSceneSettings(sceneSettings: ISceneSetting): void;
    setShowFpsOverlay(value: boolean): void;
    toggleFullScreen(): void;
}

let embeddedUiHost: EmbeddedUiHost | null = null;

export function registerEmbeddedUiHost(host: EmbeddedUiHost): void {
    embeddedUiHost = host;
}

export function getEmbeddedUiHost(): EmbeddedUiHost | null {
    return embeddedUiHost;
}

export function setSceneSettings(sceneSettings: ISceneSetting, _sceneName: string, isExternalUI: boolean): void {
    if (!isExternalUI) {
        getEmbeddedUiHost()?.setSceneSettings(sceneSettings);
        return;
    }
    chrome.runtime.sendMessage(setSceneSettingsMessage(sceneSettings));
}
