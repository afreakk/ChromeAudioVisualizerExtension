# Context Bridge

Accumulated learnings across task runs. Read this before starting work.

## Recent Changes

- Fixed singleton scene problem: scenesMap now stores factory functions, creates fresh scene instances on each switch. Removed instanceof guard in sceneManager.setScene(). Files: sandbox/main.ts, sceneManager.ts.
- Buffered latest audio data during scene transitions: SceneManager stores latest audio data when buildingScene=true and applies it after build completes. Files: sceneManager.ts.
- background.ts onMessage listener converted from async to sync, returns true for async operations to keep message port open. Files: background.ts.
- Clean old scene before building new one in sceneManager to avoid WebGL context exhaustion. Files: sceneManager.ts.
- Shader/program cleanup on partial compile failure in openGl.ts: deletes shaders/program if any step fails. Files: openGl.ts.

## Discoveries
- When initiateStream() sets state internally, partial failure after it means cleanup in catch should also undo the stream for future hardening
- When moving code out of finally blocks, check whether defensive guards existed specifically because of the finally context
- Consolidating switch/if-else into a registry naturally fixes inconsistencies because all entries flow through the same code path
- Chrome extension onMessage listeners must return true synchronously (not via async) to keep message port open for async operations

## Conventions
