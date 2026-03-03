import { GenericEvent, type messageAction, type messageTarget } from '@/src/utils/eventMessage';
import type { ISceneSetting } from '../sceneSetting';

export class SetSceneEvent extends GenericEvent {
    sceneName: string;
    sceneSettings: ISceneSetting;

    constructor(target: messageTarget, action: messageAction, sceneName: string, sceneSettings: ISceneSetting) {
        super(target, action);
        this.sceneName = sceneName;
        this.sceneSettings = sceneSettings;
    }

    override toMessage() {
        return {
            target: this.target,
            action: this.action,
            sceneName: this.sceneName,
            sceneSettings: this.sceneSettings,
        };
    }
}
