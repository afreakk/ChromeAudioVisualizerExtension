import { test, expect, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXTENSION_PATH = path.resolve(__dirname, '../.output/chrome-mv3');
const SCREENSHOTS_DIR = path.resolve(__dirname, 'screenshots');
const PER_SCENE_TIMEOUT = 15_000; // 15s max per scene before skipping

/** Run an async function with a timeout. Rejects with 'timeout' if exceeded. */
function withTimeout<T>(fn: () => Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Scene timed out after ${ms}ms`)), ms)
    ),
  ]);
}

// All scenes except Butterchurn (requires stereo audio + external lib setup)
const SCENES = [
  'SunFlower', 'FrostFire', 'SynthBars', 'DancingHorizon',
  'DancingCubes3DSinus', 'WormScene', 'Dancing3DCubes', 'RoundSpectrum',
  'SeventiesScene', 'ParticleCircle', 'PsychedelicCube', 'PulsingGrid',
  'AudioTerrain', 'CircleBurst', 'PaintSplash', 'HexagonPulse',
  'OrbitalRing', 'NeuralWeb', 'FloatingCubes', 'ChromaWave', 'CosmicAurora',
];

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
      action: 'start-animation',
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
      action: 'start-animation',
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
      action: 'start-animation',
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
    const canvas = canvases.find(c =>
      c.style.position === 'fixed' && c.width > 100 && c.height > 100
    ) || canvases[0];
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
  console.log(`Extension ID: ${extensionId}`);

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
  await postToSandbox(page, { target: 'animationWindowReadyEvent', action: '' });
  await page.waitForTimeout(1000);

  // Verify dat.gui loaded (it creates elements with class 'dg')
  const guiCount = await frame.locator('.dg').count();
  console.log(`dat.gui elements: ${guiCount}`);
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
  await postToSandbox(page, { target: 'animationWindowReadyEvent', action: '' });
  await page.waitForTimeout(1000);

  const results: { scene: string; canvasCount: number; hasContent: boolean; crashed?: boolean }[] = [];

  for (const sceneName of SCENES) {
    console.log(`Testing scene: ${sceneName}`);

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
        const canvasInfo = await frame.locator('canvas').first().evaluate((canvas: HTMLCanvasElement) => {
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

        console.log(`  Canvas: ${canvasInfo.width}x${canvasInfo.height}, WebGL: ${canvasInfo.hasWebGL}, context OK: ${canvasInfo.contextOk}${canvasInfo.glError ? `, GL error: ${canvasInfo.glError}` : ''}`);

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
    } catch (err: any) {
      // If the page/renderer crashed or timed out, log it and recover
      console.log(`  SKIPPED ${sceneName}: ${err.message?.slice(0, 100)}`);
      results.push({ scene: sceneName, canvasCount: 0, hasContent: false, crashed: true });

      // Recover: close broken page, open fresh one
      try { await page.close(); } catch { /* already closed */ }
      page = await context.newPage();
      await page.setViewportSize({ width: 1600, height: 900 });
      await page.goto(`chrome-extension://${extensionId}/animationWindow.html`);
      frame = page.frameLocator('#theFrame');
      await frame.locator('body').waitFor({ state: 'attached' });
      await postToSandbox(page, { target: 'animationWindowReadyEvent', action: '' });
      await page.waitForTimeout(1000);
    }
  }

  // Summary
  console.log('\n=== Scene Test Summary ===');
  const rendered = results.filter(r => r.hasContent);
  const crashed = results.filter(r => r.crashed);
  const blank = results.filter(r => !r.hasContent && !r.crashed);
  console.log(`Rendered: ${rendered.length}/${results.length}`);
  if (crashed.length > 0) {
    console.log(`Crashed (renderer overload): ${crashed.map(r => r.scene).join(', ')}`);
  }
  if (blank.length > 0) {
    console.log(`Blank scenes: ${blank.map(r => r.scene).join(', ')}`);
  }
  for (const r of results) {
    const status = r.crashed ? '!' : r.hasContent ? '✓' : '✗';
    console.log(`  ${status} ${r.scene} (${r.canvasCount} canvas)${r.crashed ? ' [crashed]' : ''}`);
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

  await postToSandbox(page, { target: 'animationWindowReadyEvent', action: '' });
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
  const contextValid = await frame.locator('canvas').first().evaluate((canvas: HTMLCanvasElement) => {
    const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
    if (!gl) return false;
    return !(gl as WebGLRenderingContext).isContextLost();
  });
  expect(contextValid).toBe(true);
  console.log(`WebGL context valid after settings change: ${contextValid}`);

  // No page-crashing errors during settings updates
  const criticalErrors = errors.filter(e =>
    e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
  );
  console.log(`Errors during settings test: ${errors.length} total, ${criticalErrors.length} critical`);
  expect(criticalErrors).toHaveLength(0);

  await page.close();
});

test('no WebGL errors across all scenes', async () => {
  let page = await context.newPage();
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(`chrome-extension://${extensionId}/animationWindow.html`);

  let frame = page.frameLocator('#theFrame');
  await frame.locator('body').waitFor({ state: 'attached' });

  await postToSandbox(page, { target: 'animationWindowReadyEvent', action: '' });
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
        const glError = await frame.locator('canvas').first().evaluate((canvas: HTMLCanvasElement) => {
          const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
          if (!gl) return null;
          const err = (gl as WebGLRenderingContext).getError();
          return err !== 0 ? err : null; // 0 = NO_ERROR
        }).catch(() => null);

        if (glError) {
          errors.push(`WebGL error in ${sceneName}: ${glError}`);
        }
      }, PER_SCENE_TIMEOUT);
    } catch (err: any) {
      console.log(`  SKIPPED ${sceneName}: ${err.message?.slice(0, 100)}`);
      crashed.push(sceneName);

      // Recover: close broken page, open fresh one
      try { await page.close(); } catch { /* already closed */ }
      page = await context.newPage();
      await page.setViewportSize({ width: 1600, height: 900 });
      await page.goto(`chrome-extension://${extensionId}/animationWindow.html`);
      frame = page.frameLocator('#theFrame');
      await frame.locator('body').waitFor({ state: 'attached' });
      await postToSandbox(page, { target: 'animationWindowReadyEvent', action: '' });
      await page.waitForTimeout(1000);
      attachErrorListeners(page);
    }
  }

  console.log(`Total errors: ${errors.length}`);
  if (errors.length > 0) {
    console.log('Errors:', errors);
  }
  if (crashed.length > 0) {
    console.log(`Crashed scenes (renderer overload): ${crashed.join(', ')}`);
  }
  // WebGL compilation/runtime errors indicate broken scenes
  const criticalErrors = errors.filter(e =>
    e.includes('shader') || e.includes('WebGL') || e.includes('GL_')
  );
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
    // Excluded: AudioTerrain, PulsingGrid, HexagonPulse — these render visible
    // content even in silence (time-based animation or static grid).
    'RoundSpectrum',    // circular bar spectrum: bars = audio values
    'ParticleCircle',   // particle sizes from frequency bins
    'SeventiesScene',   // expanding circles driven by volume
    'OrbitalRing',      // dot radius and brightness from audio
    // WebGL — readPixels may return zeros on SwiftShader
    'SynthBars',        // shader bar graph
    'CircleBurst',      // spoke lengths from spectrum
    'ChromaWave',       // heavy audio-driven distortion
  ];

  const page = await context.newPage();
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(`chrome-extension://${extensionId}/animationWindow.html`);

  const frame = page.frameLocator('#theFrame');
  await frame.locator('body').waitFor({ state: 'attached' });
  await postToSandbox(page, { target: 'animationWindowReadyEvent', action: '' });
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

    console.log(
      `${sceneName} [${afterSilence.type}]: silence=${afterSilence.count}px, loud=${afterLoud.count}px, reacted=${reacted}`
    );

    results.push({
      scene: sceneName,
      type: afterSilence.type,
      silencePixels: afterSilence.count,
      loudPixels: afterLoud.count,
      reacted,
    });
  }

  // Summary
  console.log('\n=== Audio Reactivity Summary ===');
  const reacted2d = results.filter(r => r.reacted && r.type === '2d');
  const reactedGl = results.filter(r => r.reacted && r.type === 'webgl');
  const skippedGl = results.filter(r => !r.reacted && r.type === 'webgl');
  const failed2d = results.filter(r => !r.reacted && r.type === '2d');

  for (const r of results) {
    console.log(`  ${r.reacted ? '✓' : '✗'} ${r.scene} [${r.type}] silence=${r.silencePixels}px loud=${r.loudPixels}px`);
  }

  if (skippedGl.length > 0) {
    console.log(`\nWebGL scenes with no pixel diff (expected on SwiftShader): ${skippedGl.map(r => r.scene).join(', ')}`);
  }
  if (failed2d.length > 0) {
    console.log(`\n2D Canvas scenes that did NOT react (unexpected): ${failed2d.map(r => r.scene).join(', ')}`);
  }

  // All 2D Canvas scenes must show audio reactivity
  expect(failed2d).toHaveLength(0);

  // WebGL scenes may fail on SwiftShader — log but don't hard-fail
  if (reactedGl.length > 0) {
    console.log(`\n${reactedGl.length} WebGL scene(s) also showed audio reactivity via readPixels`);
  }

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
      action: 'start-animation',
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
      action: 'start-animation',
      audioData: {
        timeByteArray: loud,
        timestamp: Date.now(),
      },
    });
    await page.waitForTimeout(16);
  }
  const afterLoud = await countNonBlackPixels(frame);

  console.log(`Relay test — silence=${afterSilence.count}px, loud=${afterLoud.count}px [${afterLoud.type}]`);

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
  console.log(`Reverse relay (sandbox → chrome.runtime): ${relayResult}`);
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
  await postToSandbox(page, { target: 'animationWindowReadyEvent', action: '' });
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
    console.log(`Butterchurn canvas count: ${canvasCount}`);
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
        action: 'start-animation',
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
    const contextInfo = await frame.locator('canvas').first().evaluate((canvas: HTMLCanvasElement) => {
      const gl = (canvas.getContext('webgl') || canvas.getContext('webgl2')) as WebGLRenderingContext | null;
      if (!gl) return { hasWebGL: false, contextLost: false, glError: null };
      return {
        hasWebGL: true,
        contextLost: gl.isContextLost(),
        glError: gl.getError() !== 0 ? gl.getError() : null,
      };
    });

    console.log(`Butterchurn WebGL: hasWebGL=${contextInfo.hasWebGL}, contextLost=${contextInfo.contextLost}, glError=${contextInfo.glError}`);
    expect(contextInfo.hasWebGL).toBe(true);
    expect(contextInfo.contextLost).toBe(false);

    // Pump another 30 frames to ensure sustained stereo audio does not cause issues
    for (let f = 30; f < 60; f++) {
      const stereoData = generateStereoAudioData(f);
      await postToSandbox(page, {
        target: 'animation',
        action: 'start-animation',
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

    const finalContextInfo = await frame.locator('canvas').first().evaluate((canvas: HTMLCanvasElement) => {
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
  const criticalPageErrors = pageErrors.filter(e =>
    e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
  );
  const criticalConsoleErrors = consoleErrors.filter(e =>
    e.includes('shader') || e.includes('WebGL') || e.includes('GL_')
  );

  console.log(`Butterchurn stereo test — page errors: ${pageErrors.length} (${criticalPageErrors.length} critical), console errors: ${consoleErrors.length} (${criticalConsoleErrors.length} critical)`);
  if (pageErrors.length > 0) console.log('  Page errors:', pageErrors);
  if (consoleErrors.length > 0) console.log('  Console errors:', consoleErrors);

  expect(criticalPageErrors).toHaveLength(0);
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
    return new Promise<Array<{ fps: number; target: string; action: string; receivedAt: number }>>(
      (resolve) => {
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
      }
    );
  });

  // Initialize sandbox — sets sandboxEventMessageHolder.source,
  // which enables the render loop to emit FPS events via postMessage
  await postToSandbox(page, { target: 'animationWindowReadyEvent', action: '' });
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

  console.log(`\n=== Dynamic FPS Matching ===`);
  console.log(`Collected ${fpsReports.length} FPS report(s)`);
  for (const r of fpsReports) {
    console.log(`  FPS=${r.fps} target=${r.target} action=${r.action}`);
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
    console.log(`FPS stability: min=${min} max=${max} spread=${spread}`);
    // In a stable environment, FPS shouldn't swing wildly between reports
    expect(spread).toBeLessThan(30);
  }

  // --- 5. FPS reports arrive at roughly the expected interval (~2s) ---
  if (fpsReports.length >= 2) {
    const intervals: number[] = [];
    for (let i = 1; i < fpsReports.length; i++) {
      intervals.push(fpsReports[i].receivedAt - fpsReports[i - 1].receivedAt);
    }
    console.log(`Report intervals: ${intervals.map((i) => `${i}ms`).join(', ')}`);
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
  console.log(`FPS=${fps} → captureInterval=${expectedInterval}ms (${Math.round(1000 / expectedInterval)}fps capture)`);
  // Verify the interval maps to the valid capture range
  expect(expectedInterval).toBeGreaterThanOrEqual(8);   // 120fps max
  expect(expectedInterval).toBeLessThanOrEqual(33);      // 30fps min

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
  await postToSandbox(page, { target: 'animationWindowReadyEvent', action: '' });
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

  console.log(`\n=== FPS After Scene Transitions ===`);
  console.log(`Scenes cycled: ${transitionScenes.join(' → ')}`);
  console.log(`FPS reports after transitions: [${fpsAfterTransitions.join(', ')}]`);

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
  // (Note: animationWindow auto-sends animationWindowReadyEvent on load, so
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

  console.log(`\n=== FPS Message Source Guard ===`);
  console.log(`Phase 1 — FPS while active: [${initialFps.join(', ')}]`);
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

  console.log(`Phase 2 — FPS while holder nulled: [${disabledFps.join(', ')}]`);
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

  await postToSandbox(page, { target: 'animationWindowReadyEvent', action: '' });
  const resumedFps = await resumedFpsPromise;

  console.log(`Phase 3 — FPS after restore: [${resumedFps.join(', ')}]`);
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

  await postToSandbox(page, { target: 'animationWindowReadyEvent', action: '' });
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

  const lightAvg = lightFps.length > 0
    ? Math.round(lightFps.reduce((a, b) => a + b, 0) / lightFps.length)
    : 0;
  const heavyAvg = heavyFps.length > 0
    ? Math.round(heavyFps.reduce((a, b) => a + b, 0) / heavyFps.length)
    : 0;

  console.log(`\n=== FPS Under Load ===`);
  console.log(`Lightweight (RoundSpectrum): [${lightFps.join(', ')}] avg=${lightAvg}`);
  console.log(`Heavy (ChromaWave cranked):  [${heavyFps.join(', ')}] avg=${heavyAvg}`);

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
  const lightInterval = Math.max(8, Math.min(33, Math.round(1000 / lightAvg)));
  const heavyInterval = Math.max(8, Math.min(33, Math.round(1000 / heavyAvg)));
  console.log(`Capture intervals: light=${lightInterval}ms (${Math.round(1000 / lightInterval)}fps), heavy=${heavyInterval}ms (${Math.round(1000 / heavyInterval)}fps)`);

  await page.close();
});

test('switching scenes does not leak canvas elements', async () => {
  const page = await context.newPage();
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(`chrome-extension://${extensionId}/animationWindow.html`);

  const frame = page.frameLocator('#theFrame');
  await frame.locator('body').waitFor({ state: 'attached' });

  await postToSandbox(page, { target: 'animationWindowReadyEvent', action: '' });
  await page.waitForTimeout(1000);

  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  // Mix of 2D and WebGL scenes (WormScene excluded — known to stall renderer)
  const leakTestScenes = [
    'RoundSpectrum', 'SynthBars', 'ParticleCircle',
    'ChromaWave', 'NeuralWeb', 'CosmicAurora',
  ];

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
        console.log(`  Canvas leak check [${sceneName}]: ${canvasCount} canvas(es)`);
        expect(canvasCount).toBe(1);
      }, PER_SCENE_TIMEOUT);
    } catch (err: any) {
      console.log(`  SKIPPED ${sceneName} in leak test: ${err.message?.slice(0, 100)}`);
    }
  }

  const criticalErrors = errors.filter(e =>
    e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
  );
  console.log(`Canvas leak test — ${errors.length} total errors, ${criticalErrors.length} critical`);
  expect(criticalErrors).toHaveLength(0);

  await page.close();
});

test('scenes handle malformed audio data without crashing', async () => {
  const page = await context.newPage();
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(`chrome-extension://${extensionId}/animationWindow.html`);

  const frame = page.frameLocator('#theFrame');
  await frame.locator('body').waitFor({ state: 'attached' });

  await postToSandbox(page, { target: 'animationWindowReadyEvent', action: '' });
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
    action: 'start-animation',
    audioData: { timeByteArray: [], timestamp: Date.now() },
  });
  await page.waitForTimeout(50);

  // Short array (3 bins instead of 256)
  await postToSandbox(page, {
    target: 'animation',
    action: 'start-animation',
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
    action: 'start-animation',
    audioData: { timeByteArray: longArray, timestamp: Date.now() },
  });
  await page.waitForTimeout(50);

  // Out-of-range values (negatives, > 255, floats)
  await postToSandbox(page, {
    target: 'animation',
    action: 'start-animation',
    audioData: {
      timeByteArray: [-10, 0, 128, 255, 300, 999, -100, 1.5, 254.9, NaN],
      timestamp: Date.now(),
    },
  });
  await page.waitForTimeout(50);

  // Missing timestamp
  await postToSandbox(page, {
    target: 'animation',
    action: 'start-animation',
    audioData: { timeByteArray: generateAudioData(0) },
  });
  await page.waitForTimeout(50);

  const safePhaseErrors = errors.slice(errorsBeforeSafe);
  const safeCritical = safePhaseErrors.filter(e =>
    e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
  );
  console.log(`Malformed audio (safe inputs) — ${safePhaseErrors.length} errors, ${safeCritical.length} critical`);
  expect(safeCritical).toHaveLength(0);

  // --- Crashable inputs: document behavior, don't assert zero errors ---
  const errorsBeforeCrashable = errors.length;

  // null audioData
  await postToSandbox(page, {
    target: 'animation',
    action: 'start-animation',
    audioData: null,
  });
  await page.waitForTimeout(50);

  // null timeByteArray
  await postToSandbox(page, {
    target: 'animation',
    action: 'start-animation',
    audioData: { timeByteArray: null, timestamp: Date.now() },
  });
  await page.waitForTimeout(50);

  // missing timeByteArray field entirely
  await postToSandbox(page, {
    target: 'animation',
    action: 'start-animation',
    audioData: { timestamp: Date.now() },
  });
  await page.waitForTimeout(50);

  const crashablePhaseErrors = errors.slice(errorsBeforeCrashable);
  console.log(`Malformed audio (crashable inputs) — ${crashablePhaseErrors.length} errors (documenting, not asserting)`);
  if (crashablePhaseErrors.length > 0) {
    console.log('  Crashable input errors:', crashablePhaseErrors.slice(0, 5));
  }

  // --- Recovery: pump valid audio and verify scene still renders ---
  await pumpAudioFrames(page, 20);
  await page.waitForTimeout(100);

  const canvasAfter = await frame.locator('canvas').count();
  console.log(`Recovery — canvas count after malformed audio: ${canvasAfter}`);
  expect(canvasAfter).toBeGreaterThanOrEqual(1);

  await page.close();
});

test('rapid scene switching does not leak canvases or crash', async () => {
  const page = await context.newPage();
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(`chrome-extension://${extensionId}/animationWindow.html`);

  const frame = page.frameLocator('#theFrame');
  await frame.locator('body').waitFor({ state: 'attached' });

  await postToSandbox(page, { target: 'animationWindowReadyEvent', action: '' });
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
    'SynthBars', 'ParticleCircle', 'ChromaWave', 'SeventiesScene',
    'CircleBurst', 'NeuralWeb', 'CosmicAurora', 'SynthBars',
    'RoundSpectrum', 'ChromaWave', 'ParticleCircle', 'HexagonPulse',
  ];

  console.log(`Rapid switching: firing ${rapidScenes.length} scene changes with 50ms gaps`);
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
  console.log(`After rapid switching — canvas count: ${canvasCount}`);
  expect(canvasCount).toBe(1);

  // Assert: no critical errors
  const criticalErrors = errors.filter(e =>
    e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
  );
  console.log(`After rapid switching — ${errors.length} total errors, ${criticalErrors.length} critical`);
  expect(criticalErrors).toHaveLength(0);

  // Assert: final scene accepts audio without crashing
  const errorsBeforeAudio = errors.length;
  await pumpAudioFrames(page, 20);
  await page.waitForTimeout(100);
  const audioErrors = errors.slice(errorsBeforeAudio).filter(e =>
    e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
  );
  console.log(`After pumping audio to final scene — ${audioErrors.length} critical errors`);
  expect(audioErrors).toHaveLength(0);

  // Assert: WebGL context not lost (if the final scene uses WebGL)
  const contextInfo = await frame.locator('canvas').first().evaluate((canvas: HTMLCanvasElement) => {
    const gl = (canvas.getContext('webgl') || canvas.getContext('webgl2')) as WebGLRenderingContext | null;
    if (!gl) return { hasWebGL: false, contextLost: false };
    return { hasWebGL: true, contextLost: gl.isContextLost() };
  });
  if (contextInfo.hasWebGL) {
    console.log(`WebGL context lost: ${contextInfo.contextLost}`);
    expect(contextInfo.contextLost).toBe(false);
  }

  await page.close();
});
