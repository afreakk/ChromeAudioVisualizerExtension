import { type AppMessage, messageAction, messageTarget } from '@/src/utils/eventMessage';
import type { ISceneSetting } from '../sceneSetting';

export interface SetSceneSettingsMessage extends AppMessage {
    sceneSettings: ISceneSetting;
}

export const setSceneSettingsMessage = (sceneSettings: ISceneSetting): SetSceneSettingsMessage => ({
    target: messageTarget.animation,
    action: messageAction.setSceneSettings,
    sceneSettings,
});
