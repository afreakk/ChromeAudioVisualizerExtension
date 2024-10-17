import { GenericEvent, messageAction, messageTarget } from "@/src/utils/eventMessage";

export class SettingsWindowEvent extends GenericEvent {

    constructor(target: messageTarget, action: messageAction) {
        super(target, action);
    }
    override toMessage() {
        return {
            target: this.target,
            action: this.action,
        };
    }
}

