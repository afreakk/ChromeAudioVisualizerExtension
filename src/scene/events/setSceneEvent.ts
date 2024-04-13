import { GenericEvent, messageTarget, messageAction } from "@/src/utils/eventMessage";
import { SceneSetting } from "../sceneSetting";

export class SetSceneEvent extends GenericEvent {
    sceneName: string;
    sceneSettings: SceneSetting;

    constructor(target: messageTarget, action: messageAction, sceneName: string, sceneSettings: SceneSetting) {
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
