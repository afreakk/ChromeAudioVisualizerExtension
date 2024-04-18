import { messageAction, messageTarget } from '@/src/utils/eventMessage';
import { ISceneSetting } from '@/src/scene/sceneSetting';
import { saveSettings } from '@/src/utils/settings';
import { SetSceneSettingsEvent } from '@/src/scene/events/setSceneSettingsEvent';

export function setSceneSettings(sceneSettings: ISceneSetting, sceneName: string, isExternalUI: boolean): void {
    // Store the settings in local storage
    saveSettings(sceneName, sceneSettings);

    // Send the settings to the animation
    const sceneSettingEventMessage = new SetSceneSettingsEvent(messageTarget.animation, messageAction.setSceneSettings, sceneSettings);
    if (!isExternalUI) {
        const changeSceneEvent = new CustomEvent(messageAction.setSceneSettings, {
            detail: { event: sceneSettingEventMessage.toMessage() }
        });
        window.dispatchEvent(changeSceneEvent);
    } else {
        chrome.runtime.sendMessage(sceneSettingEventMessage.toMessage());
    }
}
