import { messageAction, GenericEvent, messageTarget, AudioDataEvent, ChangeSceneEvent } from '@/src/utils/eventMessage';
import { Scene } from '@/src/scene/scene';
import { SceneManager } from '@/src/scene/sceneManager';
import { SunFlower } from '@/src/scene/scenes/sunflower/sunflower';
import { SynthBars } from '@/src/scene/scenes/synthBars/synthBars';
import { DancingHorizon } from '@/src/scene/scenes/dancingHorizon/dancingHorizon';
import { SettingsUi } from '@/src/userInterface/settings';


const canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.position = 'fixed';
canvas.style.left = '0';
canvas.style.top = '0';
canvas.style.zIndex = '-1';
document.body.insertBefore(canvas, document.body.firstChild);


const animationWindowCreated = new GenericEvent(messageTarget.background, messageAction.animationWindowCreated);
chrome.runtime.sendMessage(animationWindowCreated.toMessage());
const scenesMap = new Map<string, Scene>();
scenesMap.set("SunFlower", new SunFlower(canvas));
scenesMap.set("SynthBars", new SynthBars(canvas));
scenesMap.set("DancingHorizon", new DancingHorizon(canvas));
const firstSceneName = scenesMap.keys().next().value;

const settingsUi = new SettingsUi(scenesMap, false);

let firstScene = scenesMap.get(firstSceneName) as Scene;
const sceneManager = new SceneManager(firstScene);

// Change scene from animation window UI
window.addEventListener(messageAction.changeScene, (event) => {
    const sceneKey = event.detail.sceneKey;
    sceneManager.setScene(scenesMap.get(sceneKey) as Scene);
});
// Change scene from external UI
chrome.runtime.onMessage.addListener((message: ChangeSceneEvent) => {
    if (message.target === messageTarget.animation && message.action === messageAction.changeScene) {
        sceneManager.setScene(scenesMap.get(message.sceneKey) as Scene);
    }
});
// Update scene settings
chrome.runtime.onMessage.addListener((message) => {
    if (message.target === messageTarget.animation && message.action === messageAction.updateSceneSettings) {
        sceneManager.updateSettings(message.settings);
    }
});
// Update audio data
chrome.runtime.onMessage.addListener((message: AudioDataEvent) => {
    if (message.target === messageTarget.animation && message.action === messageAction.updateAudioData) {
        sceneManager.updateAudioData(message.audioData);
    }
});
function render() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    sceneManager.renderScene();
    requestAnimationFrame(render);
};
render();

