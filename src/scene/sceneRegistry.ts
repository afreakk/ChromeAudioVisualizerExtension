import { IScene } from '@/src/scene/scene';
import { ISceneSetting } from '@/src/scene/sceneSetting';
import { sceneNames } from '@/src/scene/sceneNames';

// Scene classes
import { SunFlower } from '@/src/scene/scenes/sunflower/sunflower';
import { SynthBars } from '@/src/scene/scenes/synthBars/synthBars';
import { FrostFire } from '@/src/scene/scenes/frostfire/frostfire';
import { DancingHorizon } from '@/src/scene/scenes/dancingHorizon/dancingHorizon';
import { Butterchurn } from '@/src/scene/scenes/butterchurn/butterchurn';
import { DancingCubes3DSinus } from '@/src/scene/scenes/dancingCubes3DSinus/dancingCubes3DSinus';
import { WormScene } from '@/src/scene/scenes/wormScene/wormScene';
import { Dancing3DCubes } from '@/src/scene/scenes/dancing3DCubes/dancing3DCubes';
import { RoundSpectrum } from '@/src/scene/scenes/roundSpectrum/roundSpectrum';
import { SeventiesScene } from '@/src/scene/scenes/seventiesScene/seventiesScene';
import { ParticleCircle } from '@/src/scene/scenes/particleCircle/particleCircle';
import { PsychedelicCube } from '@/src/scene/scenes/psychedelicCube/psychedelicCube';
import { PulsingGrid } from '@/src/scene/scenes/pulsingGrid/pulsingGrid';
import { AudioTerrain } from '@/src/scene/scenes/audioTerrain/audioTerrain';
import { CircleBurst } from '@/src/scene/scenes/circleBurst/circleBurst';
import { PaintSplash } from '@/src/scene/scenes/paintSplash/paintSplash';
import { HexagonPulse } from '@/src/scene/scenes/hexagonPulse/hexagonPulse';
import { OrbitalRing } from '@/src/scene/scenes/orbitalRing/orbitalRing';
import { NeuralWeb } from '@/src/scene/scenes/neuralWeb/neuralWeb';
import { FloatingCubes } from '@/src/scene/scenes/floatingCubes/floatingCubes';
import { ChromaWave } from '@/src/scene/scenes/chromaWave/chromaWave';
import { CosmicAurora } from '@/src/scene/scenes/cosmicAurora/cosmicAurora';

// Setting classes
import { SunFlowerSetting } from '@/src/scene/scenes/sunflower/setting';
import { SynthBarsSetting } from '@/src/scene/scenes/synthBars/setting';
import { FrostFireSetting } from '@/src/scene/scenes/frostfire/settings';
import { DancingHorizonSetting } from '@/src/scene/scenes/dancingHorizon/setting';
import { ButterchurnSettings } from '@/src/scene/scenes/butterchurn/setting';
import { DancingCubes3DSinusSetting } from '@/src/scene/scenes/dancingCubes3DSinus/setting';
import { WormSceneSetting } from '@/src/scene/scenes/wormScene/setting';
import { Dancing3DCubesSetting } from '@/src/scene/scenes/dancing3DCubes/setting';
import { RoundSpectrumSetting } from '@/src/scene/scenes/roundSpectrum/setting';
import { SeventiesSceneSetting } from '@/src/scene/scenes/seventiesScene/setting';
import { ParticleCircleSetting } from '@/src/scene/scenes/particleCircle/setting';
import { PsychedelicCubeSetting } from '@/src/scene/scenes/psychedelicCube/setting';
import { PulsingGridSetting } from '@/src/scene/scenes/pulsingGrid/setting';
import { AudioTerrainSetting } from '@/src/scene/scenes/audioTerrain/setting';
import { CircleBurstSetting } from '@/src/scene/scenes/circleBurst/setting';
import { PaintSplashSetting } from '@/src/scene/scenes/paintSplash/setting';
import { HexagonPulseSetting } from '@/src/scene/scenes/hexagonPulse/setting';
import { OrbitalRingSetting } from '@/src/scene/scenes/orbitalRing/setting';
import { NeuralWebSetting } from '@/src/scene/scenes/neuralWeb/setting';
import { FloatingCubesSetting } from '@/src/scene/scenes/floatingCubes/setting';
import { ChromaWaveSetting } from '@/src/scene/scenes/chromaWave/setting';
import { CosmicAuroraSetting } from '@/src/scene/scenes/cosmicAurora/setting';

// Settings UI builders
import { sunFlowerSettings } from '@/src/userInterface/settings/sceneSettings/sunflowerSettings';
import { synthBarSettings } from '@/src/userInterface/settings/sceneSettings/synthBarSettings';
import { frostFireSettings } from '@/src/userInterface/settings/sceneSettings/frostfireSettings';
import { dancingHorizonSettings } from '@/src/userInterface/settings/sceneSettings/dancingHorizonSettings';
import { buildButterchurnSetting } from '@/src/userInterface/settings/sceneSettings/butterchurnSettings';
import { dancingCubes3DSinusSettings } from '@/src/userInterface/settings/sceneSettings/dancingCubes3DSinusSettings';
import { wormSceneSettings } from '@/src/userInterface/settings/sceneSettings/wormSceneSettings';
import { dancing3DCubesSettings } from '@/src/userInterface/settings/sceneSettings/dancing3DCubesSettings';
import { roundSpectrumSettings } from '@/src/userInterface/settings/sceneSettings/roundSpectrumSettings';
import { seventiesSceneSettings } from '@/src/userInterface/settings/sceneSettings/seventiesSceneSettings';
import { particleCircleSettings } from '@/src/userInterface/settings/sceneSettings/particleCircleSettings';
import { psychedelicCubeSettings } from '@/src/userInterface/settings/sceneSettings/psychedelicCubeSettings';
import { pulsingGridSettings } from '@/src/userInterface/settings/sceneSettings/pulsingGridSettings';
import { audioTerrainSettings } from '@/src/userInterface/settings/sceneSettings/audioTerrainSettings';
import { circleBurstSettings } from '@/src/userInterface/settings/sceneSettings/circleBurstSettings';
import { paintSplashSettings } from '@/src/userInterface/settings/sceneSettings/paintSplashSettings';
import { hexagonPulseSettings } from '@/src/userInterface/settings/sceneSettings/hexagonPulseSettings';
import { orbitalRingSettings } from '@/src/userInterface/settings/sceneSettings/orbitalRingSettings';
import { neuralWebSettings } from '@/src/userInterface/settings/sceneSettings/neuralWebSettings';
import { floatingCubesSettings } from '@/src/userInterface/settings/sceneSettings/floatingCubesSettings';
import { chromaWaveSettings } from '@/src/userInterface/settings/sceneSettings/chromaWaveSettings';
import { cosmicAuroraSettings } from '@/src/userInterface/settings/sceneSettings/cosmicAuroraSettings';

export interface SceneRegistryEntry {
    sceneName: sceneNames;
    createScene: () => IScene;
    createDefaultSettings: () => ISceneSetting;
    buildSettingsUI: (sceneName: string, settings: any, settingsFolder: any, isExternalUi: boolean) => void;
}

export const sceneRegistry: SceneRegistryEntry[] = [];

function registerScene(entry: SceneRegistryEntry): void {
    sceneRegistry.push(entry);
}

registerScene({ sceneName: sceneNames.Butterchurn, createScene: () => new Butterchurn(), createDefaultSettings: () => new ButterchurnSettings(), buildSettingsUI: buildButterchurnSetting });
registerScene({ sceneName: sceneNames.SunFlower, createScene: () => new SunFlower(), createDefaultSettings: () => new SunFlowerSetting(), buildSettingsUI: sunFlowerSettings });
registerScene({ sceneName: sceneNames.FrostFire, createScene: () => new FrostFire(), createDefaultSettings: () => new FrostFireSetting(), buildSettingsUI: frostFireSettings });
registerScene({ sceneName: sceneNames.SynthBars, createScene: () => new SynthBars(), createDefaultSettings: () => new SynthBarsSetting(), buildSettingsUI: synthBarSettings });
registerScene({ sceneName: sceneNames.DancingHorizon, createScene: () => new DancingHorizon(), createDefaultSettings: () => new DancingHorizonSetting(), buildSettingsUI: dancingHorizonSettings });
registerScene({ sceneName: sceneNames.DancingCubes3DSinus, createScene: () => new DancingCubes3DSinus(), createDefaultSettings: () => new DancingCubes3DSinusSetting(), buildSettingsUI: dancingCubes3DSinusSettings });
registerScene({ sceneName: sceneNames.WormScene, createScene: () => new WormScene(), createDefaultSettings: () => new WormSceneSetting(), buildSettingsUI: wormSceneSettings });
registerScene({ sceneName: sceneNames.Dancing3DCubes, createScene: () => new Dancing3DCubes(), createDefaultSettings: () => new Dancing3DCubesSetting(), buildSettingsUI: dancing3DCubesSettings });
registerScene({ sceneName: sceneNames.RoundSpectrum, createScene: () => new RoundSpectrum(), createDefaultSettings: () => new RoundSpectrumSetting(), buildSettingsUI: roundSpectrumSettings });
registerScene({ sceneName: sceneNames.SeventiesScene, createScene: () => new SeventiesScene(), createDefaultSettings: () => new SeventiesSceneSetting(), buildSettingsUI: seventiesSceneSettings });
registerScene({ sceneName: sceneNames.ParticleCircle, createScene: () => new ParticleCircle(), createDefaultSettings: () => new ParticleCircleSetting(), buildSettingsUI: particleCircleSettings });
registerScene({ sceneName: sceneNames.PsychedelicCube, createScene: () => new PsychedelicCube(), createDefaultSettings: () => new PsychedelicCubeSetting(), buildSettingsUI: psychedelicCubeSettings });
registerScene({ sceneName: sceneNames.PulsingGrid, createScene: () => new PulsingGrid(), createDefaultSettings: () => new PulsingGridSetting(), buildSettingsUI: pulsingGridSettings });
registerScene({ sceneName: sceneNames.AudioTerrain, createScene: () => new AudioTerrain(), createDefaultSettings: () => new AudioTerrainSetting(), buildSettingsUI: audioTerrainSettings });
registerScene({ sceneName: sceneNames.CircleBurst, createScene: () => new CircleBurst(), createDefaultSettings: () => new CircleBurstSetting(), buildSettingsUI: circleBurstSettings });
registerScene({ sceneName: sceneNames.PaintSplash, createScene: () => new PaintSplash(), createDefaultSettings: () => new PaintSplashSetting(), buildSettingsUI: paintSplashSettings });
registerScene({ sceneName: sceneNames.HexagonPulse, createScene: () => new HexagonPulse(), createDefaultSettings: () => new HexagonPulseSetting(), buildSettingsUI: hexagonPulseSettings });
registerScene({ sceneName: sceneNames.OrbitalRing, createScene: () => new OrbitalRing(), createDefaultSettings: () => new OrbitalRingSetting(), buildSettingsUI: orbitalRingSettings });
registerScene({ sceneName: sceneNames.NeuralWeb, createScene: () => new NeuralWeb(), createDefaultSettings: () => new NeuralWebSetting(), buildSettingsUI: neuralWebSettings });
registerScene({ sceneName: sceneNames.FloatingCubes, createScene: () => new FloatingCubes(), createDefaultSettings: () => new FloatingCubesSetting(), buildSettingsUI: floatingCubesSettings });
registerScene({ sceneName: sceneNames.ChromaWave, createScene: () => new ChromaWave(), createDefaultSettings: () => new ChromaWaveSetting(), buildSettingsUI: chromaWaveSettings });
registerScene({ sceneName: sceneNames.CosmicAurora, createScene: () => new CosmicAurora(), createDefaultSettings: () => new CosmicAuroraSetting(), buildSettingsUI: cosmicAuroraSettings });
