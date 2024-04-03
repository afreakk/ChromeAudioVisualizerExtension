import { messageAction, GenericEvent, messageTarget, AudioDataEvent } from '@/utils/eventMessage';
import { Scene } from '@/entrypoints/animation/scene/scene';
import { SceneManager } from '@/entrypoints/animation/scene/sceneManager';
import { SunFlowerScene } from '@/entrypoints/animation/scene/scenes/sunflower';
import { SynthBars } from '@/entrypoints/animation/scene/scenes/synthBars';
import { DancingHorizon } from '@/entrypoints/animation/scene/scenes/dancingHorizon';

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
scenesMap.set("Sunflower", new SunFlowerScene(canvas));
scenesMap.set("SynthBars", new SynthBars(canvas));
scenesMap.set("DancingHorizon", new DancingHorizon(canvas));
const firstSceneName = scenesMap.keys().next().value;
const sidebar = document.getElementById("sidebar");
sidebar.innerHTML = '';

scenesMap.forEach((value, key) => {
    // Create a new link element
    const link = document.createElement("a");
    link.href = "#"; // Set href according to your needs
    link.className = "nav-link text-white";
    if (key === firstSceneName) {
        link.className += " active";
    }
    link.textContent = key; // Set the text content to the scene name

    // Create a list item and append the link to it
    const listItem = document.createElement("li");
    listItem.className = "nav-item";
    listItem.appendChild(link);

    // Append the list item to the sidebar
    sidebar.appendChild(listItem);

    // Add click event listener to make it interactive
    link.addEventListener("click", function() {
        var current = document.getElementsByClassName("active");

        // If there's no active class
        if (current.length > 0) {
            current[0].className = current[0].className.replace(" active", "");
        }

        // Add the active class to the current/clicked link
        this.className += " active";
        sceneManager.setScene(scenesMap.get(key) as Scene);
    });
});
let firstScene = scenesMap.get(firstSceneName) as Scene;
const sceneManager = new SceneManager(firstScene);


chrome.runtime.onMessage.addListener((message: AudioDataEvent, sender, sendResponse) => {
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

