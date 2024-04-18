export enum messageTarget {
    background = "background",
    settings = "settings",
    offscreen = "offscreen",
    animation = "animation",
}
export enum messageAction {
    animationWindowCreated = "animation-window-created",
    initiateStream = "initiate-stream",
    startStream = "start-stream",
    stopStream = "stop-stream",
    updateAudioData = "start-animation",
    setScene = "set-scene",
    setSceneSettings = "set-scene-settings",
}
export enum streamType {
    butterChurn = "butterChurn",
    normal = "singleChannel",
}
export interface IAudioDataDto {
    timeByteArray: number[];
}
export class NormalAudioDataDto implements IAudioDataDto {
    timeByteArray: number[];
    constructor(timeByteArray: number[]) {
        this.timeByteArray = timeByteArray;
    }
}
export class ButterChurnAudioDataDto implements IAudioDataDto {
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
    audioData: IAudioDataDto;

    constructor(target: messageTarget, action: messageAction, audioData: IAudioDataDto) {
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
export class InitiateStreamEvent extends GenericEvent {
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
export class StartStreamEvent extends GenericEvent {
    streamType: streamType;

    constructor(target: messageTarget, action: messageAction, streamType: streamType) {
        super(target, action);
        this.streamType = streamType;
    }

    override toMessage() {
        return {
            target: this.target,
            action: this.action,
            streamType: this.streamType,
        };
    }
}

