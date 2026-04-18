import type { SetSceneEvent } from '@/src/scene/events/setSceneEvent';
import type { SetSceneSettingsEvent } from '@/src/scene/events/setSceneSettingsEvent';
import type { IScene } from '@/src/scene/scene';
import { SceneManager } from '@/src/scene/sceneManager';
import { sceneRegistry } from '@/src/scene/sceneRegistry';
import type { ISceneSetting } from '@/src/scene/sceneSetting';
import { SettingsUserInterface } from '@/src/userInterface/settings/settingsUserInterface';
import { type AudioDataEvent, GenericEvent, messageAction, messageTarget, SetFpsEvent } from '@/src/utils/eventMessage';
import { loadSettings, populateSettingsCache, updateCacheEntry } from '@/src/utils/settings';

// Extend Window interface for sandbox-specific properties
declare global {
    interface Window {
        sandboxEventMessageHolder: MessageEvent<GenericEvent> | null;
    }
}

// Build scene factory map from registry (creates fresh instances on each switch)
const sceneFactoryMap = new Map<string, () => IScene>();
for (const entry of sceneRegistry) {
    sceneFactoryMap.set(entry.sceneName.toString(), entry.createScene);
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

    // Handle settings cache updates from other windows (via storage event)
    if (action === messageAction.updateSettingsCache) {
        const { key, value } = message.data as unknown as { key: string; value: string | null };
        updateCacheEntry(key, value);
        if (key === 'customPresets') {
            settingsUserInterface.onPresetsChanged();
        }
        return;
    }

    // Handle special case for animation window ready event
    if ((target as string) === 'animationWindowReadyEvent') {
        // Populate settings cache from stored settings sent by animation window
        const storedSettings = (message.data as { storedSettings?: Record<string, string> }).storedSettings;
        if (storedSettings) {
            populateSettingsCache(storedSettings);
        }
        showFpsOverlay = loadSettings<boolean>('showFps') ?? false;
        settingsUserInterface.buildScene();
        return;
    }

    // Only process messages targeted at animation
    if (target !== messageTarget.animation) {
        return;
    }

    // Route messages based on action
    switch (action) {
        case messageAction.toggleFullScreen: {
            if (!window.sandboxEventMessageHolder?.source) break;
            const fullScreenEventMessage = new GenericEvent(messageTarget.animation, messageAction.toggleFullScreen);
            window.sandboxEventMessageHolder.source.postMessage(fullScreenEventMessage.toMessage(), {
                targetOrigin: window.sandboxEventMessageHolder.origin,
            });
            break;
        }

        case messageAction.setScene: {
            const setSceneMessage = message as MessageEvent<SetSceneEvent>;
            const createScene = sceneFactoryMap.get(setSceneMessage.data.sceneName);
            if (createScene) {
                sceneManager.setScene(createScene(), setSceneMessage.data.sceneSettings);
            }
            break;
        }

        case messageAction.setSceneSettings: {
            const setSceneSettingsMessage = message as MessageEvent<SetSceneSettingsEvent>;
            sceneManager.updateSettings(setSceneSettingsMessage.data.sceneSettings);
            break;
        }

        case messageAction.updateAudioData: {
            const audioDataMessage = message as MessageEvent<AudioDataEvent>;
            sceneManager.updateAudioData(audioDataMessage.data.audioData);
            break;
        }

        case messageAction.openSettingsWindow:
            settingsUserInterface.destroy();
            break;

        case messageAction.closeSettingsWindow:
            settingsUserInterface.buildScene();
            break;

        case messageAction.showFpsOverlay: {
            const showFpsMessage = message.data as GenericEvent & { value: boolean };
            showFpsOverlay = showFpsMessage.value;
            break;
        }
    }
});

// Custom event listeners (for events dispatched via CustomEvent, not postMessage)
window.addEventListener(messageAction.toggleFullScreen, (_event) => {
    if (!window.sandboxEventMessageHolder?.source) return;

    const toggleFullScreenViaOffscreen = new GenericEvent(messageTarget.offscreen, messageAction.toggleFullScreen);

    window.sandboxEventMessageHolder.source.postMessage(toggleFullScreenViaOffscreen.toMessage(), {
        targetOrigin: window.sandboxEventMessageHolder.origin,
    });
});

window.addEventListener(messageAction.setScene, (event) => {
    const customEvent = event as CustomEvent<{ event: SetSceneEvent }>;
    const sceneEvent = customEvent.detail.event;
    const createScene = sceneFactoryMap.get(sceneEvent.sceneName);
    if (createScene) {
        sceneManager.setScene(createScene(), sceneEvent.sceneSettings as ISceneSetting);
    }
});

window.addEventListener(messageAction.setSceneSettings, (event) => {
    const customEvent = event as CustomEvent<{ event: SetSceneSettingsEvent }>;
    const sceneSettingsEvent = customEvent.detail.event;
    sceneManager.updateSettings(sceneSettingsEvent.sceneSettings);
});
window.addEventListener(messageAction.showFpsOverlay, (event) => {
    const customEvent = event as CustomEvent<{ event: GenericEvent; value: boolean }>;
    showFpsOverlay = customEvent.detail.value;
});

// Forward preset cycle notifications to the settings window (for external UI)
window.addEventListener('butterchurn-preset-cycled', (event) => {
    const preset = (event as CustomEvent<string>).detail;
    if (window.sandboxEventMessageHolder?.source) {
        window.sandboxEventMessageHolder.source.postMessage(
            { target: messageTarget.settings, action: 'butterchurn-preset-cycled', preset },
            { targetOrigin: window.sandboxEventMessageHolder.origin },
        );
    }
});

// FPS overlay state
let showFpsOverlay = false;
let currentFps = 0;
let cachedFpsOverlay: HTMLElement | null = null;

function updateFpsOverlay() {
    if (showFpsOverlay) {
        if (!cachedFpsOverlay) {
            cachedFpsOverlay = document.createElement('div');
            cachedFpsOverlay.id = 'fps-overlay';
            cachedFpsOverlay.style.cssText =
                'position:fixed;top:8px;left:8px;z-index:999999;color:#00ff00;font-family:monospace;font-size:14px;background:rgba(0,0,0,0.5);padding:4px 8px;border-radius:4px;pointer-events:none;';
            document.body.appendChild(cachedFpsOverlay);
        }
        cachedFpsOverlay.textContent = `${currentFps} FPS`;
    } else if (cachedFpsOverlay) {
        cachedFpsOverlay.remove();
        cachedFpsOverlay = null;
    }
}

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
    if (frameTime > 0 && frameTime < 100) {
        // Sanity check: frame time should be 0-100ms
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
            currentFps = fps;

            // Clamp FPS to reasonable range (30-120fps)
            const clampedFps = Math.max(30, Math.min(120, fps));

            // Send FPS to offscreen window via animation window (postMessage pattern)
            if (window.sandboxEventMessageHolder?.source) {
                const fpsUpdate = new SetFpsEvent(messageTarget.offscreen, messageAction.setFps, clampedFps);
                window.sandboxEventMessageHolder.source.postMessage(fpsUpdate.toMessage(), {
                    targetOrigin: window.sandboxEventMessageHolder.origin,
                });
            }

            lastFpsUpdate = now;
        } catch (_error) {
            // Don't break the render loop on error
        }
    }

    updateFpsOverlay();
    requestAnimationFrame(render);
}
render();
