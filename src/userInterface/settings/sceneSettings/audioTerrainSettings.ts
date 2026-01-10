import { setSceneSettings } from "../settingsManager";
import { AudioTerrainSetting } from "@/src/scene/scenes/audioTerrain/setting";

export function audioTerrainSettings(
    sceneName: string,
    settings: AudioTerrainSetting,
    settingsFolder: any,
    isExternalUi: boolean
): void {
    // Grid & Movement
    settingsFolder.add(settings, 'gridWidth', 16, 60).step(1).name('Grid Width').onChange((value: number) => {
        settings.gridWidth = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'gridHeight', 12, 40).step(1).name('Grid Depth').onChange((value: number) => {
        settings.gridHeight = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'tileSize', 1.0, 100.0).name('Tile Size').onChange((value: number) => {
        settings.tileSize = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'scrollSpeed', 0.0, 0.02).name('Scroll Speed').onChange((value: number) => {
        settings.scrollSpeed = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'audioScrollMultiplier', 0.0, 2.0).name('Audio Scroll Boost').onChange((value: number) => {
        settings.audioScrollMultiplier = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });

    // Terrain Shape
    settingsFolder.add(settings, 'mountainHeight', 10, 100).name('Mountain Height').onChange((value: number) => {
        settings.mountainHeight = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'noiseScale', 0.01, 0.2).name('Terrain Roughness').onChange((value: number) => {
        settings.noiseScale = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'audioHeightMultiplier', 0.0, 2.0).name('Audio Height Boost').onChange((value: number) => {
        settings.audioHeightMultiplier = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });

    // Camera
    settingsFolder.add(settings, 'cameraHeight', 50, 250).name('Camera Height').onChange((value: number) => {
        settings.cameraHeight = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'cameraDistance', 5, 50).name('Camera Distance').onChange((value: number) => {
        settings.cameraDistance = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'horizonOffset', -100, 300).name('Horizon Position').onChange((value: number) => {
        settings.horizonOffset = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });

    // Render Mode
    settingsFolder.add(settings, 'wireframeMode').name('Wireframe Mode').onChange((value: boolean) => {
        settings.wireframeMode = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'lineWidth', 0.5, 4.0).name('Line Width').onChange((value: number) => {
        settings.lineWidth = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'glowIntensity', 0.0, 1.0).name('Glow Intensity').onChange((value: number) => {
        settings.glowIntensity = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });

    // Sun
    settingsFolder.add(settings, 'showSun').name('Show Sun').onChange((value: boolean) => {
        settings.showSun = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'sunSize', 20, 200).name('Sun Size').onChange((value: number) => {
        settings.sunSize = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'sunY', 0.3, 0.9).name('Sun Height').onChange((value: number) => {
        settings.sunY = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });

    // Terrain Colors
    settingsFolder.add(settings, 'terrainLowR', 0.0, 1.0).name('Low Color Red').onChange((value: number) => {
        settings.terrainLowR = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'terrainLowG', 0.0, 1.0).name('Low Color Green').onChange((value: number) => {
        settings.terrainLowG = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'terrainLowB', 0.0, 1.0).name('Low Color Blue').onChange((value: number) => {
        settings.terrainLowB = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'terrainHighR', 0.0, 1.0).name('High Color Red').onChange((value: number) => {
        settings.terrainHighR = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'terrainHighG', 0.0, 1.0).name('High Color Green').onChange((value: number) => {
        settings.terrainHighG = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
    settingsFolder.add(settings, 'terrainHighB', 0.0, 1.0).name('High Color Blue').onChange((value: number) => {
        settings.terrainHighB = value;
        setSceneSettings(settings, sceneName, isExternalUi);
    });
}
