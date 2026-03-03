# Testing

## Setup

Browsers and the Playwright driver come from Nix via `flake.nix`. The npm package `@playwright/test` (pinned to match the Nix `playwright-driver` version) provides the test runner.

```bash
nix develop   # enters shell with PLAYWRIGHT_BROWSERS_PATH set
```

The flake exports three environment variables automatically:

| Variable | Purpose |
|----------|---------|
| `PLAYWRIGHT_BROWSERS_PATH` | Points to Nix-provided Chromium/Firefox/WebKit |
| `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS` | Bypasses host library checks on NixOS |
| `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` | Prevents npm postinstall from downloading browsers |

**Version matching**: The `@playwright/test` npm package version must match the `playwright-driver` version in nixpkgs. Check with `nix eval nixpkgs#playwright-driver.version`.

## Running Tests

```bash
nix develop --command npx playwright test                # all tests
nix develop --command npx playwright test --reporter=list  # verbose output
```

The extension must be built first (`npm run build`). Tests load the built extension from `.output/chrome-mv3/`.

## Test Architecture

Tests use Playwright's persistent browser context to load the extension into Chromium with `--load-extension`. This is necessary because Chrome extensions require a real (non-headless) browser context.

### How Scenes Are Tested

The test bypasses `chrome.tabCapture` (which requires a real user gesture and tab audio) by injecting synthetic audio data directly into the sandbox iframe via `postMessage`. This mirrors the real message flow:

```
Test (postMessage) → sandbox iframe → SceneManager → scene.updateAudioData() → scene.render()
```

Synthetic audio is a mix of sine waves at different frequencies, producing 256 bins of values 0-255 — the same format as `NormalAudioDataDto`.

### What Cannot Be Tested This Way

- **Real audio capture**: `chrome.tabCapture.getMediaStreamId()` requires a user gesture
- **WebGL visual output**: The Nix-provided Chromium uses software rendering (SwiftShader), so WebGL canvas content does not appear in screenshots. On a machine with a real GPU, page screenshots would show the actual visualizations
- **Butterchurn scene**: Requires stereo audio data (`ButterChurnAudioDataDto`) and the butterchurn library's internal preset loading

## Test Suite

### Files

| File | Purpose |
|------|---------|
| `playwright.config.ts` | Playwright configuration (120s timeout, 1600x900 viewport) |
| `tests/extension.spec.ts` | All E2E tests |
| `tests/screenshots/` | Page screenshots from each scene (gitignored) |

### Tests

**1. Extension loads and service worker is active**
Verifies the extension installs in Chromium, the MV3 service worker registers, and the extension ID is a valid 32-character string.

**2. Animation window opens with sandbox iframe and dat.gui**
Opens `animationWindow.html`, verifies the `#theFrame` sandbox iframe loads, sends the `animationWindowReadyEvent` message, and confirms dat.gui settings UI elements (`.dg` class) are present.

**3. Cycle through all scenes with synthetic audio and capture**
Iterates all 20 non-Butterchurn scenes. For each scene:
- Sends `set-scene` message to the sandbox
- Pumps 60 frames (~1 second) of synthetic audio at 60fps pacing
- Verifies a `<canvas>` element exists
- Checks WebGL context health (not lost, no `gl.getError()`)
- Takes a page screenshot
- Reports whether the scene uses WebGL or 2D Canvas

Prints a summary table at the end showing pass/fail per scene.

**4. Scene settings propagate without errors**
Sets ChromaWave scene, applies modified settings (`audioSensitivity: 5.0`, `patternStyle: 2`, etc.), pumps audio, and verifies:
- Canvas persists after settings change (no crash)
- WebGL context is not lost
- No `TypeError`/`ReferenceError` exceptions during the update

**5. No WebGL errors across all scenes**
Rapid-cycles through all 20 scenes, collecting:
- `page.on('pageerror')` — uncaught exceptions
- `page.on('console', 'error')` — console.error calls
- `gl.getError()` — WebGL runtime errors

Fails if any shader-related or WebGL-specific errors are detected. Non-critical errors (like color parsing) are logged but don't fail the test.

## Known Console Errors

The error monitor test surfaces these bugs in scene implementations:

| Error | Occurrences | Cause |
|-------|-------------|-------|
| `Invalid input: HEX color must be a string.` | 5 | Scenes passing non-string values to `colorConverter` |
| `Failed to execute 'addColorStop': rgb(NaN,NaN,NaN)` | 1 | Scene computing invalid gradient color from bad hex-to-RGB conversion |
| `Cannot read properties of undefined (reading 'constructor')` | 1 | Null reference during scene transition |

## Scene Classification

The scene cycle test identifies which rendering backend each scene uses:

| Backend | Scenes |
|---------|--------|
| **WebGL** | SunFlower, FrostFire, SynthBars, DancingHorizon, DancingCubes3DSinus, Dancing3DCubes, PsychedelicCube, CircleBurst, ChromaWave, CosmicAurora |
| **2D Canvas** | WormScene, RoundSpectrum, SeventiesScene, ParticleCircle, AudioTerrain, PaintSplash, HexagonPulse, OrbitalRing, NeuralWeb, FloatingCubes |
| **Butterchurn** | Butterchurn (not tested — requires stereo audio) |

## Adding Tests for a New Scene

When adding a new scene, the test suite picks it up automatically if you add the scene name to the `SCENES` array in `tests/extension.spec.ts`. The scene cycle test will verify:

1. Canvas creation during `build()`
2. No crash during 60 frames of synthetic audio
3. WebGL context health (if applicable)
4. No uncaught exceptions

No other test changes are needed for basic coverage.
