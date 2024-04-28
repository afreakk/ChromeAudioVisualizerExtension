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

// Fullscreen event
window.addEventListener(messageAction.toggleFullScreen, (event) => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen(); // Make the whole page fullscreen
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen(); // Exit fullscreen mode
        }
    }
});
chrome.runtime.onMessage.addListener((message: GenericEvent) => {
    if (
        message.target === messageTarget.animation &&
        message.action === messageAction.toggleFullScreen
    ) {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen(); // Make the whole page fullscreen
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen(); // Exit fullscreen mode
            }
        }
    }
});
window.addEventListener(messageAction.setScene, (event) => {
    const sceneEvent = event.detail.event as SetSceneEvent;
    sceneManager.setScene(
        scenesMap.get(sceneEvent.sceneName) as IScene,
        sceneEvent.sceneSettings as ISceneSetting
    );
});
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
// Update scene settings event
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
// Update audio data event
chrome.runtime.onMessage.addListener((message: AudioDataEvent) => {
    if (
        message.target === messageTarget.animation &&
        message.action === messageAction.updateAudioData
    ) {
        sceneManager.updateAudioData(message.audioData);
    }
});

// Initialize settings UI
let settingsUserInterface = new SettingsUserInterface(false);
settingsUserInterface.buildScene();
chrome.runtime.onMessage.addListener((message: SettingsWindowEvent) => {
    if (message.target === messageTarget.animation) {
        if (message.action === messageAction.openSettingsWindow) {
            settingsUserInterface.destroy();
        } else if (message.action === messageAction.closeSettingsWindow) {
            settingsUserInterface.buildScene();
        }
    }
});
function render() {
    sceneManager.renderScene();
    requestAnimationFrame(render);
}
render();
