# Context Bridge

Accumulated learnings across task runs. Read this before starting work.

## Recent Changes

- Lowered CosmicAurora glowIntensity default from 0.7 to 0.3, capped slider range to 0-1.0, renamed label to "Glow Intensity". No shadowBlur calls remain -- glow is implemented via dual-stroke alpha/width multipliers. Files: setting.ts, cosmicAuroraSettings.ts.
- Optimized NeuralWeb: squared distance comparison in O(n^2) connection loop to skip sqrt for distant pairs; replaced per-node createRadialGradient() with pre-rendered glow sprite; moved lineWidth/audioBoost outside inner loop. Files: neuralWeb.ts.

## Discoveries
- When initiateStream() sets state internally, partial failure after it means cleanup in catch should also undo the stream for future hardening
- When moving code out of finally blocks, check whether defensive guards existed specifically because of the finally context
- Consolidating switch/if-else into a registry naturally fixes inconsistencies because all entries flow through the same code path

## Conventions
