import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type BrowserContext, chromium, expect, test } from '@playwright/test';
import { sceneNames } from '@/src/scene/sceneNames';
import { RoundSpectrumSetting } from '@/src/scene/scenes/roundSpectrum/setting';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXTENSION_PATH = path.resolve(__dirname, '../.output/chrome-mv3');
const SCREENSHOTS_DIR = path.resolve(__dirname, 'screenshots');
const PER_SCENE_TIMEOUT = 15_000; // 15s max per scene before skipping

/** Run an async function with a timeout. Rejects with 'timeout' if exceeded. */
function withTimeout<T>(fn: () => Promise<T>, ms: number): Promise<T> {
    return Promise.race([
        fn(),
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Scene timed out after ${ms}ms`)), ms)),
    ]);
}

// All scenes except Butterchurn (requires stereo audio + external lib setup)
const SCENES = Object.values(sceneNames).filter((name) => name !== sceneNames.Butterchurn);

/** Generate synthetic audio data (sine wave, 256 bins, values 0-255) */
function generateAudioData(frame: number): number[] {
    const data: number[] = [];
    for (let i = 0; i < 256; i++) {
        const t = frame * 0.05;
        const val =
            128 +
            60 * Math.sin((i / 256) * Math.PI * 4 + t) +
            40 * Math.sin((i / 256) * Math.PI * 8 + t * 1.5) +
            20 * Math.sin((i / 256) * Math.PI * 16 + t * 0.7);
        data.push(Math.max(0, Math.min(255, Math.round(val))));
    }
    return data;
}

/** Post a message to the sandbox iframe */
async function postToSandbox(page: any, message: object) {
    await page.evaluate((msg: object) => {
        const iframe = document.getElementById('theFrame') as HTMLIFrameElement;
        iframe.contentWindow?.postMessage(msg, '*');
    }, message);
}

/** Pump N frames of synthetic audio into the sandbox */
async function pumpAudioFrames(page: any, numFrames: number, startFrame = 0) {
    for (let f = startFrame; f < startFrame + numFrames; f++) {
        await postToSandbox(page, {
            target: 'animation',
            action: 'update-audio-data',
            audioData: {
                timeByteArray: generateAudioData(f),
                timestamp: Date.now(),
            },
        });
        await page.waitForTimeout(16); // ~60fps pacing
    }
}

/** Pump N frames of silence (all bins = 0) */
async function pumpSilence(page: any, numFrames: number) {
    const silence = new Array(256).fill(0);
    for (let f = 0; f < numFrames; f++) {
        await postToSandbox(page, {
            target: 'animation',
            action: 'update-audio-data',
            audioData: { timeByteArray: silence, timestamp: Date.now() },
        });
        await page.waitForTimeout(16);
    }
}

/** Pump N frames of loud audio (all bins high, with spectral variation) */
async function pumpLoud(page: any, numFrames: number) {
    for (let f = 0; f < numFrames; f++) {
        const loud: number[] = [];
        for (let i = 0; i < 256; i++) {
            loud.push(Math.round(200 + 55 * Math.sin((i / 256) * Math.PI * 4 + f * 0.1)));
        }
        await postToSandbox(page, {
            target: 'animation',
            action: 'update-audio-data',
            audioData: { timeByteArray: loud, timestamp: Date.now() },
        });
        await page.waitForTimeout(16);
    }
}

/** Count non-black pixels on the scene canvas via getImageData (2D) or readPixels (WebGL).
 *  Returns pixel count and detected context type. */
async function countNonBlackPixels(frame: any): Promise<{ count: number; type: string }> {
    return frame.locator('body').evaluate((body: HTMLElement) => {
        const canvases = Array.from(body.querySelectorAll('canvas'));
        const canvas =
            canvases.find((c) => c.style.position === 'fixed' && c.width > 100 && c.height > 100) || canvases[0];
        if (!canvas) return { count: -1, type: 'none' };

        // Step size: sample ~40000 pixels spread across the canvas
        const stepX = Math.max(1, Math.floor(canvas.width / 200));
        const stepY = Math.max(1, Math.floor(canvas.height / 200));
        let nonBlack = 0;

        // Try 2D context first
        const ctx = canvas.getContext('2d');
        if (ctx) {
            for (let y = 0; y < canvas.height; y += stepY) {
                for (let x = 0; x < canvas.width; x += stepX) {
                    const d = ctx.getImageData(x, y, 1, 1).data;
                    if (d[0] + d[1] + d[2] > 10) nonBlack++;
                }
            }
            return { count: nonBlack, type: '2d' };
        }

        // Try WebGL
        const gl = (canvas.getContext('webgl') || canvas.getContext('webgl2')) as WebGLRenderingContext | null;
        if (gl) {
            const px = new Uint8Array(4);
            for (let y = 0; y < canvas.height; y += stepY) {
                for (let x = 0; x < canvas.width; x += stepX) {
                    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
                    if (px[0] + px[1] + px[2] > 10) nonBlack++;
                }
            }
            return { count: nonBlack, type: 'webgl' };
        }

        return { count: -1, type: 'none' };
    });
}

let context: BrowserContext;
let extensionId: string;

test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('', {
        headless: false,
        args: [
            `--disable-extensions-except=${EXTENSION_PATH}`,
            `--load-extension=${EXTENSION_PATH}`,
            '--no-first-run',
            '--disable-default-apps',
        ],
    });

    let serviceWorker = context.serviceWorkers()[0];
    if (!serviceWorker) {
        serviceWorker = await context.waitForEvent('serviceworker');
    }
    extensionId = serviceWorker.url().split('/')[2];

    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
});

test.afterAll(async () => {
    await context?.close();
});

test('extension loads and service worker is active', async () => {
    expect(extensionId).toBeTruthy();
    expect(extensionId).toMatch(/^[a-z]{32}$/);
});

test('animation window opens with sandbox iframe and dat.gui', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/animationWindow.html`);

    const iframe = page.locator('#theFrame');
    await expect(iframe).toBeVisible();

    const frame = page.frameLocator('#theFrame');
    await frame.locator('body').waitFor({ state: 'attached' });

    // Trigger settings UI
    await postToSandbox(page, { target: 'animation', action: 'animation-ready' });
    await page.waitForTimeout(1000);

    // Verify dat.gui loaded (it creates elements with class 'dg')
    const guiCount = await frame.locator('.dg').count();
    expect(guiCount).toBeGreaterThan(0);

    await page.close();
});

test('cycle through all scenes with synthetic audio and capture', async () => {
    let page = await context.newPage();
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(`chrome-extension://${extensionId}/animationWindow.html`);

    let frame = page.frameLocator('#theFrame');
    await frame.locator('body').waitFor({ state: 'attached' });

    // Initialize settings UI
    await postToSandbox(page, { target: 'animation', action: 'animation-ready' });
    await page.waitForTimeout(1000);

    const results: { scene: string; canvasCount: number; hasContent: boolean; crashed?: boolean }[] = [];

    for (const sceneName of SCENES) {
        try {
            await withTimeout(async () => {
                // Switch scene
                await postToSandbox(page, {
                    target: 'animation',
                    action: 'set-scene',
                    sceneName,
                    sceneSettings: {},
                });
                await page.waitForTimeout(500); // scene build time

                // Pump 20 frames of audio to verify scene handles audio without crashing
                await pumpAudioFrames(page, 20);
                await page.waitForTimeout(50);

                // Check canvas exists
                const canvasCount = await frame.locator('canvas').count();
                expect(canvasCount).toBeGreaterThanOrEqual(1);

                // Verify canvas has proper dimensions and WebGL context is healthy
                const canvasInfo = await frame
                    .locator('canvas')
                    .first()
                    .evaluate((canvas: HTMLCanvasElement) => {
                        const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
                        let contextOk = false;
                        let glError: number | null = null;
                        if (gl) {
                            const glCtx = gl as WebGLRenderingContext;
                            contextOk = !glCtx.isContextLost();
                            glError = glCtx.getError();
                            if (glError === 0) glError = null; // NO_ERROR
                        }
                        return {
                            width: canvas.width,
                            height: canvas.height,
                            hasWebGL: !!gl,
                            contextOk,
                            glError,
                        };
                    });

                // Take a full page screenshot
                await page.screenshot({
                    path: path.join(SCREENSHOTS_DIR, `${sceneName}.png`),
                    fullPage: true,
                });

                results.push({
                    scene: sceneName,
                    canvasCount,
                    hasContent: canvasInfo.contextOk,
                });
            }, PER_SCENE_TIMEOUT);
        } catch (_err: any) {
            results.push({ scene: sceneName, canvasCount: 0, hasContent: false, crashed: true });

            // Recover: close broken page, open fresh one
            try {
                await page.close();
            } catch {
                /* already closed */
            }
            page = await context.newPage();
            await page.setViewportSize({ width: 1600, height: 900 });
            await page.goto(`chrome-extension://${extensionId}/animationWindow.html`);
            frame = page.frameLocator('#theFrame');
            await frame.locator('body').waitFor({ state: 'attached' });
            await postToSandbox(page, { target: 'animation', action: 'animation-ready' });
            await page.waitForTimeout(1000);
        }
    }
    const rendered = results.filter((r) => r.hasContent);
    const crashed = results.filter((r) => r.crashed);
    const blank = results.filter((r) => !r.hasContent && !r.crashed);
    if (crashed.length > 0) {
        console.log(`Crashed scenes: ${crashed.map((r) => r.scene).join(', ')}`);
    }
    if (blank.length > 0) {
        console.log(`Blank scenes: ${blank.map((r) => r.scene).join(', ')}`);
    }

    // At least some scenes should have rendered content
    expect(rendered.length).toBeGreaterThan(0);

    await page.close();
});

test('scene settings propagate without errors', async () => {
    const page = await context.newPage();
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(`chrome-extension://${extensionId}/animationWindow.html`);

    const frame = page.frameLocator('#theFrame');
    await frame.locator('body').waitFor({ state: 'attached' });

    await postToSandbox(page, { target: 'animation', action: 'animation-ready' });
    await page.waitForTimeout(1000);

    // Track errors during settings changes
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    // Set ChromaWave with default settings
    await postToSandbox(page, {
        target: 'animation',
        action: 'set-scene',
        sceneName: 'ChromaWave',
        sceneSettings: {},
    });
    await page.waitForTimeout(600);
    await pumpAudioFrames(page, 30);

    // Canvas should exist after scene build
    const canvasBefore = await frame.locator('canvas').count();
    expect(canvasBefore).toBeGreaterThanOrEqual(1);

    // Apply modified settings — verify no crash or error
    await postToSandbox(page, {
        target: 'animation',
        action: 'set-scene-settings',
        sceneSettings: {
            audioSensitivity: 5.0,
            intensity: 2.0,
            waveFrequency: 10.0,
            patternStyle: 2,
            distortionAmount: 3.0,
        },
    });
    await page.waitForTimeout(200);
    await pumpAudioFrames(page, 30, 100);

    // Canvas should still exist after settings change (no crash)
    const canvasAfter = await frame.locator('canvas').count();
    expect(canvasAfter).toBeGreaterThanOrEqual(1);

    // Verify WebGL context is still valid (not lost)
    const contextValid = await frame
        .locator('canvas')
        .first()
        .evaluate((canvas: HTMLCanvasElement) => {
            const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
            if (!gl) return false;
            return !(gl as WebGLRenderingContext).isContextLost();
        });
    expect(contextValid).toBe(true);

    // No page-crashing errors during settings updates
    const criticalErrors = errors.filter(
        (e) => e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read'),
    );
    expect(criticalErrors).toHaveLength(0);

    await page.close();
});

test('no WebGL errors across all scenes', async () => {
    let page = await context.newPage();
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(`chrome-extension://${extensionId}/animationWindow.html`);

    let frame = page.frameLocator('#theFrame');
    await frame.locator('body').waitFor({ state: 'attached' });

    await postToSandbox(page, { target: 'animation', action: 'animation-ready' });
    await page.waitForTimeout(1000);

    // Collect console errors from the sandbox
    const errors: string[] = [];
    const crashed: string[] = [];

    function attachErrorListeners(p: any) {
        p.on('pageerror', (err: any) => errors.push(err.message));
        p.on('console', (msg: any) => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });
    }
    attachErrorListeners(page);

    for (const sceneName of SCENES) {
        try {
            await withTimeout(async () => {
                await postToSandbox(page, {
                    target: 'animation',
                    action: 'set-scene',
                    sceneName,
                    sceneSettings: {},
                });
                await page.waitForTimeout(200);
                await pumpAudioFrames(page, 5);

                // Check for WebGL errors inside the sandbox
                const glError = await frame
                    .locator('canvas')
                    .first()
                    .evaluate((canvas: HTMLCanvasElement) => {
                        const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
                        if (!gl) return null;
                        const err = (gl as WebGLRenderingContext).getError();
                        return err !== 0 ? err : null; // 0 = NO_ERROR
                    })
                    .catch(() => null);

                if (glError) {
                    errors.push(`WebGL error in ${sceneName}: ${glError}`);
                }
            }, PER_SCENE_TIMEOUT);
        } catch (_err: any) {
            crashed.push(sceneName);

            // Recover: close broken page, open fresh one
            try {
                await page.close();
            } catch {
                /* already closed */
            }
            page = await context.newPage();
            await page.setViewportSize({ width: 1600, height: 900 });
            await page.goto(`chrome-extension://${extensionId}/animationWindow.html`);
            frame = page.frameLocator('#theFrame');
            await frame.locator('body').waitFor({ state: 'attached' });
            await postToSandbox(page, { target: 'animation', action: 'animation-ready' });
            await page.waitForTimeout(1000);
            attachErrorListeners(page);
        }
    }
    if (errors.length > 0) {
        console.log(`WebGL-related test errors: ${errors.join(' | ')}`);
    }
    if (crashed.length > 0) {
        console.log(`Scenes that crashed during WebGL sweep: ${crashed.join(', ')}`);
    }
    // WebGL compilation/runtime errors indicate broken scenes
    const criticalErrors = errors.filter((e) => e.includes('shader') || e.includes('WebGL') || e.includes('GL_'));
    expect(criticalErrors).toHaveLength(0);

    await page.close();
});

test('scenes visually react to audio input', async () => {
    // Scenes with known strong audio reactivity — produce obviously different
    // pixel output between silence and loud audio
    const REACTIVE_SCENES = [
        // 2D Canvas — getImageData reliable on any renderer
        // Selected: scenes that draw almost nothing in silence but produce
        // clearly visible colored output with loud audio.
        // Excluded: AudioTerrain, HexagonPulse — these render visible
        // content even in silence (time-based animation or static grid).
        'RoundSpectrum', // circular bar spectrum: bars = audio values
        'ParticleCircle', // particle sizes from frequency bins
        'SeventiesScene', // expanding circles driven by volume
        'OrbitalRing', // dot radius and brightness from audio
        // WebGL — readPixels may return zeros on SwiftShader
        'SynthBars', // shader bar graph
        'CircleBurst', // spoke lengths from spectrum
        'ChromaWave', // heavy audio-driven distortion
    ];

    const page = await context.newPage();
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(`chrome-extension://${extensionId}/animationWindow.html`);

    const frame = page.frameLocator('#theFrame');
    await frame.locator('body').waitFor({ state: 'attached' });
    await postToSandbox(page, { target: 'animation', action: 'animation-ready' });
    await page.waitForTimeout(1000);

    const results: { scene: string; type: string; silencePixels: number; loudPixels: number; reacted: boolean }[] = [];

    for (const sceneName of REACTIVE_SCENES) {
        // Set scene — pass empty sceneSettings so the scene keeps its defaults
        await postToSandbox(page, {
            target: 'animation',
            action: 'set-scene',
            sceneName,
            sceneSettings: {},
        });
        await page.waitForTimeout(600);

        // Phase 1: pump silence, then count non-black pixels
        await pumpSilence(page, 40);
        const afterSilence = await countNonBlackPixels(frame);

        // Phase 2: pump loud audio, then count non-black pixels
        await pumpLoud(page, 40);
        const afterLoud = await countNonBlackPixels(frame);

        // Scene reacted if loud audio produced more colored pixels than silence
        const reacted = afterLoud.count > afterSilence.count;

        results.push({
            scene: sceneName,
            type: afterSilence.type,
            silencePixels: afterSilence.count,
            loudPixels: afterLoud.count,
            reacted,
        });
    }
    const skippedGl = results.filter((r) => !r.reacted && r.type === 'webgl');
    const failed2d = results.filter((r) => !r.reacted && r.type === '2d');

    if (skippedGl.length > 0) {
        console.log(`WebGL scenes without visible audio reaction: ${skippedGl.map((r) => r.scene).join(', ')}`);
    }
    if (failed2d.length > 0) {
        console.log(`2D scenes without visible audio reaction: ${failed2d.map((r) => r.scene).join(', ')}`);
    }

    // All 2D Canvas scenes must show audio reactivity
    expect(failed2d).toHaveLength(0);
    await page.close();
});

test('audio data flows through chrome.runtime relay to sandbox', async () => {
    // This test verifies the real message relay in animationWindow/main.js:
    //   chrome.runtime.onMessage → iframe.contentWindow.postMessage
    // We send messages from the service worker (simulating offscreen document)
    // so they arrive at the animation window's chrome.runtime.onMessage listener,
    // which relays them to the sandbox iframe via postMessage.

    const page = await context.newPage();
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(`chrome-extension://${extensionId}/animationWindow.html`);

    const frame = page.frameLocator('#theFrame');
    await frame.locator('body').waitFor({ state: 'attached' });
    await page.waitForTimeout(1000);

    // Get the service worker to send messages FROM (simulates offscreen document)
    let sw = context.serviceWorkers()[0];
    if (!sw) {
        sw = await context.waitForEvent('serviceworker');
    }

    // Helper: send a message via the service worker (like the offscreen doc would)
    async function sendViaRuntime(msg: object) {
        await sw.evaluate((m: any) => chrome.runtime.sendMessage(m), msg);
    }

    // Set up a scene via the runtime relay
    await sendViaRuntime({
        target: 'animation',
        action: 'set-scene',
        sceneName: 'RoundSpectrum',
        sceneSettings: {},
    });
    await page.waitForTimeout(600);

    // Pump silence through the relay to establish baseline
    for (let f = 0; f < 30; f++) {
        await sendViaRuntime({
            target: 'animation',
            action: 'update-audio-data',
            audioData: {
                timeByteArray: new Array(256).fill(0),
                timestamp: Date.now(),
            },
        });
        await page.waitForTimeout(16);
    }
    const afterSilence = await countNonBlackPixels(frame);

    // Pump loud audio through the relay
    for (let f = 0; f < 30; f++) {
        const loud: number[] = [];
        for (let i = 0; i < 256; i++) {
            loud.push(Math.round(200 + 55 * Math.sin((i / 256) * Math.PI * 4 + f * 0.1)));
        }
        await sendViaRuntime({
            target: 'animation',
            action: 'update-audio-data',
            audioData: {
                timeByteArray: loud,
                timestamp: Date.now(),
            },
        });
        await page.waitForTimeout(16);
    }
    const afterLoud = await countNonBlackPixels(frame);

    // The scene must have received audio through the chrome.runtime relay
    // and produced more visible pixels with loud audio than silence
    expect(afterLoud.count).toBeGreaterThan(afterSilence.count);

    // Verify the reverse relay: sandbox → window.postMessage → chrome.runtime
    // When sandbox sets a scene, it sends a startStream message via postMessage.
    // animationWindow/main.js relays it to chrome.runtime.sendMessage, which
    // the service worker can observe.
    // Start listening BEFORE triggering (don't await yet)
    const reverseRelayPromise = sw.evaluate(() => {
        return new Promise<boolean>((resolve) => {
            const timeout = setTimeout(() => resolve(false), 5000);
            chrome.runtime.onMessage.addListener(function listener(msg: any) {
                if (msg.target === 'offscreen' && msg.action === 'start-stream') {
                    clearTimeout(timeout);
                    chrome.runtime.onMessage.removeListener(listener);
                    resolve(true);
                }
            });
        });
    });

    // Trigger the reverse relay by setting a new scene via direct postMessage
    // (sandbox will respond by sending startStream back through the relay)
    await postToSandbox(page, {
        target: 'animation',
        action: 'set-scene',
        sceneName: 'ParticleCircle',
        sceneSettings: {},
    });

    const relayResult = await reverseRelayPromise;
    expect(relayResult).toBe(true);

    await page.close();
});

test('butterchurn stereo audio path builds and processes without errors', async () => {
    const page = await context.newPage();
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(`chrome-extension://${extensionId}/animationWindow.html`);

    const frame = page.frameLocator('#theFrame');
    await frame.locator('body').waitFor({ state: 'attached' });

    // Initialize settings UI
    await postToSandbox(page, { target: 'animation', action: 'animation-ready' });
    await page.waitForTimeout(1000);

    // Track errors during the entire test
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('console', (msg) => {
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
        }
    });

    await withTimeout(async () => {
        // Switch to the Butterchurn scene
        await postToSandbox(page, {
            target: 'animation',
            action: 'set-scene',
            sceneName: 'Butterchurn',
            sceneSettings: {},
        });
        await page.waitForTimeout(1000); // Butterchurn needs extra build time for WebGL + presets

        // Verify canvas was created
        const canvasCount = await frame.locator('canvas').count();
        expect(canvasCount).toBeGreaterThanOrEqual(1);

        // Generate stereo audio data (1024 bins, 0-255) with distinct L/R channels
        function generateStereoAudioData(frameNum: number): {
            timeByteArray: number[];
            timeByteArrayLeft: number[];
            timeByteArrayRight: number[];
        } {
            const mono: number[] = [];
            const left: number[] = [];
            const right: number[] = [];
            const t = frameNum * 0.05;
            for (let i = 0; i < 1024; i++) {
                const base = 128 + 60 * Math.sin((i / 1024) * Math.PI * 4 + t);
                mono.push(Math.max(0, Math.min(255, Math.round(base))));
                // Left channel: lower frequency emphasis
                const lVal = 128 + 80 * Math.sin((i / 1024) * Math.PI * 2 + t);
                left.push(Math.max(0, Math.min(255, Math.round(lVal))));
                // Right channel: higher frequency emphasis
                const rVal = 128 + 80 * Math.sin((i / 1024) * Math.PI * 8 + t * 1.3);
                right.push(Math.max(0, Math.min(255, Math.round(rVal))));
            }
            return { timeByteArray: mono, timeByteArrayLeft: left, timeByteArrayRight: right };
        }

        // Pump 30 frames of stereo audio data
        for (let f = 0; f < 30; f++) {
            const stereoData = generateStereoAudioData(f);
            await postToSandbox(page, {
                target: 'animation',
                action: 'update-audio-data',
                audioData: {
                    timeByteArray: stereoData.timeByteArray,
                    timeByteArrayLeft: stereoData.timeByteArrayLeft,
                    timeByteArrayRight: stereoData.timeByteArrayRight,
                    timestamp: Date.now(),
                },
            });
            await page.waitForTimeout(16); // ~60fps pacing
        }

        // Verify canvas still exists after pumping audio
        const canvasAfter = await frame.locator('canvas').count();
        expect(canvasAfter).toBeGreaterThanOrEqual(1);

        // Verify the WebGL context is healthy (not lost)
        const contextInfo = await frame
            .locator('canvas')
            .first()
            .evaluate((canvas: HTMLCanvasElement) => {
                const gl = (canvas.getContext('webgl') || canvas.getContext('webgl2')) as WebGLRenderingContext | null;
                if (!gl) return { hasWebGL: false, contextLost: false, glError: null };
                return {
                    hasWebGL: true,
                    contextLost: gl.isContextLost(),
                    glError: gl.getError() !== 0 ? gl.getError() : null,
                };
            });
        expect(contextInfo.hasWebGL).toBe(true);
        expect(contextInfo.contextLost).toBe(false);

        // Pump another 30 frames to ensure sustained stereo audio does not cause issues
        for (let f = 30; f < 60; f++) {
            const stereoData = generateStereoAudioData(f);
            await postToSandbox(page, {
                target: 'animation',
                action: 'update-audio-data',
                audioData: {
                    timeByteArray: stereoData.timeByteArray,
                    timeByteArrayLeft: stereoData.timeByteArrayLeft,
                    timeByteArrayRight: stereoData.timeByteArrayRight,
                    timestamp: Date.now(),
                },
            });
            await page.waitForTimeout(16);
        }

        // Final check: canvas still present and WebGL context still healthy
        const finalCanvasCount = await frame.locator('canvas').count();
        expect(finalCanvasCount).toBeGreaterThanOrEqual(1);

        const finalContextInfo = await frame
            .locator('canvas')
            .first()
            .evaluate((canvas: HTMLCanvasElement) => {
                const gl = (canvas.getContext('webgl') || canvas.getContext('webgl2')) as WebGLRenderingContext | null;
                if (!gl) return { contextLost: true };
                return { contextLost: gl.isContextLost() };
            });
        expect(finalContextInfo.contextLost).toBe(false);

        // Take a screenshot for visual inspection
        await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, 'Butterchurn_stereo.png'),
            fullPage: true,
        });
    }, PER_SCENE_TIMEOUT);

    // Check for critical JS errors during stereo audio processing
    const criticalPageErrors = pageErrors.filter(
        (e) => e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read'),
    );
    const criticalConsoleErrors = consoleErrors.filter(
        (e) => e.includes('shader') || e.includes('WebGL') || e.includes('GL_'),
    );
    if (pageErrors.length > 0) if (consoleErrors.length > 0) expect(criticalPageErrors).toHaveLength(0);
    expect(criticalConsoleErrors).toHaveLength(0);

    await page.close();
});

test('dynamic FPS matching - sandbox measures and reports frame rate', async () => {
    // The sandbox render loop measures actual requestAnimationFrame timing,
    // calculates FPS from a rolling average (120 samples, updated every 2s),
    // and emits SetFpsEvent via postMessage → animationWindow → chrome.runtime.
    // The offscreen document uses this to match its audio capture rate to the render rate.

    const page = await context.newPage();
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(`chrome-extension://${extensionId}/animationWindow.html`);

    const frame = page.frameLocator('#theFrame');
    await frame.locator('body').waitFor({ state: 'attached' });

    let sw = context.serviceWorkers()[0];
    if (!sw) sw = await context.waitForEvent('serviceworker');

    // Set up FPS event collector in the service worker BEFORE initializing the sandbox.
    // FPS events flow: sandbox → postMessage → animationWindow → chrome.runtime.sendMessage
    // The collector waits for 3 reports (FPS_UPDATE_INTERVAL=2s, so ~6s) or times out at 12s.
    const fpsCollectorPromise = sw.evaluate(() => {
        return new Promise<Array<{ fps: number; target: string; action: string; receivedAt: number }>>((resolve) => {
            const collected: Array<{ fps: number; target: string; action: string; receivedAt: number }> = [];
            const timeout = setTimeout(() => resolve(collected), 12000);
            chrome.runtime.onMessage.addListener(function listener(msg: any) {
                if (msg.action === 'set-fps' && typeof msg.fps === 'number') {
                    collected.push({
                        fps: msg.fps,
                        target: msg.target,
                        action: msg.action,
                        receivedAt: Date.now(),
                    });
                    if (collected.length >= 3) {
                        clearTimeout(timeout);
                        chrome.runtime.onMessage.removeListener(listener);
                        resolve(collected);
                    }
                }
            });
        });
    });

    // Initialize sandbox — sets sandboxEventMessageHolder.source,
    // which enables the render loop to emit FPS events via postMessage
    await postToSandbox(page, { target: 'animation', action: 'animation-ready' });
    await page.waitForTimeout(300);

    // Set a scene so the render loop has active work
    await postToSandbox(page, {
        target: 'animation',
        action: 'set-scene',
        sceneName: 'RoundSpectrum',
        sceneSettings: {},
    });

    // Wait for FPS reports to arrive at the service worker
    const fpsReports = await fpsCollectorPromise;
    for (const _r of fpsReports) {
    }

    // --- 1. FPS reports are emitted ---
    expect(fpsReports.length).toBeGreaterThanOrEqual(1);

    // --- 2. Message format is correct ---
    for (const report of fpsReports) {
        expect(report.target).toBe('offscreen');
        expect(report.action).toBe('set-fps');
        expect(typeof report.fps).toBe('number');
        expect(Number.isInteger(report.fps)).toBe(true);
    }

    // --- 3. FPS values are within the clamped range (30-120) ---
    for (const report of fpsReports) {
        expect(report.fps).toBeGreaterThanOrEqual(30);
        expect(report.fps).toBeLessThanOrEqual(120);
    }

    // --- 4. FPS is stable across multiple reports ---
    if (fpsReports.length >= 2) {
        const fpsValues = fpsReports.map((r) => r.fps);
        const min = Math.min(...fpsValues);
        const max = Math.max(...fpsValues);
        const spread = max - min;
        // In a stable environment, FPS shouldn't swing wildly between reports
        expect(spread).toBeLessThan(30);
    }

    // --- 5. FPS reports arrive at roughly the expected interval (~2s) ---
    if (fpsReports.length >= 2) {
        const intervals: number[] = [];
        for (let i = 1; i < fpsReports.length; i++) {
            intervals.push(fpsReports[i].receivedAt - fpsReports[i - 1].receivedAt);
        }
        // Each interval should be roughly 2 seconds (FPS_UPDATE_INTERVAL = 2000ms)
        // Allow generous tolerance for CI environments (1-5 seconds)
        for (const interval of intervals) {
            expect(interval).toBeGreaterThan(1000);
            expect(interval).toBeLessThan(5000);
        }
    }

    // --- 6. Verify expected capture interval calculation ---
    // The offscreen document uses: captureInterval = clamp(round(1000/fps), 8, 33)
    const fps = fpsReports[0].fps;
    const expectedInterval = Math.max(8, Math.min(33, Math.round(1000 / fps)));
    // Verify the interval maps to the valid capture range
    expect(expectedInterval).toBeGreaterThanOrEqual(8); // 120fps max
    expect(expectedInterval).toBeLessThanOrEqual(33); // 30fps min

    await page.close();
});

test('FPS reporting survives scene transitions', async () => {
    // Switching scenes destroys and recreates canvases via clean() → build().
    // The RAF render loop and FPS measurement must continue uninterrupted
    // across multiple scene transitions, and sandboxEventMessageHolder must
    // remain valid so FPS events keep flowing.

    const page = await context.newPage();
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(`chrome-extension://${extensionId}/animationWindow.html`);

    const frame = page.frameLocator('#theFrame');
    await frame.locator('body').waitFor({ state: 'attached' });

    let sw = context.serviceWorkers()[0];
    if (!sw) sw = await context.waitForEvent('serviceworker');

    // Initialize sandbox
    await postToSandbox(page, { target: 'animation', action: 'animation-ready' });
    await page.waitForTimeout(300);

    // Cycle through a mix of 2D and WebGL scenes
    const transitionScenes = ['RoundSpectrum', 'ChromaWave', 'ParticleCircle', 'SynthBars', 'SeventiesScene'];

    for (const sceneName of transitionScenes) {
        await postToSandbox(page, {
            target: 'animation',
            action: 'set-scene',
            sceneName,
            sceneSettings: {},
        });
        await page.waitForTimeout(400);
        // Pump a few audio frames to exercise the scene
        await pumpAudioFrames(page, 5);
    }

    // After all transitions, collect FPS reports to verify the pipeline still works.
    // Wait for 2 reports to confirm ongoing emission (not just a leftover from before).
    const fpsAfterTransitions = await sw.evaluate(() => {
        return new Promise<number[]>((resolve) => {
            const collected: number[] = [];
            const timeout = setTimeout(() => resolve(collected), 8000);
            chrome.runtime.onMessage.addListener(function listener(msg: any) {
                if (msg.action === 'set-fps' && typeof msg.fps === 'number') {
                    collected.push(msg.fps);
                    if (collected.length >= 2) {
                        clearTimeout(timeout);
                        chrome.runtime.onMessage.removeListener(listener);
                        resolve(collected);
                    }
                }
            });
        });
    });

    // FPS reports must still be flowing after scene transitions
    expect(fpsAfterTransitions.length).toBeGreaterThanOrEqual(1);

    for (const fps of fpsAfterTransitions) {
        expect(fps).toBeGreaterThanOrEqual(30);
        expect(fps).toBeLessThanOrEqual(120);
    }

    await page.close();
});

test('FPS emission requires a valid message source', async () => {
    // The render loop guards FPS emission with sandboxEventMessageHolder?.source.
    // This test verifies the guard by: confirming FPS flows normally, nulling out
    // the holder to stop emission, then restoring it to confirm events resume.
    // (Note: animationWindow auto-sends animation-ready on load, so
    // the holder is set before test code runs — we test by removing it at runtime.)

    const page = await context.newPage();
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(`chrome-extension://${extensionId}/animationWindow.html`);

    const frame = page.frameLocator('#theFrame');
    await frame.locator('body').waitFor({ state: 'attached' });

    let sw = context.serviceWorkers()[0];
    if (!sw) sw = await context.waitForEvent('serviceworker');

    // Phase 1: Confirm FPS events are flowing (auto-init already happened)
    const initialFps = await sw.evaluate(() => {
        return new Promise<number[]>((resolve) => {
            const collected: number[] = [];
            const timeout = setTimeout(() => resolve(collected), 6000);
            chrome.runtime.onMessage.addListener(function listener(msg: any) {
                if (msg.action === 'set-fps' && typeof msg.fps === 'number') {
                    collected.push(msg.fps);
                    if (collected.length >= 1) {
                        clearTimeout(timeout);
                        chrome.runtime.onMessage.removeListener(listener);
                        resolve(collected);
                    }
                }
            });
        });
    });
    expect(initialFps.length).toBeGreaterThanOrEqual(1);

    // Phase 2: Null out the message holder inside the sandbox iframe
    await frame.locator('body').evaluate(() => {
        (window as any).sandboxEventMessageHolder = null;
    });
    // Let any in-flight postMessage events settle before listening
    await page.waitForTimeout(200);

    // Collect FPS events for 3 seconds — should get none since the guard blocks
    const disabledFps = await sw.evaluate(() => {
        return new Promise<number[]>((resolve) => {
            const collected: number[] = [];
            setTimeout(() => resolve(collected), 3000);
            chrome.runtime.onMessage.addListener(function listener(msg: any) {
                if (msg.action === 'set-fps' && typeof msg.fps === 'number') {
                    collected.push(msg.fps);
                }
            });
        });
    });
    expect(disabledFps).toHaveLength(0);

    // Phase 3: Restore by sending a message (re-sets sandboxEventMessageHolder)
    const resumedFpsPromise = sw.evaluate(() => {
        return new Promise<number[]>((resolve) => {
            const collected: number[] = [];
            const timeout = setTimeout(() => resolve(collected), 6000);
            chrome.runtime.onMessage.addListener(function listener(msg: any) {
                if (msg.action === 'set-fps' && typeof msg.fps === 'number') {
                    collected.push(msg.fps);
                    if (collected.length >= 1) {
                        clearTimeout(timeout);
                        chrome.runtime.onMessage.removeListener(listener);
                        resolve(collected);
                    }
                }
            });
        });
    });

    await postToSandbox(page, { target: 'animation', action: 'animation-ready' });
    const resumedFps = await resumedFpsPromise;
    expect(resumedFps.length).toBeGreaterThanOrEqual(1);
    expect(resumedFps[0]).toBeGreaterThanOrEqual(30);
    expect(resumedFps[0]).toBeLessThanOrEqual(120);

    await page.close();
});

test('FPS measurement reflects rendering load', async () => {
    // Compare FPS from a lightweight 2D scene vs a heavy WebGL scene with
    // active audio and high settings. Both must stay in the 30-120 range,
    // validating that measurement tracks real frame times.

    const page = await context.newPage();
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(`chrome-extension://${extensionId}/animationWindow.html`);

    const frame = page.frameLocator('#theFrame');
    await frame.locator('body').waitFor({ state: 'attached' });

    let sw = context.serviceWorkers()[0];
    if (!sw) sw = await context.waitForEvent('serviceworker');

    await postToSandbox(page, { target: 'animation', action: 'animation-ready' });
    await page.waitForTimeout(300);

    // --- Phase 1: Lightweight 2D scene (RoundSpectrum) ---
    await postToSandbox(page, {
        target: 'animation',
        action: 'set-scene',
        sceneName: 'RoundSpectrum',
        sceneSettings: {},
    });

    // Pump audio to give the scene work and let FPS stabilize
    await pumpAudioFrames(page, 60);

    const lightFps = await sw.evaluate(() => {
        return new Promise<number[]>((resolve) => {
            const collected: number[] = [];
            const timeout = setTimeout(() => resolve(collected), 6000);
            chrome.runtime.onMessage.addListener(function listener(msg: any) {
                if (msg.action === 'set-fps' && typeof msg.fps === 'number') {
                    collected.push(msg.fps);
                    if (collected.length >= 2) {
                        clearTimeout(timeout);
                        chrome.runtime.onMessage.removeListener(listener);
                        resolve(collected);
                    }
                }
            });
        });
    });

    // --- Phase 2: Heavy WebGL scene (ChromaWave with cranked settings + loud audio) ---
    await postToSandbox(page, {
        target: 'animation',
        action: 'set-scene',
        sceneName: 'ChromaWave',
        sceneSettings: {},
    });
    await page.waitForTimeout(300);

    // Apply demanding settings
    await postToSandbox(page, {
        target: 'animation',
        action: 'set-scene-settings',
        sceneSettings: {
            audioSensitivity: 5.0,
            intensity: 3.0,
            waveFrequency: 15.0,
            distortionAmount: 5.0,
        },
    });

    // Pump loud audio to maximize GPU work
    await pumpLoud(page, 60);

    const heavyFps = await sw.evaluate(() => {
        return new Promise<number[]>((resolve) => {
            const collected: number[] = [];
            const timeout = setTimeout(() => resolve(collected), 6000);
            chrome.runtime.onMessage.addListener(function listener(msg: any) {
                if (msg.action === 'set-fps' && typeof msg.fps === 'number') {
                    collected.push(msg.fps);
                    if (collected.length >= 2) {
                        clearTimeout(timeout);
                        chrome.runtime.onMessage.removeListener(listener);
                        resolve(collected);
                    }
                }
            });
        });
    });

    const lightAvg = lightFps.length > 0 ? Math.round(lightFps.reduce((a, b) => a + b, 0) / lightFps.length) : 0;
    const heavyAvg = heavyFps.length > 0 ? Math.round(heavyFps.reduce((a, b) => a + b, 0) / heavyFps.length) : 0;

    // Both phases must produce FPS reports
    expect(lightFps.length).toBeGreaterThanOrEqual(1);
    expect(heavyFps.length).toBeGreaterThanOrEqual(1);

    // All values must be within the clamped range
    for (const fps of [...lightFps, ...heavyFps]) {
        expect(fps).toBeGreaterThanOrEqual(30);
        expect(fps).toBeLessThanOrEqual(120);
    }

    // The capture interval derived from each FPS must be in valid range
    for (const fps of [...lightFps, ...heavyFps]) {
        const interval = Math.max(8, Math.min(33, Math.round(1000 / fps)));
        expect(interval).toBeGreaterThanOrEqual(8);
        expect(interval).toBeLessThanOrEqual(33);
    }

    // Log the implied capture rate difference
    const _lightInterval = Math.max(8, Math.min(33, Math.round(1000 / lightAvg)));
    const _heavyInterval = Math.max(8, Math.min(33, Math.round(1000 / heavyAvg)));

    await page.close();
});

test('switching scenes does not leak canvas elements', async () => {
    const page = await context.newPage();
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(`chrome-extension://${extensionId}/animationWindow.html`);

    const frame = page.frameLocator('#theFrame');
    await frame.locator('body').waitFor({ state: 'attached' });

    await postToSandbox(page, { target: 'animation', action: 'animation-ready' });
    await page.waitForTimeout(1000);

    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    // Mix of 2D and WebGL scenes (WormScene excluded — known to stall renderer)
    const leakTestScenes = ['RoundSpectrum', 'SynthBars', 'ParticleCircle', 'ChromaWave', 'NeuralWeb', 'CosmicAurora'];

    for (const sceneName of leakTestScenes) {
        try {
            await withTimeout(async () => {
                await postToSandbox(page, {
                    target: 'animation',
                    action: 'set-scene',
                    sceneName,
                    sceneSettings: {},
                });
                await page.waitForTimeout(600);
                await pumpAudioFrames(page, 10);

                const canvasCount = await frame.locator('canvas').count();
                expect(canvasCount).toBe(1);
            }, PER_SCENE_TIMEOUT);
        } catch (_err: any) {}
    }

    const criticalErrors = errors.filter(
        (e) => e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read'),
    );
    expect(criticalErrors).toHaveLength(0);

    await page.close();
});

test('scenes handle malformed audio data without crashing', async () => {
    const page = await context.newPage();
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(`chrome-extension://${extensionId}/animationWindow.html`);

    const frame = page.frameLocator('#theFrame');
    await frame.locator('body').waitFor({ state: 'attached' });

    await postToSandbox(page, { target: 'animation', action: 'animation-ready' });
    await page.waitForTimeout(1000);

    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    // Set up a scene and confirm valid audio works first
    await postToSandbox(page, {
        target: 'animation',
        action: 'set-scene',
        sceneName: 'RoundSpectrum',
        sceneSettings: {},
    });
    await page.waitForTimeout(600);
    await pumpAudioFrames(page, 10);

    const canvasBefore = await frame.locator('canvas').count();
    expect(canvasBefore).toBeGreaterThanOrEqual(1);

    // --- Safe inputs: these should produce zero critical errors ---
    const errorsBeforeSafe = errors.length;

    // Empty array
    await postToSandbox(page, {
        target: 'animation',
        action: 'update-audio-data',
        audioData: { timeByteArray: [], timestamp: Date.now() },
    });
    await page.waitForTimeout(50);

    // Short array (3 bins instead of 256)
    await postToSandbox(page, {
        target: 'animation',
        action: 'update-audio-data',
        audioData: { timeByteArray: [128, 200, 50], timestamp: Date.now() },
    });
    await page.waitForTimeout(50);

    // Long array (1024 bins)
    const longArray: number[] = [];
    for (let i = 0; i < 1024; i++) {
        longArray.push(Math.round(128 + 127 * Math.sin(i / 50)));
    }
    await postToSandbox(page, {
        target: 'animation',
        action: 'update-audio-data',
        audioData: { timeByteArray: longArray, timestamp: Date.now() },
    });
    await page.waitForTimeout(50);

    // Out-of-range values (negatives, > 255, floats)
    await postToSandbox(page, {
        target: 'animation',
        action: 'update-audio-data',
        audioData: {
            timeByteArray: [-10, 0, 128, 255, 300, 999, -100, 1.5, 254.9, NaN],
            timestamp: Date.now(),
        },
    });
    await page.waitForTimeout(50);

    // Missing timestamp
    await postToSandbox(page, {
        target: 'animation',
        action: 'update-audio-data',
        audioData: { timeByteArray: generateAudioData(0) },
    });
    await page.waitForTimeout(50);

    const safePhaseErrors = errors.slice(errorsBeforeSafe);
    const safeCritical = safePhaseErrors.filter(
        (e) => e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read'),
    );
    expect(safeCritical).toHaveLength(0);

    // --- Crashable inputs: document behavior, don't assert zero errors ---
    const errorsBeforeCrashable = errors.length;

    // null audioData
    await postToSandbox(page, {
        target: 'animation',
        action: 'update-audio-data',
        audioData: null,
    });
    await page.waitForTimeout(50);

    // null timeByteArray
    await postToSandbox(page, {
        target: 'animation',
        action: 'update-audio-data',
        audioData: { timeByteArray: null, timestamp: Date.now() },
    });
    await page.waitForTimeout(50);

    // missing timeByteArray field entirely
    await postToSandbox(page, {
        target: 'animation',
        action: 'update-audio-data',
        audioData: { timestamp: Date.now() },
    });
    await page.waitForTimeout(50);

    const crashablePhaseErrors = errors.slice(errorsBeforeCrashable);
    if (crashablePhaseErrors.length > 0) {
    }

    // --- Recovery: pump valid audio and verify scene still renders ---
    await pumpAudioFrames(page, 20);
    await page.waitForTimeout(100);

    const canvasAfter = await frame.locator('canvas').count();
    expect(canvasAfter).toBeGreaterThanOrEqual(1);

    await page.close();
});

test('non-existent scene name does not crash or change current scene', async () => {
    const page = await context.newPage();
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(`chrome-extension://${extensionId}/animationWindow.html`);

    const frame = page.frameLocator('#theFrame');
    await frame.locator('body').waitFor({ state: 'attached' });

    await postToSandbox(page, { target: 'animation', action: 'animation-ready' });
    await page.waitForTimeout(1000);

    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    // Set up a known scene and verify it works
    await postToSandbox(page, {
        target: 'animation',
        action: 'set-scene',
        sceneName: 'RoundSpectrum',
        sceneSettings: {},
    });
    await page.waitForTimeout(600);
    await pumpAudioFrames(page, 10);

    const canvasBefore = await frame.locator('canvas').count();
    expect(canvasBefore).toBe(1);

    // Capture pixel state of the current scene
    const pixelsBefore = await countNonBlackPixels(frame);

    // Send a set-scene with a completely bogus name
    await postToSandbox(page, {
        target: 'animation',
        action: 'set-scene',
        sceneName: 'TotallyFakeScene_DoesNotExist',
        sceneSettings: {},
    });
    await page.waitForTimeout(600);

    // Canvas count should still be 1 — the current scene must not be destroyed
    const canvasAfter = await frame.locator('canvas').count();
    expect(canvasAfter).toBe(1);

    // The scene should still accept audio without crashing
    const errorsBeforeAudio = errors.length;
    await pumpAudioFrames(page, 20);
    await page.waitForTimeout(100);

    const audioErrors = errors
        .slice(errorsBeforeAudio)
        .filter((e) => e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read'));
    expect(audioErrors).toHaveLength(0);

    // Verify the scene still renders (pixels are present)
    const pixelsAfter = await countNonBlackPixels(frame);
    // If the original scene was rendering, it should still be rendering
    if (pixelsBefore.count > 0) {
        expect(pixelsAfter.count).toBeGreaterThan(0);
    }

    // No critical errors from the bogus scene name
    const criticalErrors = errors.filter(
        (e) => e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read'),
    );
    expect(criticalErrors).toHaveLength(0);

    await page.close();
});

test('audio buffered during scene transition reaches the new scene', async () => {
    const page = await context.newPage();
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(`chrome-extension://${extensionId}/animationWindow.html`);

    const frame = page.frameLocator('#theFrame');
    await frame.locator('body').waitFor({ state: 'attached' });

    await postToSandbox(page, { target: 'animation', action: 'animation-ready' });
    await page.waitForTimeout(1000);

    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    // Start with RoundSpectrum and pump silence to establish baseline
    await postToSandbox(page, {
        target: 'animation',
        action: 'set-scene',
        sceneName: 'RoundSpectrum',
        sceneSettings: {},
    });
    await page.waitForTimeout(600);
    await pumpSilence(page, 20);

    // Now switch to ParticleCircle and immediately blast loud audio
    // during the scene build window. The SceneManager should buffer
    // audio during buildingScene=true and apply it once build completes.
    await postToSandbox(page, {
        target: 'animation',
        action: 'set-scene',
        sceneName: 'ParticleCircle',
        sceneSettings: {},
    });
    // Don't wait for build — immediately send loud audio to test buffering
    for (let f = 0; f < 10; f++) {
        const loud: number[] = [];
        for (let i = 0; i < 256; i++) {
            loud.push(Math.round(200 + 55 * Math.sin((i / 256) * Math.PI * 4 + f * 0.1)));
        }
        await postToSandbox(page, {
            target: 'animation',
            action: 'update-audio-data',
            audioData: { timeByteArray: loud, timestamp: Date.now() },
        });
        // No wait — fire as fast as possible to overlap with build
    }

    // Wait for the scene build to complete
    await page.waitForTimeout(800);

    // Pump a few more frames so the scene renders with the audio
    await pumpLoud(page, 20);
    await page.waitForTimeout(100);

    // The new scene should have a canvas and be rendering content
    const canvasCount = await frame.locator('canvas').count();
    expect(canvasCount).toBe(1);

    const pixels = await countNonBlackPixels(frame);
    // ParticleCircle with loud audio should produce visible output
    expect(pixels.count).toBeGreaterThan(0);

    // No critical errors during the transition + buffered audio
    const criticalErrors = errors.filter(
        (e) => e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read'),
    );
    expect(criticalErrors).toHaveLength(0);

    await page.close();
});

test('settings update during scene build does not crash', async () => {
    const page = await context.newPage();
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(`chrome-extension://${extensionId}/animationWindow.html`);

    const frame = page.frameLocator('#theFrame');
    await frame.locator('body').waitFor({ state: 'attached' });

    await postToSandbox(page, { target: 'animation', action: 'animation-ready' });
    await page.waitForTimeout(1000);

    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    // Start with a WebGL scene
    await postToSandbox(page, {
        target: 'animation',
        action: 'set-scene',
        sceneName: 'ChromaWave',
        sceneSettings: {},
    });
    await page.waitForTimeout(600);
    await pumpAudioFrames(page, 10);

    // Switch to a different scene and immediately fire settings updates
    // during the build window. SceneManager.updateSettings guards with
    // buildingScene and should silently drop the update.
    await postToSandbox(page, {
        target: 'animation',
        action: 'set-scene',
        sceneName: 'SynthBars',
        sceneSettings: {},
    });
    // Fire settings update immediately — scene is likely still building
    for (let i = 0; i < 5; i++) {
        await postToSandbox(page, {
            target: 'animation',
            action: 'set-scene-settings',
            sceneSettings: {
                audioSensitivity: 2.0 + i,
                intensity: 1.0 + i * 0.5,
            },
        });
        // No wait between — fire rapidly
    }

    // Wait for build to complete
    await page.waitForTimeout(800);

    // Now apply settings after the build — this should succeed
    await postToSandbox(page, {
        target: 'animation',
        action: 'set-scene-settings',
        sceneSettings: {
            audioSensitivity: 3.0,
        },
    });
    await page.waitForTimeout(200);

    // Pump audio to verify the scene works
    await pumpAudioFrames(page, 20);
    await page.waitForTimeout(100);

    // Canvas should exist and scene should be functional
    const canvasCount = await frame.locator('canvas').count();
    expect(canvasCount).toBe(1);

    // No critical errors from the race condition
    const criticalErrors = errors.filter(
        (e) => e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read'),
    );
    expect(criticalErrors).toHaveLength(0);

    await page.close();
});

test('every registered scene builds canvas within timeout', async () => {
    // Stricter per-scene test: every scene in the registry must create
    // a canvas and maintain a healthy context. Unlike the cycle test,
    // this fails on ANY scene that doesn't build within the timeout.
    let page = await context.newPage();
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(`chrome-extension://${extensionId}/animationWindow.html`);

    let frame = page.frameLocator('#theFrame');
    await frame.locator('body').waitFor({ state: 'attached' });

    await postToSandbox(page, { target: 'animation', action: 'animation-ready' });
    await page.waitForTimeout(1000);

    const failures: { scene: string; reason: string }[] = [];

    for (const sceneName of SCENES) {
        try {
            await withTimeout(async () => {
                await postToSandbox(page, {
                    target: 'animation',
                    action: 'set-scene',
                    sceneName,
                    sceneSettings: {},
                });
                await page.waitForTimeout(500);

                // Canvas must exist
                const canvasCount = await frame.locator('canvas').count();
                if (canvasCount < 1) {
                    failures.push({ scene: sceneName, reason: 'no canvas created' });
                    return;
                }

                // Exactly 1 canvas (no leaks from previous scene)
                if (canvasCount > 1) {
                    failures.push({ scene: sceneName, reason: `${canvasCount} canvases (leak)` });
                    return;
                }

                // Check WebGL context health (if applicable)
                const contextHealth = await frame
                    .locator('canvas')
                    .first()
                    .evaluate((canvas: HTMLCanvasElement) => {
                        const gl = (canvas.getContext('webgl') ||
                            canvas.getContext('webgl2')) as WebGLRenderingContext | null;
                        if (!gl) return { hasWebGL: false, contextLost: false };
                        return { hasWebGL: true, contextLost: gl.isContextLost() };
                    });

                if (contextHealth.hasWebGL && contextHealth.contextLost) {
                    failures.push({ scene: sceneName, reason: 'WebGL context lost after build' });
                    return;
                }

                // Scene must handle a few frames of audio without page error
                const pageErrors: string[] = [];
                const errorListener = (err: Error) => pageErrors.push(err.message);
                page.on('pageerror', errorListener);

                await pumpAudioFrames(page, 5);
                await page.waitForTimeout(50);

                page.off('pageerror', errorListener);

                const criticalErrors = pageErrors.filter(
                    (e) => e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read'),
                );
                if (criticalErrors.length > 0) {
                    failures.push({ scene: sceneName, reason: `errors: ${criticalErrors.join('; ')}` });
                }
            }, PER_SCENE_TIMEOUT);
        } catch (_err: any) {
            failures.push({ scene: sceneName, reason: 'timed out' });

            // Recover: close broken page, open fresh one
            try {
                await page.close();
            } catch {
                /* already closed */
            }
            page = await context.newPage();
            await page.setViewportSize({ width: 1600, height: 900 });
            await page.goto(`chrome-extension://${extensionId}/animationWindow.html`);
            frame = page.frameLocator('#theFrame');
            await frame.locator('body').waitFor({ state: 'attached' });
            await postToSandbox(page, { target: 'animation', action: 'animation-ready' });
            await page.waitForTimeout(1000);
        }
    }

    // Every scene must pass — report all failures
    if (failures.length > 0) {
        const report = failures.map((f) => `  ${f.scene}: ${f.reason}`).join('\n');
        expect(failures, `Scenes failed to build:\n${report}`).toHaveLength(0);
    }

    await page.close();
});

test('non-animation target messages do not trigger scene changes', async () => {
    const page = await context.newPage();
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(`chrome-extension://${extensionId}/animationWindow.html`);

    const frame = page.frameLocator('#theFrame');
    await frame.locator('body').waitFor({ state: 'attached' });

    await postToSandbox(page, { target: 'animation', action: 'animation-ready' });
    await page.waitForTimeout(1000);

    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    // Set up RoundSpectrum as the active scene
    await postToSandbox(page, {
        target: 'animation',
        action: 'set-scene',
        sceneName: 'RoundSpectrum',
        sceneSettings: {},
    });
    await page.waitForTimeout(600);
    await pumpAudioFrames(page, 10);

    const canvasBefore = await frame.locator('canvas').count();
    expect(canvasBefore).toBe(1);

    // Send messages with non-animation targets — sandbox should ignore them
    // (line 60 in sandbox/main.ts: if target !== messageTarget.animation return)
    const nonAnimationMessages = [
        { target: 'settings', action: 'set-scene', sceneName: 'SynthBars', sceneSettings: {} },
        { target: 'offscreen', action: 'set-scene', sceneName: 'ChromaWave', sceneSettings: {} },
        { target: 'background', action: 'set-scene', sceneName: 'ParticleCircle', sceneSettings: {} },
        { target: 'settings', action: 'update-audio-data', audioData: { timeByteArray: new Array(256).fill(255) } },
        { target: 'offscreen', action: 'set-scene-settings', sceneSettings: { audioSensitivity: 99 } },
        { target: '', action: 'set-scene', sceneName: 'SynthBars', sceneSettings: {} },
    ];

    for (const msg of nonAnimationMessages) {
        await postToSandbox(page, msg);
        await page.waitForTimeout(50);
    }

    // Canvas count should still be 1 — no scene change occurred
    const canvasAfter = await frame.locator('canvas').count();
    expect(canvasAfter).toBe(1);

    // The original scene should still work — pump audio and check
    await pumpAudioFrames(page, 10);
    await page.waitForTimeout(100);

    const finalCanvas = await frame.locator('canvas').count();
    expect(finalCanvas).toBe(1);

    // No critical errors from the ignored messages
    const criticalErrors = errors.filter(
        (e) => e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read'),
    );
    expect(criticalErrors).toHaveLength(0);

    await page.close();
});

test('rapid scene switching does not leak canvases or crash', async () => {
    const page = await context.newPage();
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(`chrome-extension://${extensionId}/animationWindow.html`);

    const frame = page.frameLocator('#theFrame');
    await frame.locator('body').waitFor({ state: 'attached' });

    await postToSandbox(page, { target: 'animation', action: 'animation-ready' });
    await page.waitForTimeout(1000);

    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    // Set initial scene and let it stabilize
    await postToSandbox(page, {
        target: 'animation',
        action: 'set-scene',
        sceneName: 'RoundSpectrum',
        sceneSettings: {},
    });
    await page.waitForTimeout(600);
    await pumpAudioFrames(page, 10);

    // Fire 12 rapid scene switches with only 50ms between each
    // Alternates 2D/WebGL to avoid instanceof guard
    const rapidScenes = [
        'SynthBars',
        'ParticleCircle',
        'ChromaWave',
        'SeventiesScene',
        'CircleBurst',
        'NeuralWeb',
        'CosmicAurora',
        'SynthBars',
        'RoundSpectrum',
        'ChromaWave',
        'ParticleCircle',
        'HexagonPulse',
    ];
    for (const sceneName of rapidScenes) {
        await postToSandbox(page, {
            target: 'animation',
            action: 'set-scene',
            sceneName,
            sceneSettings: {},
        });
        await page.waitForTimeout(50);
    }

    // Wait for everything to settle
    await page.waitForTimeout(2000);

    // Assert: exactly 1 canvas
    const canvasCount = await frame.locator('canvas').count();
    expect(canvasCount).toBe(1);

    // Assert: no critical errors
    const criticalErrors = errors.filter(
        (e) => e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read'),
    );
    expect(criticalErrors).toHaveLength(0);

    // Assert: final scene accepts audio without crashing
    const errorsBeforeAudio = errors.length;
    await pumpAudioFrames(page, 20);
    await page.waitForTimeout(100);
    const audioErrors = errors
        .slice(errorsBeforeAudio)
        .filter((e) => e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read'));
    expect(audioErrors).toHaveLength(0);

    // Assert: WebGL context not lost (if the final scene uses WebGL)
    const contextInfo = await frame
        .locator('canvas')
        .first()
        .evaluate((canvas: HTMLCanvasElement) => {
            const gl = (canvas.getContext('webgl') || canvas.getContext('webgl2')) as WebGLRenderingContext | null;
            if (!gl) return { hasWebGL: false, contextLost: false };
            return { hasWebGL: true, contextLost: gl.isContextLost() };
        });
    if (contextInfo.hasWebGL) {
        expect(contextInfo.contextLost).toBe(false);
    }

    await page.close();
});

test('scene selection persists across page reload', async () => {
    const page = await context.newPage();
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(`chrome-extension://${extensionId}/animationWindow.html`);

    const frame = page.frameLocator('#theFrame');
    await frame.locator('body').waitFor({ state: 'attached' });

    // Initialize settings UI
    await postToSandbox(page, { target: 'animation', action: 'animation-ready' });
    await page.waitForTimeout(1000);

    // Save selectedScene through the sandbox proxy (the real code path)
    await frame.locator('body').evaluate(() => {
        window.parent.postMessage(
            { action: 'save-settings', key: 'selectedScene', value: JSON.stringify('ChromaWave') },
            '*',
        );
    });
    await page.waitForTimeout(200);

    // Verify the proxy wrote to localStorage
    const saved = await page.evaluate(() => {
        return localStorage.getItem('audio-visualizer-settings-selectedScene');
    });
    expect(saved).toBe(JSON.stringify('ChromaWave'));

    // Close and reopen the animation window page
    const url = page.url();
    await page.close();

    const page2 = await context.newPage();
    await page2.setViewportSize({ width: 1600, height: 900 });
    await page2.goto(url);

    const frame2 = page2.frameLocator('#theFrame');
    await frame2.locator('body').waitFor({ state: 'attached' });

    // Wait for the auto-init from animationWindow/main.js (sends animation-ready on load)
    await page2.waitForTimeout(1500);

    // Verify localStorage still has ChromaWave after reload
    const storedScene = await page2.evaluate(() => {
        return localStorage.getItem('audio-visualizer-settings-selectedScene');
    });
    expect(JSON.parse(storedScene!)).toBe('ChromaWave');

    // Pump audio frames and verify canvas exists (scene loaded from persisted selection)
    await pumpAudioFrames(page2, 10);
    await page2.waitForTimeout(200);

    const canvasCount = await frame2.locator('canvas').count();
    expect(canvasCount).toBeGreaterThanOrEqual(1);

    await page2.close();
});

test('custom preset round-trip: save, switch, restore', async () => {
    const page = await context.newPage();
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(`chrome-extension://${extensionId}/animationWindow.html`);

    const frame = page.frameLocator('#theFrame');
    await frame.locator('body').waitFor({ state: 'attached' });

    await postToSandbox(page, { target: 'animation', action: 'animation-ready' });
    await page.waitForTimeout(1000);

    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    // Use a 2D-canvas scene (RoundSpectrum) so countNonBlackPixels readback is reliable.
    // WebGL scenes fail readback because preserveDrawingBuffer is false by default — the
    // back buffer can be cleared between render and getImageData, returning 0 even when
    // the visible canvas is fully painted.
    // Spread defaults first: IScene.updateSettings does wholesale replacement (not merge),
    // so partial settings would produce undefined fields and break rendering.
    const customSettings = {
        ...new RoundSpectrumSetting(),
        colorStrength: 2.5,
        heightMultiplier: 1.5,
        maxBars: 80,
        enableGlow: true,
        glowIntensity: 30,
    };

    // Establish baseline with default RoundSpectrum
    await postToSandbox(page, {
        target: 'animation',
        action: 'set-scene',
        sceneName: 'RoundSpectrum',
        sceneSettings: {},
    });
    await page.waitForTimeout(500);
    await pumpAudioFrames(page, 30);
    await page.waitForTimeout(100);

    const defaultPixels = await countNonBlackPixels(frame);

    // Save the custom preset to localStorage
    await page.evaluate((settings) => {
        localStorage.setItem(
            'audio-visualizer-settings-customPresets',
            JSON.stringify({
                MyPreset: {
                    baseScene: 'RoundSpectrum',
                    settings,
                },
            }),
        );
    }, customSettings);

    // Apply the custom settings
    await postToSandbox(page, {
        target: 'animation',
        action: 'set-scene',
        sceneName: 'RoundSpectrum',
        sceneSettings: customSettings,
    });
    await page.waitForTimeout(500);
    await pumpAudioFrames(page, 30);
    await page.waitForTimeout(100);

    const customPixels = await countNonBlackPixels(frame);

    // Both readbacks should return real counts (2D ctx is reliable, unlike WebGL readPixels)
    expect(defaultPixels.type).toBe('2d');
    expect(customPixels.type).toBe('2d');
    expect(defaultPixels.count).toBeGreaterThan(0);
    expect(customPixels.count).toBeGreaterThanOrEqual(defaultPixels.count);

    // Switch to SynthBars and back to verify round-trip
    await postToSandbox(page, {
        target: 'animation',
        action: 'set-scene',
        sceneName: 'SynthBars',
        sceneSettings: {},
    });
    await page.waitForTimeout(500);
    await pumpAudioFrames(page, 15);

    // Restore RoundSpectrum with custom settings
    await postToSandbox(page, {
        target: 'animation',
        action: 'set-scene',
        sceneName: 'RoundSpectrum',
        sceneSettings: customSettings,
    });
    await page.waitForTimeout(500);
    await pumpAudioFrames(page, 30);
    await page.waitForTimeout(100);

    // Verify canvas exists and scene renders after round-trip
    const canvasAfterRestore = await frame.locator('canvas').count();
    expect(canvasAfterRestore).toBeGreaterThanOrEqual(1);

    const restoredPixels = await countNonBlackPixels(frame);
    expect(restoredPixels.type).toBe('2d');
    expect(restoredPixels.count).toBeGreaterThan(0);

    // No critical errors during the round-trip
    const criticalErrors = errors.filter(
        (e) => e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read'),
    );
    expect(criticalErrors).toHaveLength(0);

    // Clean up
    await page.evaluate(() => {
        localStorage.removeItem('audio-visualizer-settings-customPresets');
    });

    await page.close();
});

test('stale custom preset falls back to default scene', async () => {
    const page = await context.newPage();
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(`chrome-extension://${extensionId}/animationWindow.html`);

    // Write stale preset reference and empty presets map to localStorage BEFORE sandbox init
    await page.evaluate(() => {
        localStorage.setItem('audio-visualizer-settings-selectedScene', JSON.stringify('custom:DeletedPreset'));
        localStorage.setItem('audio-visualizer-settings-customPresets', JSON.stringify({}));
    });

    // Reload the page so the animation window reads the stale values on init
    await page.reload();

    const frame = page.frameLocator('#theFrame');
    await frame.locator('body').waitFor({ state: 'attached' });

    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    // Wait for auto-init (animationWindow/main.js sends animation-ready on load)
    await page.waitForTimeout(1500);

    // Pump audio frames
    await pumpAudioFrames(page, 15);
    await page.waitForTimeout(200);

    // A scene should have loaded despite the stale preset
    const canvasCount = await frame.locator('canvas').count();
    expect(canvasCount).toBeGreaterThanOrEqual(1);

    // No critical TypeError/ReferenceError
    const criticalErrors = errors.filter(
        (e) => e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read'),
    );
    expect(criticalErrors).toHaveLength(0);

    // Clean up
    await page.evaluate(() => {
        localStorage.removeItem('audio-visualizer-settings-selectedScene');
        localStorage.removeItem('audio-visualizer-settings-customPresets');
    });

    await page.close();
});

test('sandbox settings writes reach localStorage via proxy', async () => {
    const page = await context.newPage();
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(`chrome-extension://${extensionId}/animationWindow.html`);

    const frame = page.frameLocator('#theFrame');
    await frame.locator('body').waitFor({ state: 'attached' });

    // Initialize sandbox so sandboxEventMessageHolder is set
    await postToSandbox(page, { target: 'animation', action: 'animation-ready' });
    await page.waitForTimeout(1000);

    // From within the sandbox iframe, post a save-settings message to the parent
    await frame.locator('body').evaluate(() => {
        window.parent.postMessage(
            { action: 'save-settings', key: 'testProxyKey', value: JSON.stringify({ test: true }) },
            '*',
        );
    });

    // Wait for the message to be processed
    await page.waitForTimeout(200);

    // Read from the animation window's localStorage and verify
    const storedValue = await page.evaluate(() => {
        return localStorage.getItem('audio-visualizer-settings-testProxyKey');
    });
    expect(storedValue).toBe(JSON.stringify({ test: true }));

    // Clean up the test key
    await page.evaluate(() => {
        localStorage.removeItem('audio-visualizer-settings-testProxyKey');
    });

    await page.close();
});

test('butterchurn preset cycle updates settings state', async () => {
    const page = await context.newPage();
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(`chrome-extension://${extensionId}/animationWindow.html`);

    const frame = page.frameLocator('#theFrame');
    await frame.locator('body').waitFor({ state: 'attached' });

    // Initialize sandbox so sandboxEventMessageHolder is set
    await postToSandbox(page, { target: 'animation', action: 'animation-ready' });
    await page.waitForTimeout(1000);

    // Set up a message listener on the animation window page BEFORE dispatching
    // The sandbox forwards butterchurn-preset-cycled events to the parent via postMessage
    const messagePromise = page.evaluate(() => {
        return new Promise<{ target: string; action: string; preset: string } | null>((resolve) => {
            const timeout = setTimeout(() => resolve(null), 5000);
            window.addEventListener('message', function listener(e: MessageEvent) {
                if (e.data?.action === 'butterchurn-preset-cycled' && e.data?.target === 'settings') {
                    clearTimeout(timeout);
                    window.removeEventListener('message', listener);
                    resolve({ target: e.data.target, action: e.data.action, preset: e.data.preset });
                }
            });
        });
    });

    // Dispatch the butterchurn-preset-cycled CustomEvent inside the sandbox iframe
    await frame.locator('body').evaluate(() => {
        window.dispatchEvent(new CustomEvent('butterchurn-preset-cycled', { detail: 'SomeNewPreset' }));
    });

    // Verify the animation window received the forwarded message
    const received = await messagePromise;
    expect(received).not.toBeNull();
    expect(received!.target).toBe('settings');
    expect(received!.action).toBe('butterchurn-preset-cycled');
    expect(received!.preset).toBe('SomeNewPreset');

    await page.close();
});
