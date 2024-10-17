import { GenericEvent, messageTarget, messageAction } from "@/src/utils/eventMessage";
import { ISceneSetting } from "../sceneSetting";

export class SetSceneSettingsEvent extends GenericEvent {
    sceneSettings: ISceneSetting;

    constructor(target: messageTarget, action: messageAction, sceneSettings: ISceneSetting) {
        super(target, action);
        this.sceneSettings = sceneSettings;
    }

    override toMessage() {
        return {
            target: this.target,
            action: this.action,
            sceneSettings: this.sceneSettings,
        };
    }
}
