import {
    messageAction,
    GenericEvent,
    messageTarget,
    AudioDataEvent,
} from '@/src/utils/eventMessage';
import { Scene } from '@/src/scene/scene';
import { SceneManager } from '@/src/scene/sceneManager';
import { SunFlower } from '@/src/scene/scenes/sunflower/sunflower';
import { SynthBars } from '@/src/scene/scenes/synthBars/synthBars';
import { DancingHorizon } from '@/src/scene/scenes/dancingHorizon/dancingHorizon';
import { SettingsUi } from '@/src/userInterface/settings/settings';
import { SceneSetting } from '@/src/scene/sceneSetting';
import { SetSceneEvent } from '@/src/scene/events/setSceneEvent';
import { SetSceneSettingsEvent } from '@/src/scene/events/setSceneSettingsEvent';
import { Butterchurn } from '@/src/scene/scenes/butterchurn/butterchurn';

// Create canvas for animation
const canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.position = 'fixed';
canvas.style.left = '0';
canvas.style.top = '0';
canvas.style.zIndex = '-1';
document.body.insertBefore(canvas, document.body.firstChild);

// Send message to background to notify that animation window is created
const animationWindowCreated = new GenericEvent(
    messageTarget.background,
    messageAction.animationWindowCreated
);
chrome.runtime.sendMessage(animationWindowCreated.toMessage());

// Initialize scenes
const scenesMap = new Map<string, Scene>();
scenesMap.set('SunFlower', new SunFlower(canvas));
scenesMap.set('SynthBars', new SynthBars(canvas));
scenesMap.set('DancingHorizon', new DancingHorizon(canvas));
scenesMap.set('Butterchurn', new Butterchurn(canvas));

// Initialize scene manager
const sceneManager = new SceneManager();

// Change scene from animation window UI
window.addEventListener(messageAction.setScene, (event) => {
    const sceneEvent = event.detail.event as SetSceneEvent;
    sceneManager.setScene(
        scenesMap.get(sceneEvent.sceneName) as Scene,
        sceneEvent.sceneSettings as SceneSetting
    );
});
// Change scene from external UI
chrome.runtime.onMessage.addListener((message: SetSceneEvent) => {
    if (
        message.target === messageTarget.animation &&
        message.action === messageAction.setScene
    ) {
        sceneManager.setScene(
            scenesMap.get(message.sceneName) as Scene,
            message.sceneSettings
        );
    }
});
// Update scene settings
window.addEventListener(messageAction.setSceneSettings, (event) => {
    const sceneSettingsEvent = event.detail.event as SetSceneSettingsEvent;
    sceneManager.updateSettings(sceneSettingsEvent.sceneSettings);
});
chrome.runtime.onMessage.addListener((message: SetSceneSettingsEvent) => {
    if (
        message.target === messageTarget.animation &&
        message.action === messageAction.setSceneSettings
    ) {
        sceneManager.updateSettings(message.sceneSettings);
    }
});
// Update audio data
chrome.runtime.onMessage.addListener((message: AudioDataEvent) => {
    if (
        message.target === messageTarget.animation &&
        message.action === messageAction.updateAudioData
    ) {
        sceneManager.updateAudioData(message.audioData);
    }
});

// Initialize settings UI
const settingsUi = new SettingsUi(scenesMap, false);
function render() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    sceneManager.renderScene();
    requestAnimationFrame(render);
}
render();
