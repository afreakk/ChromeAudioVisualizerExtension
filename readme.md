# Audio visualizer

## Dev environment

### How to run the project

Install node modules

```bash
pnpm install
```

Run extension

```bash
pnpm dev
```

## Capture source

By default the extension captures audio from the active browser tab. In the settings UI, the
**Capture source** dropdown lets you switch to **Microphone / system audio** — the animation
window swaps streams in place; on the first switch Chrome asks for microphone permission, then
visualizes whatever audio input device Chromium is using. The choice is **session-only**: closing
and reopening the animation window starts fresh on Tab. Flip the dropdown back to **Current tab**
to restore tab capture without reopening the window.

"Microphone" literally means Chromium's audio-input device. Routing app or system output into
that input is handled by the OS mixer — see below.

### System audio via microphone on Linux

Use `pavucontrol` (PulseAudio/PipeWire) to redirect Chromium's input from the real microphone to
a monitor of the output. This is the same pattern Discord and OBS users already rely on.

1. In the settings UI, flip `Capture source` to `Microphone / system audio`. Accept Chrome's
   one-time mic prompt. The visualizer swaps streams in place — initially reacting to whatever
   the default mic hears.
2. Open `pavucontrol` → **Recording** tab. Find the Chromium entry and change its input from the
   default mic to `Monitor of <your output device>`. Every app's playback will now flow into the
   visualizer in real time.

Advanced — per-app capture:

```bash
pactl load-module module-null-sink sink_name=viz
```

In `pavucontrol` → **Playback**, move the app you want to visualize (e.g. Spotify) to the `viz`
sink. Then in the **Recording** tab, set Chromium's input to `Monitor of viz`. Only that app's
audio is captured; your speakers stay clean of its output (route to a combined sink if you still
want to hear it).

### System audio on Windows / macOS

- **Windows**: enable "Stereo Mix" in the Sound control panel (Recording devices → right-click →
  Show Disabled Devices → Enable Stereo Mix), then set Chromium's input to Stereo Mix.
- **macOS**: install a virtual audio driver such as
  [BlackHole](https://github.com/ExistentialAudio/BlackHole) or
  [Loopback](https://rogueamoeba.com/loopback/) and route app output into it, then set
  Chromium's input to the virtual device.
