import type { Dancing3DCubesSetting } from '@/src/scene/scenes/dancing3DCubes/setting';
import { setSceneSettings } from '../settingsManager';

export function dancing3DCubesSettings(
    sceneName: string,
    settings: Dancing3DCubesSetting,
    settingsFolder: any,
    isExternalUi: boolean,
): void {
    // Movement & Animation
    const movementFolder = settingsFolder.addFolder('Movement & Animation');
    movementFolder
        .add(settings, 'danceSpeed', 0.0, 0.02)
        .name('Dance Speed')
        .onChange((value: number) => {
            settings.danceSpeed = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    movementFolder
        .add(settings, 'directionChangeSpeed', 0.0, 1.0)
        .name('Direction Change Speed')
        .onChange((value: number) => {
            settings.directionChangeSpeed = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    movementFolder
        .add(settings, 'colorChangeSpeed', 0.0, 0.1)
        .name('Color Change Speed')
        .onChange((value: number) => {
            settings.colorChangeSpeed = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    // Cube Properties
    const cubeFolder = settingsFolder.addFolder('Cube Properties');
    cubeFolder
        .add(settings, 'cubeCount', 1, 100)
        .step(1)
        .name('Number of Cubes')
        .onChange((value: number) => {
            settings.cubeCount = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    cubeFolder
        .add(settings, 'width', 0.0, 0.2)
        .name('Cube Width Scale')
        .onChange((value: number) => {
            settings.width = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    cubeFolder
        .add(settings, 'height', 0.0, 0.2)
        .name('Cube Height Scale')
        .onChange((value: number) => {
            settings.height = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    cubeFolder
        .add(settings, 'cubeAlphaModifier', 0.0, 1.0)
        .name('Cube Transparency')
        .onChange((value: number) => {
            settings.cubeAlphaModifier = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    // Colors
    const colorFolder = settingsFolder.addFolder('Colors');
    colorFolder
        .add(settings, 'colorStrength', 0.0, 3.0)
        .name('Color Intensity')
        .onChange((value: number) => {
            settings.colorStrength = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    colorFolder
        .add(settings, 'textureSinusIntensity', 0.0, 0.5)
        .name('Color Wave Intensity')
        .onChange((value: number) => {
            settings.textureSinusIntensity = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    // Space Boundaries
    const spaceFolder = settingsFolder.addFolder('Space Boundaries');
    spaceFolder
        .add(settings, 'spaceHeight', 10, 500)
        .name('Vertical Limit')
        .onChange((value: number) => {
            settings.spaceHeight = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    spaceFolder
        .add(settings, 'spaceWidth', 10, 500)
        .name('Horizontal Limit')
        .onChange((value: number) => {
            settings.spaceWidth = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    spaceFolder
        .add(settings, 'spaceZBegin', 10, 200)
        .name('Near Z Boundary')
        .onChange((value: number) => {
            settings.spaceZBegin = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    spaceFolder
        .add(settings, 'spaceZEnd', 100, 1000)
        .name('Far Z Boundary')
        .onChange((value: number) => {
            settings.spaceZEnd = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    // Background
    const bgFolder = settingsFolder.addFolder('Background');
    bgFolder
        .add(settings, 'bgRed', 0.0, 1.0)
        .name('Background Red')
        .onChange((value: number) => {
            settings.bgRed = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    bgFolder
        .add(settings, 'bgGreen', 0.0, 1.0)
        .name('Background Green')
        .onChange((value: number) => {
            settings.bgGreen = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    bgFolder
        .add(settings, 'bgBlue', 0.0, 1.0)
        .name('Background Blue')
        .onChange((value: number) => {
            settings.bgBlue = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    bgFolder
        .add(settings, 'bgAlpha', 0.0, 1.0)
        .name('Background Alpha')
        .onChange((value: number) => {
            settings.bgAlpha = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
}
