export enum messageTarget {
    background = "background",
    popup = "popup",
    options = "options",
    offscreen = "offscreen",
    animation = "animation",
}
export enum messageAction {
    animationWindowCreated = "animation-window-created",
    startStream = "start-stream",
    stopStream = "stop-stream",
    updateAudioData = "start-animation",
    changeScene = "change-scene",
    loadScene = "load-scene",
}
export class AudioDataDto {
    timeByteArray: number[];
    timeByteArrayLeft: number[];
    timeByteArrayRight: number[];
    constructor(timeByteArray: number[], dataLeft: number[], dataRight: number[]) {
        this.timeByteArray = timeByteArray;
        this.timeByteArrayLeft = dataLeft;
        this.timeByteArrayRight = dataRight;
    }
}
export class GenericEvent {
    target: messageTarget;
    action: messageAction;

    constructor(target: messageTarget, action: messageAction) {
        this.target = target;
        this.action = action;
    }

    toMessage() {
        return {
            target: this.target,
            action: this.action,
        };
    }
}
export class AudioDataEvent extends GenericEvent {
    audioData: AudioDataDto;

    constructor(target: messageTarget, action: messageAction, audioData: AudioDataDto) {
        super(target, action);
        this.audioData = audioData;
    }

    override toMessage() {
        return {
            target: this.target,
            action: this.action,
            audioData: this.audioData,
        };
    }
}
export class StartStreamEvent extends GenericEvent {
    streamId: string;

    constructor(target: messageTarget, action: messageAction, streamId: string) {
        super(target, action);
        this.streamId = streamId;
    }

    override toMessage() {
        return {
            target: this.target,
            action: this.action,
            streamId: this.streamId,
        };
    }
}

