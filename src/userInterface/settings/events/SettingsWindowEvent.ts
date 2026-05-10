import { type captureSource, GenericEvent, type messageAction, type messageTarget } from '@/src/utils/eventMessage';

export class SettingsWindowEvent extends GenericEvent {
    source?: captureSource;

    constructor(target: messageTarget, action: messageAction, source?: captureSource) {
        super(target, action);
        this.source = source;
    }

    override toMessage() {
        const message: {
            target: messageTarget;
            action: messageAction;
            source?: captureSource;
        } = {
            target: this.target,
            action: this.action,
        };
        if (this.source !== undefined) {
            message.source = this.source;
        }
        return message;
    }
}
