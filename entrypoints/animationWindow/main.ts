import {
    messageAction,
    GenericEvent,
    messageTarget,
    AudioDataEvent,
} from '@/src/utils/eventMessage';
import { IScene } from '@/src/scene/scene';
import { SceneManager } from '@/src/scene/sceneManager';
import { SunFlower } from '@/src/scene/scenes/sunflower/sunflower';
import { SynthBars } from '@/src/scene/scenes/synthBars/synthBars';
import { DancingHorizon } from '@/src/scene/scenes/dancingHorizon/dancingHorizon';
import { SettingsUserInterface } from '@/src/userInterface/settings/settings';
import { ISceneSetting } from '@/src/scene/sceneSetting';
import { SetSceneEvent } from '@/src/scene/events/setSceneEvent';
import { SetSceneSettingsEvent } from '@/src/scene/events/setSceneSettingsEvent';
import { Butterchurn } from '@/src/scene/scenes/butterchurn/butterchurn';

// Initialize scenes
const scenesMap = new Map<string, IScene>();
scenesMap.set('SunFlower', new SunFlower());
scenesMap.set('SynthBars', new SynthBars());
scenesMap.set('DancingHorizon', new DancingHorizon());
scenesMap.set('Butterchurn', new Butterchurn());

// Initialize scene manager
const sceneManager = new SceneManager();

// Change scene from animation window UI
window.addEventListener(messageAction.setScene, (event) => {
    const sceneEvent = event.detail.event as SetSceneEvent;
    sceneManager.setScene(
        scenesMap.get(sceneEvent.sceneName) as IScene,
        sceneEvent.sceneSettings as ISceneSetting
    );
});
// Change scene from external UI
chrome.runtime.onMessage.addListener((message: SetSceneEvent) => {
    if (
        message.target === messageTarget.animation &&
        message.action === messageAction.setScene
    ) {
        sceneManager.setScene(
            scenesMap.get(message.sceneName) as IScene,
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
const settingsUserInterface = new SettingsUserInterface(scenesMap, false);
function render() {
    sceneManager.renderScene();
    requestAnimationFrame(render);
}
render();
