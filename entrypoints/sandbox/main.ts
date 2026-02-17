import {
    messageAction,
    messageTarget,
    AudioDataEvent,
    GenericEvent,
    SetFpsEvent,
} from '@/src/utils/eventMessage';
import { IScene } from '@/src/scene/scene';
import { SceneManager } from '@/src/scene/sceneManager';
import { ISceneSetting } from '@/src/scene/sceneSetting';
import { SetSceneEvent } from '@/src/scene/events/setSceneEvent';
import { SetSceneSettingsEvent } from '@/src/scene/events/setSceneSettingsEvent';
import { SettingsUserInterface } from '@/src/userInterface/settings/settingsUserInterface';
import { sceneRegistry } from '@/src/scene/sceneRegistry';

// Extend Window interface for sandbox-specific properties
declare global {
    interface Window {
        sandboxEventMessageHolder: MessageEvent<GenericEvent> | null;
    }
}

// Initialize scenes from registry
const scenesMap = new Map<string, IScene>();
for (const entry of sceneRegistry) {
    scenesMap.set(entry.sceneName.toString(), entry.createScene());
}
// Initialize scene manager
const sceneManager = new SceneManager();
window.sandboxEventMessageHolder = null;

// Initialize settings UI
const settingsUserInterface = new SettingsUserInterface(false);

// Consolidated message listener - handles all postMessage events
window.addEventListener('message', (message: MessageEvent<GenericEvent>) => {
    // Store message for potential reply (used by custom event listeners)
    window.sandboxEventMessageHolder = message;

    const { target, action } = message.data;

    // Handle special case for animation window ready event
    if ((target as string) === 'animationWindowReadyEvent') {
        settingsUserInterface.buildScene();
        return;
    }

    // Only process messages targeted at animation
    if (target !== messageTarget.animation) {
        return;
    }

    // Route messages based on action
    switch (action) {
        case messageAction.toggleFullScreen:
            if (!window.sandboxEventMessageHolder?.source) break;
            const fullScreenEventMessage = new GenericEvent(
                messageTarget.animation,
                messageAction.toggleFullScreen
            );
            window.sandboxEventMessageHolder.source.postMessage(
                fullScreenEventMessage.toMessage(),
                { targetOrigin: window.sandboxEventMessageHolder.origin }
            );
            break;

        case messageAction.setScene:
            const setSceneMessage = message as MessageEvent<SetSceneEvent>;
            const setSceneInstance = scenesMap.get(setSceneMessage.data.sceneName);
            if (setSceneInstance) {
                sceneManager.setScene(setSceneInstance, setSceneMessage.data.sceneSettings);
            }
            break;

        case messageAction.setSceneSettings:
            const setSceneSettingsMessage = message as MessageEvent<SetSceneSettingsEvent>;
            sceneManager.updateSettings(setSceneSettingsMessage.data.sceneSettings);
            break;

        case messageAction.updateAudioData:
            const audioDataMessage = message as MessageEvent<AudioDataEvent>;
            sceneManager.updateAudioData(audioDataMessage.data.audioData);
            break;

        case messageAction.openSettingsWindow:
            settingsUserInterface.destroy();
            break;

        case messageAction.closeSettingsWindow:
            settingsUserInterface.buildScene();
            break;
    }
});

// Custom event listeners (for events dispatched via CustomEvent, not postMessage)
window.addEventListener(messageAction.toggleFullScreen, (event) => {
    if (!window.sandboxEventMessageHolder?.source) return;
    
    const toggleFullScreenViaOffscreen = new GenericEvent(
        messageTarget.offscreen,
        messageAction.toggleFullScreen
    );

    window.sandboxEventMessageHolder.source.postMessage(
        toggleFullScreenViaOffscreen.toMessage(),
        { targetOrigin: window.sandboxEventMessageHolder.origin }
    );
});

window.addEventListener(messageAction.setScene, (event) => {
    const customEvent = event as CustomEvent<{ event: SetSceneEvent }>;
    const sceneEvent = customEvent.detail.event;
    const customSceneInstance = scenesMap.get(sceneEvent.sceneName);
    if (customSceneInstance) {
        sceneManager.setScene(customSceneInstance, sceneEvent.sceneSettings as ISceneSetting);
    }
});

window.addEventListener(messageAction.setSceneSettings, (event) => {
    const customEvent = event as CustomEvent<{ event: SetSceneSettingsEvent }>;
    const sceneSettingsEvent = customEvent.detail.event;
    sceneManager.updateSettings(sceneSettingsEvent.sceneSettings);
});
// FPS measurement for dynamic audio capture rate
let lastFrameTime = performance.now();
let lastFpsUpdate = Date.now();
const frameTimes: number[] = [];
const FPS_UPDATE_INTERVAL = 2000; // Update every 2 seconds
const MAX_FRAME_SAMPLES = 120; // Keep last 120 frames for averaging

function render() {
    const currentFrameTime = performance.now();
    sceneManager.renderScene();
    
    // Measure actual frame time (time between frames, not render time)
    const frameTime = currentFrameTime - lastFrameTime;
    lastFrameTime = currentFrameTime;
    
    // Track frame times (skip first frame which might be inaccurate)
    if (frameTime > 0 && frameTime < 100) { // Sanity check: frame time should be 0-100ms
        frameTimes.push(frameTime);
        if (frameTimes.length > MAX_FRAME_SAMPLES) {
            frameTimes.shift();
        }
    }
    
    // Send FPS update every 2 seconds
    const now = Date.now();
    if (now - lastFpsUpdate >= FPS_UPDATE_INTERVAL && frameTimes.length >= 30) {
        try {
            // Calculate average frame time from recent frames
            const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
            const fps = Math.round(1000 / avgFrameTime);
            
            // Clamp FPS to reasonable range (30-120fps)
            const clampedFps = Math.max(30, Math.min(120, fps));
            
            // Send FPS to offscreen window via animation window (postMessage pattern)
            if (window.sandboxEventMessageHolder?.source) {
                const fpsUpdate = new SetFpsEvent(
                    messageTarget.offscreen,
                    messageAction.setFps,
                    clampedFps
                );
                window.sandboxEventMessageHolder.source.postMessage(
                    fpsUpdate.toMessage(),
                    { targetOrigin: window.sandboxEventMessageHolder.origin }
                );
            }
            
            lastFpsUpdate = now;
        } catch (error) {
            console.error('Error sending FPS update:', error);
            // Don't break the render loop on error
        }
    }
    
    requestAnimationFrame(render);
}
render();
