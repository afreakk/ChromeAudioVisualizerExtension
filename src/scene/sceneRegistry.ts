import type { IScene } from '@/src/scene/scene';
import { sceneNames } from '@/src/scene/sceneNames';
import type { ISceneSetting } from '@/src/scene/sceneSetting';
import { AudioTerrain } from '@/src/scene/scenes/audioTerrain/audioTerrain';
import { AudioTerrainSetting } from '@/src/scene/scenes/audioTerrain/setting';
import { Butterchurn } from '@/src/scene/scenes/butterchurn/butterchurn';
import { ButterchurnSetting } from '@/src/scene/scenes/butterchurn/setting';
import { ChromaWave } from '@/src/scene/scenes/chromaWave/chromaWave';
import { ChromaWaveSetting } from '@/src/scene/scenes/chromaWave/setting';
import { CircleBurst } from '@/src/scene/scenes/circleBurst/circleBurst';
import { CircleBurstSetting } from '@/src/scene/scenes/circleBurst/setting';
import { CosmicAurora } from '@/src/scene/scenes/cosmicAurora/cosmicAurora';
import { CosmicAuroraSetting } from '@/src/scene/scenes/cosmicAurora/setting';
import { Dancing3DCubes } from '@/src/scene/scenes/dancing3DCubes/dancing3DCubes';
import { Dancing3DCubesSetting } from '@/src/scene/scenes/dancing3DCubes/setting';
import { DancingCubes3DSinus } from '@/src/scene/scenes/dancingCubes3DSinus/dancingCubes3DSinus';
import { DancingCubes3DSinusSetting } from '@/src/scene/scenes/dancingCubes3DSinus/setting';
import { DancingHorizon } from '@/src/scene/scenes/dancingHorizon/dancingHorizon';
import { DancingHorizonSetting } from '@/src/scene/scenes/dancingHorizon/setting';
import { FloatingCubes } from '@/src/scene/scenes/floatingCubes/floatingCubes';
import { FloatingCubesSetting } from '@/src/scene/scenes/floatingCubes/setting';
import { FrostFire } from '@/src/scene/scenes/frostfire/frostfire';
import { FrostFireSetting } from '@/src/scene/scenes/frostfire/setting';
import { HexagonPulse } from '@/src/scene/scenes/hexagonPulse/hexagonPulse';
import { HexagonPulseSetting } from '@/src/scene/scenes/hexagonPulse/setting';
import { NeuralWeb } from '@/src/scene/scenes/neuralWeb/neuralWeb';
import { NeuralWebSetting } from '@/src/scene/scenes/neuralWeb/setting';
import { OrbitalRing } from '@/src/scene/scenes/orbitalRing/orbitalRing';
import { OrbitalRingSetting } from '@/src/scene/scenes/orbitalRing/setting';
import { PaintSplash } from '@/src/scene/scenes/paintSplash/paintSplash';
import { PaintSplashSetting } from '@/src/scene/scenes/paintSplash/setting';
import { ParticleCircle } from '@/src/scene/scenes/particleCircle/particleCircle';
import { ParticleCircleSetting } from '@/src/scene/scenes/particleCircle/setting';
import { PsychedelicCube } from '@/src/scene/scenes/psychedelicCube/psychedelicCube';
import { PsychedelicCubeSetting } from '@/src/scene/scenes/psychedelicCube/setting';
import { RoundSpectrum } from '@/src/scene/scenes/roundSpectrum/roundSpectrum';
import { RoundSpectrumSetting } from '@/src/scene/scenes/roundSpectrum/setting';
import { SeventiesSceneSetting } from '@/src/scene/scenes/seventiesScene/setting';
import { SeventiesScene } from '@/src/scene/scenes/seventiesScene/seventiesScene';
// Setting classes
import { SunFlowerSetting } from '@/src/scene/scenes/sunflower/setting';
// Scene classes
import { SunFlower } from '@/src/scene/scenes/sunflower/sunflower';
import { SynthBarsSetting } from '@/src/scene/scenes/synthBars/setting';
import { SynthBars } from '@/src/scene/scenes/synthBars/synthBars';
import { WormSceneSetting } from '@/src/scene/scenes/wormScene/setting';
import { WormScene } from '@/src/scene/scenes/wormScene/wormScene';
import { audioTerrainSettings } from '@/src/userInterface/settings/sceneSettings/audioTerrainSettings';
import { buildButterchurnSetting } from '@/src/userInterface/settings/sceneSettings/butterchurnSettings';
import { chromaWaveSettings } from '@/src/userInterface/settings/sceneSettings/chromaWaveSettings';
import { circleBurstSettings } from '@/src/userInterface/settings/sceneSettings/circleBurstSettings';
import { cosmicAuroraSettings } from '@/src/userInterface/settings/sceneSettings/cosmicAuroraSettings';
import { dancing3DCubesSettings } from '@/src/userInterface/settings/sceneSettings/dancing3DCubesSettings';
import { dancingCubes3DSinusSettings } from '@/src/userInterface/settings/sceneSettings/dancingCubes3DSinusSettings';
import { dancingHorizonSettings } from '@/src/userInterface/settings/sceneSettings/dancingHorizonSettings';
import { floatingCubesSettings } from '@/src/userInterface/settings/sceneSettings/floatingCubesSettings';
import { frostFireSettings } from '@/src/userInterface/settings/sceneSettings/frostfireSettings';
import { hexagonPulseSettings } from '@/src/userInterface/settings/sceneSettings/hexagonPulseSettings';
import { neuralWebSettings } from '@/src/userInterface/settings/sceneSettings/neuralWebSettings';
import { orbitalRingSettings } from '@/src/userInterface/settings/sceneSettings/orbitalRingSettings';
import { paintSplashSettings } from '@/src/userInterface/settings/sceneSettings/paintSplashSettings';
import { particleCircleSettings } from '@/src/userInterface/settings/sceneSettings/particleCircleSettings';
import { psychedelicCubeSettings } from '@/src/userInterface/settings/sceneSettings/psychedelicCubeSettings';
import { roundSpectrumSettings } from '@/src/userInterface/settings/sceneSettings/roundSpectrumSettings';
import { seventiesSceneSettings } from '@/src/userInterface/settings/sceneSettings/seventiesSceneSettings';
// Settings UI builders
import { sunFlowerSettings } from '@/src/userInterface/settings/sceneSettings/sunflowerSettings';
import { synthBarSettings } from '@/src/userInterface/settings/sceneSettings/synthBarSettings';
import { wormSceneSettings } from '@/src/userInterface/settings/sceneSettings/wormSceneSettings';

export interface SceneRegistryEntry {
    sceneName: sceneNames;
    createScene: () => IScene;
    createDefaultSettings: () => ISceneSetting;
    buildSettingsUI: (
        sceneName: string,
        settings: any,
        settingsFolder: any,
        isExternalUi: boolean,
        onCleanup?: (cb: () => void) => void,
    ) => void;
}

export const sceneRegistry: SceneRegistryEntry[] = [];

function registerScene(entry: SceneRegistryEntry): void {
    sceneRegistry.push(entry);
}

registerScene({
    sceneName: sceneNames.Butterchurn,
    createScene: () => new Butterchurn(),
    createDefaultSettings: () => new ButterchurnSetting(),
    buildSettingsUI: buildButterchurnSetting,
});
registerScene({
    sceneName: sceneNames.SunFlower,
    createScene: () => new SunFlower(),
    createDefaultSettings: () => new SunFlowerSetting(),
    buildSettingsUI: sunFlowerSettings,
});
registerScene({
    sceneName: sceneNames.FrostFire,
    createScene: () => new FrostFire(),
    createDefaultSettings: () => new FrostFireSetting(),
    buildSettingsUI: frostFireSettings,
});
registerScene({
    sceneName: sceneNames.SynthBars,
    createScene: () => new SynthBars(),
    createDefaultSettings: () => new SynthBarsSetting(),
    buildSettingsUI: synthBarSettings,
});
registerScene({
    sceneName: sceneNames.DancingHorizon,
    createScene: () => new DancingHorizon(),
    createDefaultSettings: () => new DancingHorizonSetting(),
    buildSettingsUI: dancingHorizonSettings,
});
registerScene({
    sceneName: sceneNames.DancingCubes3DSinus,
    createScene: () => new DancingCubes3DSinus(),
    createDefaultSettings: () => new DancingCubes3DSinusSetting(),
    buildSettingsUI: dancingCubes3DSinusSettings,
});
registerScene({
    sceneName: sceneNames.WormScene,
    createScene: () => new WormScene(),
    createDefaultSettings: () => new WormSceneSetting(),
    buildSettingsUI: wormSceneSettings,
});
registerScene({
    sceneName: sceneNames.Dancing3DCubes,
    createScene: () => new Dancing3DCubes(),
    createDefaultSettings: () => new Dancing3DCubesSetting(),
    buildSettingsUI: dancing3DCubesSettings,
});
registerScene({
    sceneName: sceneNames.RoundSpectrum,
    createScene: () => new RoundSpectrum(),
    createDefaultSettings: () => new RoundSpectrumSetting(),
    buildSettingsUI: roundSpectrumSettings,
});
registerScene({
    sceneName: sceneNames.SeventiesScene,
    createScene: () => new SeventiesScene(),
    createDefaultSettings: () => new SeventiesSceneSetting(),
    buildSettingsUI: seventiesSceneSettings,
});
registerScene({
    sceneName: sceneNames.ParticleCircle,
    createScene: () => new ParticleCircle(),
    createDefaultSettings: () => new ParticleCircleSetting(),
    buildSettingsUI: particleCircleSettings,
});
registerScene({
    sceneName: sceneNames.PsychedelicCube,
    createScene: () => new PsychedelicCube(),
    createDefaultSettings: () => new PsychedelicCubeSetting(),
    buildSettingsUI: psychedelicCubeSettings,
});
registerScene({
    sceneName: sceneNames.AudioTerrain,
    createScene: () => new AudioTerrain(),
    createDefaultSettings: () => new AudioTerrainSetting(),
    buildSettingsUI: audioTerrainSettings,
});
registerScene({
    sceneName: sceneNames.CircleBurst,
    createScene: () => new CircleBurst(),
    createDefaultSettings: () => new CircleBurstSetting(),
    buildSettingsUI: circleBurstSettings,
});
registerScene({
    sceneName: sceneNames.PaintSplash,
    createScene: () => new PaintSplash(),
    createDefaultSettings: () => new PaintSplashSetting(),
    buildSettingsUI: paintSplashSettings,
});
registerScene({
    sceneName: sceneNames.HexagonPulse,
    createScene: () => new HexagonPulse(),
    createDefaultSettings: () => new HexagonPulseSetting(),
    buildSettingsUI: hexagonPulseSettings,
});
registerScene({
    sceneName: sceneNames.OrbitalRing,
    createScene: () => new OrbitalRing(),
    createDefaultSettings: () => new OrbitalRingSetting(),
    buildSettingsUI: orbitalRingSettings,
});
registerScene({
    sceneName: sceneNames.NeuralWeb,
    createScene: () => new NeuralWeb(),
    createDefaultSettings: () => new NeuralWebSetting(),
    buildSettingsUI: neuralWebSettings,
});
registerScene({
    sceneName: sceneNames.FloatingCubes,
    createScene: () => new FloatingCubes(),
    createDefaultSettings: () => new FloatingCubesSetting(),
    buildSettingsUI: floatingCubesSettings,
});
registerScene({
    sceneName: sceneNames.ChromaWave,
    createScene: () => new ChromaWave(),
    createDefaultSettings: () => new ChromaWaveSetting(),
    buildSettingsUI: chromaWaveSettings,
});
registerScene({
    sceneName: sceneNames.CosmicAurora,
    createScene: () => new CosmicAurora(),
    createDefaultSettings: () => new CosmicAuroraSetting(),
    buildSettingsUI: cosmicAuroraSettings,
});
