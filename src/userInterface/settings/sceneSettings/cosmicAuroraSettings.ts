import type { CosmicAuroraSetting } from '@/src/scene/scenes/cosmicAurora/setting';
import { setSceneSettings } from '../settingsManager';

export function cosmicAuroraSettings(
    sceneName: string,
    settings: CosmicAuroraSetting,
    settingsFolder: any,
    isExternalUi: boolean,
): void {
    // Aurora folder
    const auroraFolder = settingsFolder.addFolder('Aurora');

    auroraFolder
        .add(settings, 'auroraIntensity', 0.01, 1.0)
        .name('Intensity')
        .onChange((value: number) => {
            settings.auroraIntensity = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    auroraFolder
        .add(settings, 'auroraSpeed', 0.1, 3.0)
        .name('Speed')
        .onChange((value: number) => {
            settings.auroraSpeed = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    auroraFolder
        .add(settings, 'auroraWaveCount', 2, 10, 1)
        .name('Wave Count')
        .onChange((value: number) => {
            settings.auroraWaveCount = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    auroraFolder
        .addColor(settings, 'auroraColor1')
        .name('Color 1')
        .onChange((value: string) => {
            settings.auroraColor1 = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    auroraFolder
        .addColor(settings, 'auroraColor2')
        .name('Color 2')
        .onChange((value: string) => {
            settings.auroraColor2 = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    auroraFolder
        .addColor(settings, 'auroraColor3')
        .name('Color 3')
        .onChange((value: string) => {
            settings.auroraColor3 = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    auroraFolder.open();

    // Stars folder
    const starsFolder = settingsFolder.addFolder('Stars');

    starsFolder
        .add(settings, 'starCount', 50, 500, 10)
        .name('Star Count')
        .onChange((value: number) => {
            settings.starCount = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    starsFolder
        .add(settings, 'starTwinkleSpeed', 0.1, 3.0)
        .name('Twinkle Speed')
        .onChange((value: number) => {
            settings.starTwinkleSpeed = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    starsFolder
        .add(settings, 'showShootingStars')
        .name('Shooting Stars')
        .onChange((value: boolean) => {
            settings.showShootingStars = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    // Nebula folder
    const nebulaFolder = settingsFolder.addFolder('Nebula');

    nebulaFolder
        .add(settings, 'nebulaIntensity', 0, 1.5)
        .name('Intensity')
        .onChange((value: number) => {
            settings.nebulaIntensity = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    nebulaFolder
        .add(settings, 'nebulaSpeed', 0.1, 2.0)
        .name('Speed')
        .onChange((value: number) => {
            settings.nebulaSpeed = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    // Audio folder
    const audioFolder = settingsFolder.addFolder('Audio Reactivity');

    audioFolder
        .add(settings, 'audioSensitivity', 0.5, 10.0)
        .name('Sensitivity')
        .onChange((value: number) => {
            settings.audioSensitivity = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    audioFolder
        .add(settings, 'bassReactivity', 0.5, 4.0)
        .name('Bass Boost')
        .onChange((value: number) => {
            settings.bassReactivity = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    audioFolder
        .add(settings, 'colorCycleSpeed', 0, 2.0)
        .name('Color Cycle')
        .onChange((value: number) => {
            settings.colorCycleSpeed = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    audioFolder.open();

    // Effects folder
    const effectsFolder = settingsFolder.addFolder('Effects');

    effectsFolder
        .add(settings, 'glowIntensity', 0, 1.0)
        .name('Glow Intensity')
        .onChange((value: number) => {
            settings.glowIntensity = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    effectsFolder
        .add(settings, 'trailLength', 0.8, 0.99)
        .name('Trail Length')
        .onChange((value: number) => {
            settings.trailLength = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
}
