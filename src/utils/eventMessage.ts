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
/**
 * Message shapes sent over chrome.runtime. Every message carries `target` (which
 * context should handle it) and `action`. The factory functions below are the only
 * producers; receivers filter on `target`, then narrow on `action`.
 *
 * chrome.runtime messages are JSON-serialized in transport, so optional fields left
 * `undefined` are simply omitted — no manual omit logic is needed.
 */
export interface AppMessage {
    target: messageTarget;
    action: messageAction;
}
export interface AudioDataMessage extends AppMessage {
    audioData: IAudioDataDto;
}
export interface InitiateStreamMessage extends AppMessage {
    streamId: string;
    source?: captureSource;
}
export interface StartStreamMessage extends AppMessage {
    streamType: streamType;
}
export interface SetFpsMessage extends AppMessage {
    fps: number;
}
export interface ShowFpsOverlayMessage extends AppMessage {
    value: boolean;
}
export interface RestartCaptureMessage extends AppMessage {
    nonce: string;
    source: captureSource;
}
export interface RestartCaptureAckMessage extends AppMessage {
    nonce: string;
    success: boolean;
    activeSource: captureSource;
}
/** Open/close notifications for the external settings window; `source` threads the
 * current capture source to a freshly (re)built embedded UI. */
export interface SettingsWindowMessage extends AppMessage {
    source?: captureSource;
}

export const appMessage = (target: messageTarget, action: messageAction): AppMessage => ({ target, action });

export const audioDataMessage = (audioData: IAudioDataDto): AudioDataMessage => ({
    target: messageTarget.animation,
    action: messageAction.updateAudioData,
    audioData,
});

export const initiateStreamMessage = (
    target: messageTarget,
    streamId: string,
    source?: captureSource,
): InitiateStreamMessage => ({
    target,
    action: messageAction.initiateStream,
    streamId,
    source,
});

export const startStreamMessage = (type: streamType): StartStreamMessage => ({
    target: messageTarget.offscreen,
    action: messageAction.startStream,
    streamType: type,
});

export const setFpsMessage = (fps: number): SetFpsMessage => ({
    target: messageTarget.offscreen,
    action: messageAction.setFps,
    fps,
});

export const showFpsOverlayMessage = (value: boolean): ShowFpsOverlayMessage => ({
    target: messageTarget.animation,
    action: messageAction.showFpsOverlay,
    value,
});

export const restartCaptureMessage = (nonce: string, source: captureSource): RestartCaptureMessage => ({
    target: messageTarget.background,
    action: messageAction.restartCapture,
    nonce,
    source,
});

export const restartCaptureAckMessage = (
    nonce: string,
    success: boolean,
    activeSource: captureSource,
): RestartCaptureAckMessage => ({
    target: messageTarget.settings,
    action: messageAction.restartCaptureAck,
    nonce,
    success,
    activeSource,
});

export const settingsWindowMessage = (
    target: messageTarget,
    action: messageAction,
    source?: captureSource,
): SettingsWindowMessage => ({ target, action, source });
