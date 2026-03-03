# Code Review Tasks: AI-improvements branch

## WILL-FREEZE: Issues That Can Lock Up the Extension

- [x] **Add hard cap to SeventiesScene circle array** — `src/scene/scenes/seventiesScene/seventiesScene.ts:60-64` — `startCircles()` runs every frame with only a soft throttle. Loud sustained audio (EDM, metal) can grow the array to thousands of entries, each needing `arc()` + `stroke()`. Add `if (this.circles.length >= MAX_CIRCLES) return;` at the top of `createCircle()`. A cap of 500-1000 is reasonable.

- [x] **Pre-allocate AudioTerrain grid instead of per-frame allocation** — `src/scene/scenes/audioTerrain/audioTerrain.ts:264-281` — Every `render()` allocates a 2D `points[][]` with `gridW * gridH` objects (~1200+), each using object spread (`{ ...projected, worldY }`). Combined with `lerpColor()` returning a new `rgb()` string per cell and the scanline loop (360 `fillRect` calls at 1080p on line 378-381), this scene will stutter. Pre-allocate the grid in `build()` and update values in-place. Replace the scanline loop with `ctx.createPattern()`.

- [x] **Replace `shadowBlur` with sprite-based glow in ParticleCircle and RoundSpectrum** — `src/scene/scenes/particleCircle/particleCircle.ts:75-77`, `src/scene/scenes/roundSpectrum/roundSpectrum.ts:182-189` — Canvas `shadowBlur` applies a Gaussian blur per draw call. Inside a per-particle/per-bar loop (200+ items) this is extremely expensive. Use pre-rendered sprite canvases for glow effects, like CosmicAurora does correctly with `starSprite` and `particleSprite`.

- [x] **Pre-allocate mat4/vec3 scratch buffers in 3D cube scenes** — `src/scene/scenes/dancing3DCubes/dancing3DCubes.ts:116-118`, `src/scene/scenes/dancingCubes3DSinus/dancingCubes3DSinus.ts:72-74` — `DancingCube3D.update()` creates `vec3.fromValues()` and `mat4.create()` per cube per frame. At 256 cubes × 60fps = 30,720 typed array allocations/second. Pre-allocate as class members. Same fix for PsychedelicCube (`src/scene/scenes/psychedelicCube/psychedelicCube.ts:339-352`) which allocates 3 mat4 + 1 vec3 per frame.

## WILL-BREAK: Correctness Bugs

- [x] **Wrap `chrome.runtime.sendMessage` in try/catch in offscreenWindow and animationWindow** — `entrypoints/offscreenWindow/main.ts:179,199` and `entrypoints/animationWindow/main.js:25` — If the animation window is closed while the offscreen document is alive, `sendMessage` throws "Receiving end does not exist". The exception propagates up and the `setTimeout` on line 203 is never reached — the audio capture loop dies permanently. The extension becomes a silent no-op. Wrap all `sendMessage` calls in try/catch.

- [x] **Add retry backoff to stream recovery** — `entrypoints/offscreenWindow/main.ts:133-139` + `entrypoints/background.ts:75-77` — When `initiateStream()` fails, it sends `requestNewStream` to background, which calls `reinitiateStream()` → `initiateStream()` → sends back to offscreen, creating an infinite retry loop with no backoff and no retry limit. Add exponential backoff and a max retry count.

- [x] **Log errors in `sceneManager.setScene()` instead of silently swallowing them** — `src/scene/sceneManager.ts:87-88` — The catch block is `catch (_error) {}`. If `build()` throws (WebGL context limit, shader compile failure), the error vanishes. The `finally` block still sends `StartStreamEvent` referencing the old scene. At minimum `console.error(_error)`. Consider showing a fallback or notifying the user.

- [x] **Null all references in `clean()` across all scenes** — Multiple scenes remove the canvas/delete GL resources but don't null their references, so guards like `if (!this.canvas) return` don't trip. Affected scenes and missing nulls:
  - `dancing3DCubes.ts` — `canvas`, `gl`, `shaderProgram`, `vxBuffer`, `nrmBuffer`, `ixBuffer`, `projectionMatrix`
  - `dancingHorizon.ts`, `frostfire.ts`, `sunflower.ts`, `synthBars.ts` — `canvas`, `gl`, `shaderProgram`, uniform locations
  - `particleCircle.ts`, `roundSpectrum.ts` — `canvas`, `ctx`
  - `seventiesScene.ts` — `ctx`

- [x] **Fix PaintSplash division by zero** — `src/scene/scenes/paintSplash/paintSplash.ts` — `Math.floor(audioArray.length / this.settings.numSplashes)` produces 0 when `numSplashes > 256`. The subsequent `sum / binSize` produces `Infinity`, corrupting all splash positions. Guard with `Math.max(1, ...)`.

- [x] **Rename `timeByteArray` or add documentation clarifying it's frequency data** — `src/utils/eventMessage.ts:25` + `entrypoints/offscreenWindow/main.ts:170` — `NormalAudioDataDto.timeByteArray` is populated with `getByteFrequencyData()` (frequency domain), not time domain as the name implies. The butterchurn path correctly uses `getByteTimeDomainData`. This will confuse anyone writing a new scene.

- [x] **Remove `alert()` on shader failure in DancingHorizon** — `src/scene/scenes/dancingHorizon/dancingHorizon.ts` — `alert('Unable to initialize the shader program')` blocks the browser tab. No other scene does this. Replace with a silent return (consistent with other scenes) or `console.error`.

## PERFORMANCE: GC Pressure at 60fps

- [x] **Eliminate `Array.from()` on every audio capture tick** — `entrypoints/offscreenWindow/main.ts:172,190-192` — `Array.from(normalDataArray)` runs 60x/sec (3x for butterchurn path). The data then gets JSON-serialized through `chrome.runtime.sendMessage` and again through `postMessage` to the sandbox — 3 serialization hops per frame. Reuse a plain array and copy values into it, or investigate `Transferable` objects for the postMessage hop.

- [x] **Pre-allocate `Uint8Array` buffers in all WebGL scene render loops** — `circleBurst.ts`, `frostfire.ts`, `dancingHorizon.ts`, `sunflower.ts`, `synthBars.ts` all do `bindAudioDataToTexture(new Uint8Array(this.audioData.timeByteArray), this.gl)` every frame. Butterchurn does it 3 times (`butterchurn.ts:76-78`). Allocate a single `Uint8Array(256)` in `build()` and reuse it with `.set()`.

- [ ] **Optimize NeuralWeb O(n^2) connection loop and per-node gradient** — `src/scene/scenes/neuralWeb/neuralWeb.ts:129-168` — Double loop checks all node pairs: O(n^2). At 100 nodes = 4,950 `Math.sqrt` calls + `ctx.stroke()` calls per frame. Then 100 `createRadialGradient()` calls for node glow. Compare squared distances (skip sqrt), use pre-rendered sprites for glow.

- [ ] **Pre-allocate HexagonPulse rotated vertex arrays** — `src/scene/scenes/hexagonPulse/hexagonPulse.ts:241,299` — `vertices.map()` called per hexagon per frame creates ~127 new arrays of 6 tuples each, doubled for highlighted hexes. Pre-allocate rotated vertex storage per hexagon.

- [x] **Cap CosmicAurora `pulseRings` and `shootingStars` arrays** — `src/scene/scenes/cosmicAurora/cosmicAurora.ts:309,633` — Both grow on beats with no hard cap. Only `auroraParticles` has `MAX_AURORA_PARTICLES`. Add hard caps. The `.filter()` calls also allocate new arrays each frame — consider in-place removal.

- [ ] **Cache `hexToRgb()` results in `updateSettings()` instead of calling per frame** — `src/scene/scenes/neuralWeb/neuralWeb.ts:92-93`, `src/scene/scenes/floatingCubes/floatingCubes.ts:87-88` — Parses hex color string with regex every frame. Settings only change on user interaction.

## MEDIUM: Architectural / Design Issues

- [ ] **Reset scene animation state on re-selection (singleton problem)** — `entrypoints/sandbox/main.ts:19-22` — All scenes are `createScene()` once at module load. Switching A→B→A reuses the same instance with stale `this.time`, `this.colorOffset`, `this.circles`, etc. Either call `createScene()` on each switch, or reset animation state in `build()`.

- [ ] **Buffer latest audio data during scene transitions** — `src/scene/sceneManager.ts:27-29` — When `buildingScene = true`, `updateAudioData()` returns early. If `build()` takes 100ms+ (butterchurn WebGL init), audio frames are silently lost. First render after transition uses stale data — visible as a "jump."

- [ ] **Stop `animationWindow/main.js` from forwarding all messages blindly** — `entrypoints/animationWindow/main.js:25` — `chrome.runtime.sendMessage(e.data)` forwards every `postMessage` from the sandbox to the runtime, including high-frequency FPS updates and audio data responses, broadcasting to all extension contexts.

- [ ] **Return `true` from async `onMessage` listener in background.ts** — `entrypoints/background.ts:73` — The listener uses `async` operations but never returns `true` to keep the message port open. Chrome logs "message port closed" warnings and async exceptions become unhandled promise rejections.

- [ ] **Clean old scene before building new one to avoid WebGL context exhaustion** — `src/scene/sceneManager.ts:76-80` — New scene's `build()` (creates WebGL context) runs before old scene's `clean()` (destroys context). Two contexts exist simultaneously, counting against the browser's 8-16 context limit.

## LOW: Minor Issues

- [ ] **Move projection matrix computation inside resize check** — `src/scene/scenes/dancing3DCubes/dancing3DCubes.ts:388-395` — Comment says "if canvas size changed" but `mat4.perspective` runs unconditionally every frame. Same in `dancingCubes3DSinus.ts:333-340`.

- [ ] **Fix `time` wrap discontinuity in Dancing3DCubes** — `src/scene/scenes/dancing3DCubes/dancing3DCubes.ts:416` — `if (this.time > 1000) this.time = 0` creates a visual jump. Use modular arithmetic or `performance.now()`.

- [ ] **Wrap ChromaWave accumulated uniforms to prevent precision loss** — `src/scene/scenes/chromaWave/chromaWave.ts:246-248` — `this.low += delta` grows without bound. After hours of runtime, float precision loss makes animation freeze. Wrap modulo `2 * Math.PI * 1000`.

- [ ] **Fix `Butterchurn.lastTime` type** — `src/scene/scenes/butterchurn/butterchurn.ts:22` — Typed as `any`, should be `number`.

- [ ] **Cache FPS overlay DOM element** — `entrypoints/sandbox/main.ts:131` — `document.getElementById('fps-overlay')` called 60x/sec even when overlay is hidden.

- [ ] **Clean up shader/program on partial compile failure in openGl.ts** — `src/utils/openGl/openGl.ts:36-48` — If vertex shader compiles but fragment fails, vertex shader leaks. If linking fails, neither shaders nor program are deleted.

- [ ] **Null analyser references in `stopStream()`** — `entrypoints/offscreenWindow/main.ts:209-224` — `analyserNormal`, `analyserButterChurn`, etc. and `stream`, `audioContext` are never set to null after cleanup.

- [ ] **Fix HexagonPulse wireframe per-segment color bug** — `src/scene/scenes/hexagonPulse/hexagonPulse.ts:302` — `strokeStyle` changes per point but `stroke()` applies once per row, so only the last color is used. The wireframe has uniform color per row instead of per-segment variation.

- [ ] **Fix offscreen document justification string** — `entrypoints/background.ts:52` — Says "play sound effects", actually does audio visualization capture.
