import { GenericEvent } from '@/src/utils/eventMessage';

export class SettingsWindowEvent extends GenericEvent {
    override toMessage() {
        return {
            target: this.target,
            action: this.action,
        };
    }
}
