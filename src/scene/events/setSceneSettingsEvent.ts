import { GenericEvent, type messageAction, type messageTarget } from '@/src/utils/eventMessage';
import type { ISceneSetting } from '../sceneSetting';

export class SetSceneSettingsEvent extends GenericEvent {
    sceneSettings: ISceneSetting;

    constructor(target: messageTarget, action: messageAction, sceneSettings: ISceneSetting) {
        super(target, action);
        this.sceneSettings = sceneSettings;
    }
}
