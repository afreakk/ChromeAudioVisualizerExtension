# Failed Tasks

Re-run with `/run-tasks-native failed-tasks.md` after fixing task descriptions.

- [ ] Make CosmicAurora shadowBlur configurable with a low default
  - files: src/scene/scenes/cosmicAurora/cosmicAurora.ts, src/scene/scenes/cosmicAurora/setting.ts, src/userInterface/settings/sceneSettings/cosmicAuroraSettings.ts
  - context: |
      cosmicAurora.ts line 443 sets ctx.shadowBlur = 30 * this.settings.glowIntensity for aurora ribbon strokes. Canvas shadow rendering requires a separate blur pass per draw call. With 5 ribbons x 3 layers = 15 shadow-blurred strokes per frame, this can halve the frame rate on mid-range hardware.
      Fix: Change the default glowIntensity in setting.ts from its current value to a low value (e.g., 0.3). Also change the slider range to 0-1 in cosmicAuroraSettings.ts.
  - failure-reason: Slider range is 0-2.0 but task requires range 0-1; needs .add(settings, 'glowIntensity', 0, 1.0)

- [ ] Replace per-star radial gradient with pre-rendered offscreen star sprite
  - files: src/scene/scenes/cosmicAurora/cosmicAurora.ts
  - context: Already implemented in the codebase.
  - failure-reason: subagent produced no changes (feature already implemented)
