# Chrome Audio Visualizer Extension

Chrome extension that visualizes audio from browser tabs using 2D Canvas and WebGL scenes.

## Commands

```bash
pnpm run dev          # Development build with WXT hot-reload
pnpm run build        # Production build
pnpm run compile      # TypeScript type-check only (no emit)
pnpm run zip          # Package for Chrome Web Store
nix develop --command npx playwright test  # E2E tests (requires build first)
```

## Testing

See [TESTING.md](TESTING.md) for full details. Tests use Playwright to load the extension in Chromium, cycle through all 22 scenes with synthetic audio data, and verify canvas creation, WebGL context health, settings propagation, and console errors. Browsers come from Nix (`flake.nix`), not npm.

## Architecture Overview

| Entrypoint | File Path | Purpose |
|------------|-----------|---------|
| background | `entrypoints/background.ts` | Service worker - tab capture, messaging |
| sandbox | `entrypoints/sandbox/main.ts` | Sandboxed iframe - runs visualizer scenes |
| offscreen | `entrypoints/offscreenWindow/main.ts` | Processes audio via Web Audio API |
| settings | `entrypoints/settingsWindow/main.ts` | Settings UI using dat.gui |

### Message Flow

```
Tab Audio → background.ts → offscreenWindow (audio processing)
                         → sandbox (scene rendering via postMessage)
```

Audio data sent as `NormalAudioDataDto` or `ButterChurnAudioDataDto` with `timeByteArray` (0-255 values).

## Scene System

**Location**: `src/scene/scene.ts`

```typescript
interface IScene {
    streamType: streamType;           // 'normal' or 'butterChurn'
    build(): void;                    // Create canvas/WebGL context
    updateSettings(settings): void;   // Apply settings changes
    updateAudioData(data): void;      // Receive audio data each frame
    render(): void;                   // Draw frame
    clean(): void;                    // Cleanup resources
}
```

### Scene Lifecycle

**Location**: `src/scene/sceneManager.ts`

1. `build()` - Create and append canvas to DOM
2. `updateSettings()` - Called when user changes settings
3. `updateAudioData()` + `render()` - Called each animation frame
4. `clean()` - Remove canvas, null references

### Adding a New Scene

1. **Create scene folder**: `src/scene/scenes/myScene/`

2. **Create `setting.ts`**:
```typescript
import { ISceneSetting } from '@/src/scene/sceneSetting';

export class MySceneSetting implements ISceneSetting {
    public someValue: number = 1.0;
    public someColor: string = '#ff0000';
}
```

3. **Create `myScene.ts`**:
```typescript
import { IScene } from '@/src/scene/scene';
import { NormalAudioDataDto, streamType } from '@/src/utils/eventMessage';
import { MySceneSetting } from './setting';

export class MyScene implements IScene {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private audioData: NormalAudioDataDto;
    private settings: MySceneSetting = new MySceneSetting();

    constructor() {
        this.audioData = new NormalAudioDataDto([]);
    }

    streamType = streamType.normal;

    build(): void {
        this.canvas = document.createElement('canvas');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.style.position = 'fixed';
        this.canvas.style.left = '0';
        this.canvas.style.top = '0';
        this.canvas.style.zIndex = '-1';
        document.body.insertBefore(this.canvas, document.body.firstChild);
        this.ctx = this.canvas.getContext('2d');
    }

    updateSettings(settings: MySceneSetting): void {
        this.settings = settings;
    }

    updateAudioData(data: NormalAudioDataDto): void {
        this.audioData = data;
    }

    render(): void {
        if (!this.canvas || !this.ctx) return;
        if (this.canvas.width !== window.innerWidth ||
            this.canvas.height !== window.innerHeight) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
        const audioArray = this.audioData.timeByteArray;
        // Draw using audioArray values (0-255)
    }

    clean(): void {
        if (this.canvas) {
            if (this.ctx) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }
            this.canvas.remove();
            this.canvas = null;
        }
        this.ctx = null;
    }
}
```

4. **Create settings UI** in `src/userInterface/settings/sceneSettings/mySceneSettings.ts`:
```typescript
import { setSceneSettings } from "../settingsManager";
import { MySceneSetting } from "@/src/scene/scenes/myScene/setting";

export function mySceneSettings(
    sceneName: string,
    settings: MySceneSetting,
    settingsFolder: any,
    isExternalUi: boolean
): void {
    settingsFolder.add(settings, 'someValue', 0, 2).name('Some Value')
        .onChange((value: number) => {
            settings.someValue = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder.addColor(settings, 'someColor').name('Color')
        .onChange((value: string) => {
            settings.someColor = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
}
```

5. **Register in three files**:

   `src/scene/sceneNames.ts`:
   ```typescript
   export enum sceneNames {
       // ... existing
       MyScene = 'MyScene',
   }
   ```

   `entrypoints/sandbox/main.ts`:
   ```typescript
   import { MyScene } from '@/src/scene/scenes/myScene/myScene';
   scenesMap.set(sceneNames.MyScene.toString(), new MyScene());
   ```

   `src/userInterface/settings/settingsUserInterface.ts`:
   ```typescript
   import { MySceneSetting } from '@/src/scene/scenes/myScene/setting';
   import { mySceneSettings } from './sceneSettings/mySceneSettings';
   // in buildSettings switch:
   case sceneNames.MyScene:
       mySceneSettings(sceneName, settings as MySceneSetting, this.sceneSettingsFolder, this.isExternalUI);
       break;
   ```

## Audio Data

**Location**: `src/utils/eventMessage.ts`

- `NormalAudioDataDto`: `timeByteArray` (256 bins, 0-255), `timestamp`
- `ButterChurnAudioDataDto`: adds `timeByteArrayLeft`, `timeByteArrayRight` for stereo

```typescript
const value = audioArray[binIndex] || 0;        // 0-255
const normalized = value / 255;                  // 0-1
const scaled = normalized * this.settings.audioSensitivity;
```

## Scene Types

### 2D Canvas
Most scenes. Use `ctx.fillRect()`, `ctx.arc()`, gradients. Semi-transparent background for trails.

### WebGL/Shader
Use `src/utils/openGl/openGl.ts`. Pass audio as uniforms. Examples: `chromaWave`, `circleBurst`.

### Butterchurn
Special Milkdrop scene at `src/scene/scenes/butterchurn/`. Requires `streamType.butterChurn`.

## Dependencies

| Package | Purpose |
|---------|---------|
| `wxt` | Extension build framework |
| `dat.gui` | Settings UI controls |
| `butterchurn` | Milkdrop visualizer |
| `gl-matrix` | Matrix math for 3D scenes |

## Common Patterns

```typescript
// HSL colors
`hsl(${hue}, ${saturation}%, ${lightness}%)`
`hsla(${hue}, ${sat}%, ${light}%, ${alpha})`

// Hex to RGB
const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

// Trail effect
ctx.fillStyle = `rgba(0, 0, 0, 0.1)`;
ctx.fillRect(0, 0, width, height);
```

## Key Files

| File | Purpose |
|------|---------|
| `src/scene/scene.ts` | IScene interface |
| `src/scene/sceneManager.ts` | Scene lifecycle, render loop |
| `src/scene/sceneNames.ts` | Scene name enum |
| `src/utils/eventMessage.ts` | Message types, audio DTOs |
| `src/utils/settings.ts` | Chrome storage wrapper |
| `src/userInterface/settings/settingsUserInterface.ts` | Settings UI (register scenes here) |

## Debugging

- Scenes run in sandboxed iframe - inspect the iframe in devtools
- Audio latency logged every 60 frames
- `pnpm run compile` for type checking
- Scene rendering: `src/scene/sceneManager.ts`
- Audio processing: `entrypoints/offscreenWindow/main.ts`
