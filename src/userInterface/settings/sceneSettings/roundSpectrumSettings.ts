import type { RoundSpectrumSetting } from '@/src/scene/scenes/roundSpectrum/setting';
import { setSceneSettings } from '../settingsManager';

export function roundSpectrumSettings(
    sceneName: string,
    settings: RoundSpectrumSetting,
    settingsFolder: any,
    isExternalUi: boolean,
): void {
    // Color Settings
    const colorFolder = settingsFolder.addFolder('Color Settings');
    colorFolder
        .add(settings, 'colorStrength', 0.0, 2.0)
        .name('Color Intensity')
        .onChange((value: number) => {
            settings.colorStrength = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    colorFolder
        .add(settings, 'colorOffset', 0.0, Math.PI * 2)
        .name('Color Phase Offset')
        .onChange((value: number) => {
            settings.colorOffset = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    colorFolder
        .add(settings, 'colorWidth', 0.0, 1.0)
        .name('Color Transition Speed')
        .onChange((value: number) => {
            settings.colorWidth = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    colorFolder
        .add(settings, 'colorBoost', 0.0, 1.0)
        .name('Color Boost')
        .onChange((value: number) => {
            settings.colorBoost = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    colorFolder
        .add(settings, 'colorAnimationSpeed', 0.0, 0.5)
        .name('Color Animation Speed')
        .onChange((value: number) => {
            settings.colorAnimationSpeed = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    // Spectrum Settings
    const spectrumFolder = settingsFolder.addFolder('Spectrum Settings');
    spectrumFolder
        .add(settings, 'spectrumJumps', 0.0, 10.0)
        .step(1)
        .name('Frequency Jump')
        .onChange((value: number) => {
            settings.spectrumJumps = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    spectrumFolder
        .add(settings, 'musicColorInfluenceReducer', 0.1, 1000)
        .name('Audio Color Influence')
        .onChange((value: number) => {
            settings.musicColorInfluenceReducer = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    spectrumFolder
        .add(settings, 'musicHeightPower', 0.0, 0.1)
        .name('Audio Height Response')
        .onChange((value: number) => {
            settings.musicHeightPower = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    spectrumFolder
        .add(settings, 'heightMultiplier', 0.0, 2.0)
        .name('Height Multiplier')
        .onChange((value: number) => {
            settings.heightMultiplier = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    // Performance Settings
    const perfFolder = settingsFolder.addFolder('Performance');
    perfFolder
        .add(settings, 'maxBars', 64, 512)
        .step(1)
        .name('Max Bars')
        .onChange((value: number) => {
            settings.maxBars = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    perfFolder
        .add(settings, 'barSkip', 1, 8)
        .step(1)
        .name('Bar Skip (Lower = More Bars)')
        .onChange((value: number) => {
            settings.barSkip = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    // Geometry Settings
    const geometryFolder = settingsFolder.addFolder('Geometry Settings');
    geometryFolder
        .add(settings, 'innerRadiusDivisor', 5, 50)
        .name('Inner Radius Size')
        .onChange((value: number) => {
            settings.innerRadiusDivisor = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    geometryFolder
        .add(settings, 'staticWidth', 0.5, 3.0)
        .name('Base Bar Width')
        .onChange((value: number) => {
            settings.staticWidth = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    geometryFolder
        .add(settings, 'circleMax', Math.PI, Math.PI * 2)
        .name('Circle Coverage (2π = Full Circle)')
        .onChange((value: number) => {
            settings.circleMax = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    // Visual Enhancements
    const effectsFolder = settingsFolder.addFolder('Visual Effects');
    effectsFolder
        .add(settings, 'enableRotation')
        .name('Enable Rotation')
        .onChange((value: boolean) => {
            settings.enableRotation = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    effectsFolder
        .add(settings, 'rotationSpeed', 0.0, 0.1)
        .name('Rotation Speed')
        .onChange((value: number) => {
            settings.rotationSpeed = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    effectsFolder
        .add(settings, 'enableGlow')
        .name('Enable Glow')
        .onChange((value: boolean) => {
            settings.enableGlow = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    effectsFolder
        .add(settings, 'glowIntensity', 0, 50)
        .name('Glow Intensity')
        .onChange((value: number) => {
            settings.glowIntensity = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    effectsFolder
        .add(settings, 'glowThreshold', 0, 255)
        .name('Glow Threshold')
        .onChange((value: number) => {
            settings.glowThreshold = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    effectsFolder
        .add(settings, 'enableTrails')
        .name('Enable Motion Trails')
        .onChange((value: boolean) => {
            settings.enableTrails = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    effectsFolder
        .add(settings, 'trailOpacity', 0.0, 0.5)
        .name('Trail Opacity')
        .onChange((value: number) => {
            settings.trailOpacity = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    effectsFolder
        .add(settings, 'showCenterCircle')
        .name('Show Center Circle')
        .onChange((value: boolean) => {
            settings.showCenterCircle = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    effectsFolder
        .add(settings, 'centerCircleOpacity', 0.0, 1.0)
        .name('Center Circle Opacity')
        .onChange((value: number) => {
            settings.centerCircleOpacity = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
}
