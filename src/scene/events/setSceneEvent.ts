import { type AppMessage, messageAction, messageTarget } from '@/src/utils/eventMessage';
import type { ISceneSetting } from '../sceneSetting';

export interface SetSceneMessage extends AppMessage {
    sceneName: string;
    sceneSettings: ISceneSetting;
}

export const setSceneMessage = (sceneName: string, sceneSettings: ISceneSetting): SetSceneMessage => ({
    target: messageTarget.animation,
    action: messageAction.setScene,
    sceneName,
    sceneSettings,
});
