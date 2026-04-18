import { SetSceneSettingsEvent } from '@/src/scene/events/setSceneSettingsEvent';
import type { ISceneSetting } from '@/src/scene/sceneSetting';
import { messageAction, messageTarget } from '@/src/utils/eventMessage';

export function setSceneSettings(sceneSettings: ISceneSetting, sceneName: string, isExternalUI: boolean): void {
    // Send the settings to the animation
    const sceneSettingEventMessage = new SetSceneSettingsEvent(
        messageTarget.animation,
        messageAction.setSceneSettings,
        sceneSettings,
    );
    if (!isExternalUI) {
        const changeSceneEvent = new CustomEvent(messageAction.setSceneSettings, {
            detail: { event: sceneSettingEventMessage.toMessage() },
        });
        window.dispatchEvent(changeSceneEvent);
    } else {
        chrome.runtime.sendMessage(sceneSettingEventMessage.toMessage());
    }
}
