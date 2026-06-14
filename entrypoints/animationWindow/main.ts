import type { SetSceneEvent } from '@/src/scene/events/setSceneEvent';
import type { SetSceneSettingsEvent } from '@/src/scene/events/setSceneSettingsEvent';
import type { IScene } from '@/src/scene/scene';
import { SceneManager } from '@/src/scene/sceneManager';
import { sceneRegistry } from '@/src/scene/sceneRegistry';
import type { ISceneSetting } from '@/src/scene/sceneSetting';
import { SettingsUserInterface } from '@/src/userInterface/settings/settingsUserInterface';
import { captureSource, type IAudioDataDto, messageAction, messageTarget, SetFpsEvent } from '@/src/utils/eventMessage';
import { loadSettings, STORAGE_PREFIX, updateCacheEntry } from '@/src/utils/settings';

// Scenes (incl. butterchurn) now render directly in this window. butterchurn 3.x
// compiles its Milkdrop equations to WASM under 'wasm-unsafe-eval', so the old
// sandboxed iframe + cross-frame relay are gone: audio goes offscreen → here in a
// single transfer, and every cross-context reply is sent directly via chrome.runtime.

/** Shape of the messages this window receives over chrome.runtime. */
interface AnimationMessage {
    target?: messageTarget;
    action?: messageAction;
    audioData?: IAudioDataDto;
    sceneName?: string;
    sceneSettings?: ISceneSetting;
    value?: boolean;
    source?: captureSource;
}

/**
 * Offscreen documents are headless and can't display a permission prompt, so
 * microphone permission must be acquired from a visible extension context first.
 * Once granted for the extension origin, it persists and the offscreen document's
 * getUserMedia call succeeds silently. Called only when background requests a mic
 * prime during a warm Tab→Mic restart.
 */
async function runMicrophonePrime() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        for (const track of stream.getTracks()) track.stop();
        chrome.runtime.sendMessage({
            target: messageTarget.background,
            action: messageAction.micPrimeSucceeded,
        });
    } catch (err) {
        // biome-ignore lint/suspicious/noConsole: surface missing mic permission so the user sees it
        console.error(
            'Microphone permission denied. Grant it via chrome://extensions → this extension → Details → Site settings → Microphone → Allow.',
            err,
        );
        try {
            chrome.runtime.sendMessage({
                target: messageTarget.background,
                action: messageAction.primeMicrophoneFailed,
            });
        } catch {
            // Receiving end may not exist
        }
    }
}

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
        document.exitFullscreen();
    }
}

// Build scene factory map from registry (creates fresh instances on each switch)
const sceneFactoryMap = new Map<string, () => IScene>();
for (const entry of sceneRegistry) {
    sceneFactoryMap.set(entry.sceneName.toString(), entry.createScene);
}

const sceneManager = new SceneManager();
let settingsUserInterface = new SettingsUserInterface(false);

// FPS overlay state
let showFpsOverlay = false;
let currentFps = 0;
let cachedFpsOverlay: HTMLElement | null = null;

// Incoming cross-context messages (audio from offscreen, scene/settings/control
// from background + the external settings window). Filter to this window's target;
// the runtime bus also carries background/offscreen/settings traffic.
chrome.runtime.onMessage.addListener((message: AnimationMessage) => {
    if (message.target !== messageTarget.animation) {
        return;
    }

    switch (message.action) {
        case messageAction.updateAudioData: {
            if (message.audioData) sceneManager.updateAudioData(message.audioData);
            break;
        }
        case messageAction.setScene: {
            const createScene = message.sceneName ? sceneFactoryMap.get(message.sceneName) : undefined;
            if (createScene) {
                sceneManager.setScene(createScene(), message.sceneSettings ?? {});
            }
            break;
        }
        case messageAction.setSceneSettings: {
            if (message.sceneSettings) sceneManager.updateSettings(message.sceneSettings);
            break;
        }
        case messageAction.toggleFullScreen: {
            toggleFullScreen();
            break;
        }
        case messageAction.openSettingsWindow: {
            settingsUserInterface.destroy();
            break;
        }
        case messageAction.closeSettingsWindow: {
            const initialSource =
                message.source === captureSource.microphone ? captureSource.microphone : captureSource.tab;
            settingsUserInterface = new SettingsUserInterface(false, initialSource);
            settingsUserInterface.buildScene();
            break;
        }
        case messageAction.showFpsOverlay: {
            showFpsOverlay = message.value ?? false;
            break;
        }
        case messageAction.primeMicrophone: {
            runMicrophonePrime();
            break;
        }
    }
});

// In-window CustomEvents from the embedded dat.gui (SettingsUserInterface(false)).
// Scene/settings changes stay in-window; cross-context replies go via chrome.runtime.
window.addEventListener(messageAction.setScene, (event) => {
    const sceneEvent = (event as CustomEvent<{ event: SetSceneEvent }>).detail.event;
    const createScene = sceneFactoryMap.get(sceneEvent.sceneName);
    if (createScene) {
        sceneManager.setScene(createScene(), sceneEvent.sceneSettings as ISceneSetting);
    }
});

window.addEventListener(messageAction.setSceneSettings, (event) => {
    const sceneSettingsEvent = (event as CustomEvent<{ event: SetSceneSettingsEvent }>).detail.event;
    sceneManager.updateSettings(sceneSettingsEvent.sceneSettings);
});

window.addEventListener(messageAction.showFpsOverlay, (event) => {
    showFpsOverlay = (event as CustomEvent<{ value: boolean }>).detail.value;
});

window.addEventListener(messageAction.toggleFullScreen, () => {
    toggleFullScreen();
});

// Notify the external settings window when butterchurn auto-cycles its preset so
// its dropdown stays in sync. (The embedded UI already mirrors via its own listener.)
window.addEventListener('butterchurn-preset-cycled', (event) => {
    const preset = (event as CustomEvent<string>).detail;
    try {
        chrome.runtime.sendMessage({
            target: messageTarget.settings,
            action: 'butterchurn-preset-cycled',
            preset,
        });
    } catch {
        // Receiving end (settings window) may not exist
    }
});

// This window now owns localStorage directly. When the external settings window (a
// separate same-origin page) writes settings, a `storage` event fires here: refresh
// the in-memory cache and, for custom presets, rebuild the embedded scene selector.
window.addEventListener('storage', (e) => {
    if (!e.key?.startsWith(STORAGE_PREFIX)) return;
    const settingsName = e.key.slice(STORAGE_PREFIX.length);
    updateCacheEntry(settingsName, e.newValue);
    if (settingsName === 'customPresets') {
        settingsUserInterface.onPresetsChanged();
    }
});

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

    // Send FPS update every 2 seconds (≥30 samples) so offscreen can match capture rate
    const now = Date.now();
    if (now - lastFpsUpdate >= FPS_UPDATE_INTERVAL && frameTimes.length >= 30) {
        try {
            // Calculate average frame time from recent frames
            const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
            const fps = Math.round(1000 / avgFrameTime);
            currentFps = fps;

            // Clamp FPS to reasonable range (30-120fps)
            const clampedFps = Math.max(30, Math.min(120, fps));

            const fpsUpdate = new SetFpsEvent(messageTarget.offscreen, messageAction.setFps, clampedFps);
            chrome.runtime.sendMessage(fpsUpdate.toMessage());

            lastFpsUpdate = now;
        } catch (_error) {
            // Don't break the render loop on error (e.g. offscreen not listening)
        }
    }

    updateFpsOverlay();
    requestAnimationFrame(render);
}

// localStorage is directly readable here now (no animation-ready handshake), so
// initialize overlay state and build the embedded UI immediately on load.
showFpsOverlay = loadSettings<boolean>('showFps') ?? false;
settingsUserInterface.buildScene();
render();
