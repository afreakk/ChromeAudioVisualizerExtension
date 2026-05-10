export enum messageTarget {
    background = 'background',
    settings = 'settings',
    offscreen = 'offscreen',
    animation = 'animation',
}
export enum messageAction {
    initiateStream = 'initiate-stream',
    startStream = 'start-stream',
    stopStream = 'stop-stream',
    updateAudioData = 'update-audio-data',
    openSettingsWindow = 'open-settings-window',
    closeSettingsWindow = 'close-settings-window',
    setScene = 'set-scene',
    setSceneSettings = 'set-scene-settings',
    toggleFullScreen = 'toggle-full-screen',
    setFps = 'set-fps',
    showFpsOverlay = 'show-fps-overlay',
    saveSettings = 'save-settings',
    updateSettingsCache = 'update-settings-cache',
    animationReady = 'animation-ready',
    restartCapture = 'restart-capture',
    restartCaptureAck = 'restart-capture-ack',
    primeMicrophone = 'prime-microphone',
    primeMicrophoneFailed = 'prime-microphone-failed',
    micPrimeSucceeded = 'mic-prime-succeeded',
}
export enum streamType {
    butterChurn = 'butterChurn',
    normal = 'singleChannel',
}
export enum captureSource {
    tab = 'tab',
    microphone = 'microphone',
}
export interface IAudioDataDto {
    /**
     * Audio frequency data (0-255 per bin), despite the name.
     * For normal streams, this is populated via `getByteFrequencyData()` (frequency domain).
     * For butterchurn streams, this is populated via `getByteTimeDomainData()` (time domain).
     * The name is a historical misnomer retained for backwards compatibility.
     */
    timeByteArray: number[];
    timestamp?: number; // Timestamp when audio was captured (performance.now())
}
export class NormalAudioDataDto implements IAudioDataDto {
    timeByteArray: number[];
    timestamp?: number;
    constructor(timeByteArray: number[], timestamp?: number) {
        this.timeByteArray = timeByteArray;
        this.timestamp = timestamp;
    }
}
export class ButterChurnAudioDataDto implements IAudioDataDto {
    timeByteArray: number[];
    timeByteArrayLeft: number[];
    timeByteArrayRight: number[];
    timestamp?: number;
    constructor(timeByteArray: number[], dataLeft: number[], dataRight: number[], timestamp?: number) {
        this.timeByteArray = timeByteArray;
        this.timeByteArrayLeft = dataLeft;
        this.timeByteArrayRight = dataRight;
        this.timestamp = timestamp;
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
    source?: captureSource;

    constructor(target: messageTarget, action: messageAction, streamId: string, source?: captureSource) {
        super(target, action);
        this.streamId = streamId;
        this.source = source;
    }

    override toMessage() {
        const message: {
            target: messageTarget;
            action: messageAction;
            streamId: string;
            source?: captureSource;
        } = {
            target: this.target,
            action: this.action,
            streamId: this.streamId,
        };
        if (this.source !== undefined) {
            message.source = this.source;
        }
        return message;
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
export class SetFpsEvent extends GenericEvent {
    fps: number;

    constructor(target: messageTarget, action: messageAction, fps: number) {
        super(target, action);
        this.fps = fps;
    }

    override toMessage() {
        return {
            target: this.target,
            action: this.action,
            fps: this.fps,
        };
    }
}
export class UpdateSettingsCacheEvent extends GenericEvent {
    key: string;
    value: string | null;

    constructor(target: messageTarget, key: string, value: string | null) {
        super(target, messageAction.updateSettingsCache);
        this.key = key;
        this.value = value;
    }

    override toMessage() {
        return {
            target: this.target,
            action: this.action,
            key: this.key,
            value: this.value,
        };
    }
}
export class ShowFpsOverlayEvent extends GenericEvent {
    value: boolean;

    constructor(target: messageTarget, value: boolean) {
        super(target, messageAction.showFpsOverlay);
        this.value = value;
    }

    override toMessage() {
        return {
            target: this.target,
            action: this.action,
            value: this.value,
        };
    }
}
export class RestartCaptureEvent extends GenericEvent {
    nonce: string;
    source: captureSource;

    constructor(nonce: string, source: captureSource) {
        super(messageTarget.background, messageAction.restartCapture);
        this.nonce = nonce;
        this.source = source;
    }

    override toMessage() {
        return {
            target: this.target,
            action: this.action,
            nonce: this.nonce,
            source: this.source,
        };
    }
}
export class RestartCaptureAckEvent extends GenericEvent {
    nonce: string;
    success: boolean;
    activeSource: captureSource;

    constructor(nonce: string, success: boolean, activeSource: captureSource) {
        super(messageTarget.settings, messageAction.restartCaptureAck);
        this.nonce = nonce;
        this.success = success;
        this.activeSource = activeSource;
    }

    override toMessage() {
        return {
            target: this.target,
            action: this.action,
            nonce: this.nonce,
            success: this.success,
            activeSource: this.activeSource,
        };
    }
}
export class AnimationReadyEvent extends GenericEvent {
    storedSettings?: Record<string, string>;

    constructor(storedSettings?: Record<string, string>) {
        super(messageTarget.animation, messageAction.animationReady);
        this.storedSettings = storedSettings;
    }

    override toMessage() {
        return {
            target: this.target,
            action: this.action,
            storedSettings: this.storedSettings,
        };
    }
}
