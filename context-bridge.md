# Context Bridge

Accumulated learnings across task runs. Read this before starting work.

## Recent Changes

- Buffered latest audio data during scene transitions: SceneManager stores latest audio data when buildingScene=true and applies it after build completes. Files: sceneManager.ts.
- background.ts onMessage listener converted from async to sync, returns true for async operations to keep message port open. Files: background.ts.
- Clean old scene before building new one in sceneManager to avoid WebGL context exhaustion. Files: sceneManager.ts.
- Shader/program cleanup on partial compile failure in openGl.ts: deletes shaders/program if any step fails. Files: openGl.ts.
- Fixed getRandomPreset() off-by-one: replaced `Math.round(...) - 1` with `Math.floor(Math.random() * keys.length)`. Files: src/scene/scenes/butterchurn/setting.ts.
- Consolidated offscreen stream recovery into single scheduleRecovery() gate with recoveryState flag; both initiateStream catch and updateAudioDataEvent no-stream branch route through it. Files: entrypoints/offscreenWindow/main.ts.
- Filled/removed empty error-handling blocks: background.ts logs tab-miss warn and visualization startup error; tests/extension.spec.ts replaces empty blocks with either logs or deletions. Files: entrypoints/background.ts, tests/extension.spec.ts.

## Discoveries
- When initiateStream() sets state internally, partial failure after it means cleanup in catch should also undo the stream for future hardening
- When moving code out of finally blocks, check whether defensive guards existed specifically because of the finally context
- Consolidating switch/if-else into a registry naturally fixes inconsistencies because all entries flow through the same code path
- Chrome extension onMessage listeners must return true synchronously (not via async) to keep message port open for async operations
- Pre-commit hook runs full build + all Playwright tests (~3.4 min); expect long commit times

## Conventions
