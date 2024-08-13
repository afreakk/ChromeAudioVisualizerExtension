import {
    messageAction,
    messageTarget,
    AudioDataEvent,
    GenericEvent,
} from '@/src/utils/eventMessage';
import { IScene } from '@/src/scene/scene';
import { SceneManager } from '@/src/scene/sceneManager';
import { SunFlower } from '@/src/scene/scenes/sunflower/sunflower';
import { SynthBars } from '@/src/scene/scenes/synthBars/synthBars';
import { DancingHorizon } from '@/src/scene/scenes/dancingHorizon/dancingHorizon';
import { ISceneSetting } from '@/src/scene/sceneSetting';
import { SetSceneEvent } from '@/src/scene/events/setSceneEvent';
import { SetSceneSettingsEvent } from '@/src/scene/events/setSceneSettingsEvent';
import { Butterchurn } from '@/src/scene/scenes/butterchurn/butterchurn';
import { sceneNames } from '@/src/scene/sceneNames';
import { SettingsWindowEvent } from '@/src/userInterface/settings/events/SettingsWindowEvent';
import { SettingsUserInterface } from '@/src/userInterface/settings/settingsUserInterface';
import { FrostFire } from '@/src/scene/scenes/frostfire/frostfire';

// Initialize scenes
const scenesMap = new Map<string, IScene>();
scenesMap.set(sceneNames.SunFlower.toString(), new SunFlower());
scenesMap.set(sceneNames.FrostFire.toString(), new FrostFire());
scenesMap.set(sceneNames.SynthBars.toString(), new SynthBars());
scenesMap.set(sceneNames.DancingHorizon.toString(), new DancingHorizon());
scenesMap.set(sceneNames.Butterchurn.toString(), new Butterchurn());
// Initialize scene manager
const sceneManager = new SceneManager();
window.sandboxEventMessageHolder = null;


window.addEventListener('message', (message: MessageEvent<GenericEvent>) => {
    window.sandboxEventMessageHolder = message;
    if (message.data.target === 'animationWindowReadyEvent') {
        console.log('animationWindowReadyEvent');
        settingsUserInterface.buildScene();
    }
    if (
        message.data.target === messageTarget.animation &&
        message.data.action === messageAction.toggleFullScreen
    ) {
        const fullScreenEventMessage = new GenericEvent(messageTarget.animation, messageAction.toggleFullScreen);

        window.sandboxEventMessageHolder.source.postMessage(
            fullScreenEventMessage.toMessage(),
            window.sandboxEventMessageHolder.origin
        );
    }
});
window.addEventListener(messageAction.toggleFullScreen, (event) => {
    const toggleFullScreenViaOffscreen = new GenericEvent(messageTarget.offscreen, messageAction.toggleFullScreen);

    window.sandboxEventMessageHolder.source.postMessage(
        toggleFullScreenViaOffscreen.toMessage(),
        window.sandboxEventMessageHolder.origin
    );
});
window.addEventListener(messageAction.setScene, (event) => {
    const sceneEvent = event.detail.event as SetSceneEvent;
    sceneManager.setScene(
        scenesMap.get(sceneEvent.sceneName) as IScene,
        sceneEvent.sceneSettings as ISceneSetting
    );
});
window.addEventListener('message', (message: MessageEvent<SetSceneEvent>) => {
    if (
        message.data.target === messageTarget.animation &&
        message.data.action === messageAction.setScene
    ) {
        sceneManager.setScene(
            scenesMap.get(message.data.sceneName) as IScene,
            message.data.sceneSettings
        );
    }
});
// Update scene settings event
window.addEventListener(messageAction.setSceneSettings, (event) => {
    const sceneSettingsEvent = event.detail.event as SetSceneSettingsEvent;
    sceneManager.updateSettings(sceneSettingsEvent.sceneSettings);
});
window.addEventListener(
    'message',
    (message: MessageEvent<SetSceneSettingsEvent>) => {
        if (
            message.data.target === messageTarget.animation &&
            message.data.action === messageAction.setSceneSettings
        ) {
            sceneManager.updateSettings(message.data.sceneSettings);
        }
    }
);
// Update audio data event
window.addEventListener('message', (message: MessageEvent<AudioDataEvent>) => {
    if (
        message.data.target === messageTarget.animation &&
        message.data.action === messageAction.updateAudioData
    ) {
        sceneManager.updateAudioData(message.data.audioData);
    }
});

// Initialize settings UI
let settingsUserInterface = new SettingsUserInterface(false);
window.addEventListener(
    'message',
    (message: MessageEvent<SettingsWindowEvent>) => {
        if (message.data.target === messageTarget.animation) {
            if (message.data.action === messageAction.openSettingsWindow) {
                settingsUserInterface.destroy();
            } else if (
                message.data.action === messageAction.closeSettingsWindow
            ) {
                settingsUserInterface.buildScene();
            }
        }
    }
);
function render() {
    sceneManager.renderScene();
    requestAnimationFrame(render);
}
render();
