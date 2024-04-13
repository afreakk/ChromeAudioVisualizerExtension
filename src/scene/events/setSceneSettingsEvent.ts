import { GenericEvent, messageTarget, messageAction } from "@/src/utils/eventMessage";
import { SceneSetting } from "../sceneSetting";

export class SetSceneSettingsEvent extends GenericEvent {
    sceneSettings: SceneSetting;

    constructor(target: messageTarget, action: messageAction, sceneSettings: SceneSetting) {
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
