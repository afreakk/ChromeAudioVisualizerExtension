import { setSceneSettings } from "../settingsManager";
import { PulsingGridSetting } from "@/src/scene/scenes/pulsingGrid/setting";

export function pulsingGridSettings(
    sceneName: string,
    settings: PulsingGridSetting,
    settingsFolder: any,
    isExternalUi: boolean
): void {
    // Grid Layout
    settingsFolder.add(settings, 'rows', 2, 15).step(1).name('Grid Rows').onChange((value: number) => {
        settings.rows = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'columns', 2, 20).step(1).name('Grid Columns').onChange((value: number) => {
        settings.columns = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'padding', 0, 200).name('Edge Padding').onChange((value: number) => {
        settings.padding = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'gridScale', 0.5, 1.0).name('Grid Scale').onChange((value: number) => {
        settings.gridScale = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });

    // Circle Sizing
    settingsFolder.add(settings, 'baseSize', 5, 50).name('Base Circle Size').onChange((value: number) => {
        settings.baseSize = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'minSize', 1, 30).name('Min Circle Size').onChange((value: number) => {
        settings.minSize = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'maxSize', 30, 150).name('Max Circle Size').onChange((value: number) => {
        settings.maxSize = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'sizeReactivity', 0.0, 1.0).name('Size Reactivity').onChange((value: number) => {
        settings.sizeReactivity = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });

    // Colors
    settingsFolder.add(settings, 'colorSpeed', 0.0, 0.02).name('Color Cycle Speed').onChange((value: number) => {
        settings.colorSpeed = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'colorReactivity', 0.0, 2.0).name('Color Brightness').onChange((value: number) => {
        settings.colorReactivity = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'colorSpread', 0.0, 0.5).name('Color Variation').onChange((value: number) => {
        settings.colorSpread = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'saturation', 0.0, 1.0).name('Color Saturation').onChange((value: number) => {
        settings.saturation = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });

    // Effects
    settingsFolder.add(settings, 'glowIntensity', 0.0, 1.0).name('Glow Intensity').onChange((value: number) => {
        settings.glowIntensity = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'glowSize', 0, 50).name('Glow Size').onChange((value: number) => {
        settings.glowSize = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'showConnections').name('Show Connections').onChange((value: boolean) => {
        settings.showConnections = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'connectionOpacity', 0.0, 1.0).name('Connection Opacity').onChange((value: number) => {
        settings.connectionOpacity = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'connectionThreshold', 0.0, 1.0).name('Connection Threshold').onChange((value: number) => {
        settings.connectionThreshold = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });

    // Animation
    settingsFolder.add(settings, 'gridRotation', -45, 45).name('Grid Rotation').onChange((value: number) => {
        settings.gridRotation = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'pulseSmoothing', 0.0, 0.9).name('Pulse Smoothing').onChange((value: number) => {
        settings.pulseSmoothing = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });

    // Background
    settingsFolder.add(settings, 'bgAlpha', 0.05, 1.0).name('Trail Length').onChange((value: number) => {
        settings.bgAlpha = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
}
