import {
    messageAction,
    messageTarget,
    AudioDataEvent,
    GenericEvent,
    SetFpsEvent,
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
import { DancingCubes3DSinus } from '@/src/scene/scenes/dancingCubes3DSinus/dancingCubes3DSinus';
import { WormScene } from '@/src/scene/scenes/wormScene/wormScene';
import { Dancing3DCubes } from '@/src/scene/scenes/dancing3DCubes/dancing3DCubes';
import { RoundSpectrum } from '@/src/scene/scenes/roundSpectrum/roundSpectrum';
import { SeventiesScene } from '@/src/scene/scenes/seventiesScene/seventiesScene';
import { ParticleCircle } from '@/src/scene/scenes/particleCircle/particleCircle';
import { PsychedelicCube } from '@/src/scene/scenes/psychedelicCube/psychedelicCube';
import { PulsingGrid } from '@/src/scene/scenes/pulsingGrid/pulsingGrid';
import { AudioTerrain } from '@/src/scene/scenes/audioTerrain/audioTerrain';
import { CircleBurst } from '@/src/scene/scenes/circleBurst/circleBurst';
import { PaintSplash } from '@/src/scene/scenes/paintSplash/paintSplash';
import { HexagonPulse } from '@/src/scene/scenes/hexagonPulse/hexagonPulse';
import { OrbitalRing } from '@/src/scene/scenes/orbitalRing/orbitalRing';
import { NeuralWeb } from '@/src/scene/scenes/neuralWeb/neuralWeb';
import { FloatingCubes } from '@/src/scene/scenes/floatingCubes/floatingCubes';
import { ChromaWave } from '@/src/scene/scenes/chromaWave/chromaWave';

// Extend Window interface for sandbox-specific properties
declare global {
    interface Window {
        sandboxEventMessageHolder: MessageEvent<GenericEvent> | null;
    }
}

// Initialize scenes
const scenesMap = new Map<string, IScene>();
scenesMap.set(sceneNames.Butterchurn.toString(), new Butterchurn());
scenesMap.set(sceneNames.SunFlower.toString(), new SunFlower());
scenesMap.set(sceneNames.FrostFire.toString(), new FrostFire());
scenesMap.set(sceneNames.SynthBars.toString(), new SynthBars());
scenesMap.set(sceneNames.DancingHorizon.toString(), new DancingHorizon());
scenesMap.set(sceneNames.DancingCubes3DSinus.toString(), new DancingCubes3DSinus());
scenesMap.set(sceneNames.WormScene.toString(), new WormScene());
scenesMap.set(sceneNames.Dancing3DCubes.toString(), new Dancing3DCubes());
scenesMap.set(sceneNames.RoundSpectrum.toString(), new RoundSpectrum());
scenesMap.set(sceneNames.SeventiesScene.toString(), new SeventiesScene());
scenesMap.set(sceneNames.ParticleCircle.toString(), new ParticleCircle());
scenesMap.set(sceneNames.PsychedelicCube.toString(), new PsychedelicCube());
scenesMap.set(sceneNames.PulsingGrid.toString(), new PulsingGrid());
scenesMap.set(sceneNames.AudioTerrain.toString(), new AudioTerrain());
scenesMap.set(sceneNames.CircleBurst.toString(), new CircleBurst());
scenesMap.set(sceneNames.PaintSplash.toString(), new PaintSplash());
scenesMap.set(sceneNames.HexagonPulse.toString(), new HexagonPulse());
scenesMap.set(sceneNames.OrbitalRing.toString(), new OrbitalRing());
scenesMap.set(sceneNames.NeuralWeb.toString(), new NeuralWeb());
scenesMap.set(sceneNames.FloatingCubes.toString(), new FloatingCubes());
scenesMap.set(sceneNames.ChromaWave.toString(), new ChromaWave());
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
        console.log('animationWindowReadyEvent');
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
            sceneManager.setScene(
                scenesMap.get(setSceneMessage.data.sceneName) as IScene,
                setSceneMessage.data.sceneSettings
            );
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
    sceneManager.setScene(
        scenesMap.get(sceneEvent.sceneName) as IScene,
        sceneEvent.sceneSettings as ISceneSetting
    );
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
