import * as dat from 'dat.gui';
import {
    GenericEvent,
    messageAction,
    messageTarget,
} from '@/src/utils/eventMessage';
import { DancingHorizonSetting } from '@/src/scene/scenes/dancingHorizon/setting';
import { SynthBarsSetting } from '@/src/scene/scenes/synthBars/setting';
import { SunFlowerSetting } from '@/src/scene/scenes/sunflower/setting';
import { ISceneSetting } from '@/src/scene/sceneSetting';
import { loadSettings } from '@/src/utils/settings';
import { SetSceneEvent } from '@/src/scene/events/setSceneEvent';
import { sunFlowerSettings } from './sceneSettings/sunflowerSettings';
import { synthBarSettings } from './sceneSettings/synthBarSettings';
import { dancingHorizonSettings } from './sceneSettings/dancingHorizonSettings';
import { setSceneSettings } from './settingsManager';
import { sceneNames } from '@/src/scene/sceneNames';
import { SettingsWindowEvent } from './events/SettingsWindowEvent';
import { FrostFireSetting } from '@/src/scene/scenes/frostfire/settings';
import { frostFireSettings } from './sceneSettings/frostfireSettings';
import { ButterchurnSettings } from '@/src/scene/scenes/butterchurn/setting';
import { buildButterchurnSetting } from './sceneSettings/butterchurnSettings';
import { DancingCubes3DSinusSetting } from '@/src/scene/scenes/dancingCubes3DSinus/setting';
import { dancingCubes3DSinusSettings } from './sceneSettings/dancingCubes3DSinusSettings';
import { WormSceneSetting } from '@/src/scene/scenes/wormScene/setting';
import { wormSceneSettings } from './sceneSettings/wormSceneSettings';
import { Dancing3DCubesSetting } from '@/src/scene/scenes/dancing3DCubes/setting';
import { dancing3DCubesSettings } from './sceneSettings/dancing3DCubesSettings';
import { RoundSpectrumSetting } from '@/src/scene/scenes/roundSpectrum/setting';
import { roundSpectrumSettings } from './sceneSettings/roundSpectrumSettings';
import { SeventiesSceneSetting } from '@/src/scene/scenes/seventiesScene/setting';
import { seventiesSceneSettings } from './sceneSettings/seventiesSceneSettings';
import { ParticleCircleSetting } from '@/src/scene/scenes/particleCircle/setting';
import { particleCircleSettings } from './sceneSettings/particleCircleSettings';
import { PsychedelicCubeSetting } from '@/src/scene/scenes/psychedelicCube/setting';
import { psychedelicCubeSettings } from './sceneSettings/psychedelicCubeSettings';
import { PulsingGridSetting } from '@/src/scene/scenes/pulsingGrid/setting';
import { pulsingGridSettings } from './sceneSettings/pulsingGridSettings';
import { AudioTerrainSetting } from '@/src/scene/scenes/audioTerrain/setting';
import { audioTerrainSettings } from './sceneSettings/audioTerrainSettings';
import { CircleBurstSetting } from '@/src/scene/scenes/circleBurst/setting';
import { circleBurstSettings } from './sceneSettings/circleBurstSettings';
import { PaintSplashSetting } from '@/src/scene/scenes/paintSplash/setting';
import { paintSplashSettings } from './sceneSettings/paintSplashSettings';
import { HexagonPulseSetting } from '@/src/scene/scenes/hexagonPulse/setting';
import { hexagonPulseSettings } from './sceneSettings/hexagonPulseSettings';
import { OrbitalRingSetting } from '@/src/scene/scenes/orbitalRing/setting';
import { orbitalRingSettings } from './sceneSettings/orbitalRingSettings';
import { NeuralWebSetting } from '@/src/scene/scenes/neuralWeb/setting';
import { neuralWebSettings } from './sceneSettings/neuralWebSettings';
import { FloatingCubesSetting } from '@/src/scene/scenes/floatingCubes/setting';
import { floatingCubesSettings } from './sceneSettings/floatingCubesSettings';
import { ChromaWaveSetting } from '@/src/scene/scenes/chromaWave/setting';
import { chromaWaveSettings } from './sceneSettings/chromaWaveSettings';

export class SettingsUserInterface {
    private gui: dat.GUI | null = null;
    private sceneFolder: dat.GUIFolder | null = null;
    private sceneSettingsFolder: dat.GUIFolder | null = null;
    private generalSettingsFolder: dat.GUIFolder | null = null;
    private isExternalUI: boolean = false;
    private sceneNames: string[] = [];

    constructor(isExternalUI: boolean) {
        this.isExternalUI = isExternalUI;
        this.sceneNames = [];
        for (const scene in sceneNames) {
            this.sceneNames.push(scene);
        }
    }
    public buildScene() {
        this.gui = new dat.GUI();
        this.generalSettingsFolder = this.gui.addFolder('General Settings');
        if (!this.isExternalUI) {
            this.generalSettingsFolder
                .add(
                    {
                        openInWindow: () => {
                            const openSettingsWindowEvent =
                                new SettingsWindowEvent(
                                    messageTarget.background,
                                    messageAction.openSettingsWindow
                                );

                            window.sandboxEventMessageHolder?.source?.postMessage(
                                openSettingsWindowEvent.toMessage(),
                                { targetOrigin: window.sandboxEventMessageHolder.origin }
                            );
                        },
                    },
                    'openInWindow'
                )
                .name('Open settings in Window');
        }
        this.generalSettingsFolder
            .add(
                {
                    toggleFullScreen: () => {
                        this.toggleFullScreen();
                    },
                },
                'toggleFullScreen'
            )
            .name('Toggle Fullscreen');
        this.generalSettingsFolder.open();

        const selection = {
            selectedSceneName: this.sceneNames[0].toString(),
        };
        this.sceneFolder = this.gui.addFolder('Scenes');
        const sceneSelector = this.sceneFolder
            .add(selection, 'selectedSceneName', sceneNames)
            .name('Select Scene');

        sceneSelector.onChange((selectedSceneName) => {
            this.setScene(selectedSceneName as string);
        });

        this.sceneFolder.open();

        this.setScene(selection.selectedSceneName);
    }
    private toggleFullScreen() {
        const fullScreenEventMessage = new GenericEvent(
            messageTarget.animation,
            messageAction.toggleFullScreen
        );
        if (!this.isExternalUI) {
            const fullScreenEvent = new CustomEvent(
                messageAction.toggleFullScreen,
                {
                    detail: { event: fullScreenEventMessage.toMessage() },
                }
            );
            window.dispatchEvent(fullScreenEvent);
        } else {
            chrome.runtime.sendMessage(fullScreenEventMessage.toMessage());
        }
    }
    private setScene(sceneName: string) {
        const settings = this.buildSettings(sceneName);
        const sceneEventMessage = new SetSceneEvent(
            messageTarget.animation,
            messageAction.setScene,
            sceneName,
            settings
        );
        if (!this.isExternalUI) {
            const changeSceneEvent = new CustomEvent(messageAction.setScene, {
                detail: { event: sceneEventMessage.toMessage() },
            });
            window.dispatchEvent(changeSceneEvent);
        } else {
            chrome.runtime.sendMessage(sceneEventMessage.toMessage());
        }
    }

    private buildSettings(sceneName: string): ISceneSetting {
        // Remove the existing settings folder if it exists
        if (this.sceneSettingsFolder && this.sceneFolder) {
            this.sceneFolder.removeFolder(this.sceneSettingsFolder);
        }

        // Create a new folder for scene-specific settings
        this.sceneSettingsFolder = this.sceneFolder!.addFolder('Scene Settings');
        this.sceneSettingsFolder.open();

        const settings = loadSettings<ISceneSetting>(sceneName);
        if (sceneName === sceneNames.SunFlower.toString()) {
            let sunFlowerSetting = settings
                ? (settings as SunFlowerSetting)
                : new SunFlowerSetting();
            this.sceneSettingsFolder
                .add(
                    {
                        reset: () => {
                            sunFlowerSetting = new SunFlowerSetting();
                            setSceneSettings(
                                sunFlowerSetting,
                                sceneName,
                                this.isExternalUI
                            );
                            this.buildSettings(sceneName);
                        },
                    },
                    'reset'
                )
                .name('Reset Settings');

            sunFlowerSettings(
                sceneName,
                sunFlowerSetting,
                this.sceneSettingsFolder,
                this.isExternalUI
            );

            return sunFlowerSetting;
        } else if (sceneName === sceneNames.SynthBars.toString()) {
            let synthbarSetting = settings
                ? (settings as SynthBarsSetting)
                : new SynthBarsSetting();
            this.sceneSettingsFolder
                .add(
                    {
                        reset: () => {
                            synthbarSetting = new SynthBarsSetting();
                            setSceneSettings(
                                synthbarSetting,
                                sceneName,
                                this.isExternalUI
                            );
                            this.buildSettings(sceneName);
                        },
                    },
                    'reset'
                )
                .name('Reset Settings');
            synthBarSettings(
                sceneName,
                synthbarSetting,
                this.sceneSettingsFolder,
                this.isExternalUI
            );

            return synthbarSetting;
        } else if (sceneName === sceneNames.FrostFire.toString()) {
            let frostFireSetting = settings
                ? (settings as FrostFireSetting)
                : new FrostFireSetting();
            this.sceneSettingsFolder
                .add(
                    {
                        reset: () => {
                            frostFireSetting = new FrostFireSetting();
                            setSceneSettings(
                                frostFireSetting,
                                sceneName,
                                this.isExternalUI
                            );
                            this.buildSettings(sceneName);
                        },
                    },
                    'reset'
                )
                .name('Reset Settings');
            frostFireSettings(
                sceneName,
                frostFireSetting,
                this.sceneSettingsFolder,
                this.isExternalUI
            );

            return frostFireSetting;
        } else if (sceneName === sceneNames.DancingHorizon.toString()) {
            let dancingHorizonSetting = settings
                ? (settings as DancingHorizonSetting)
                : new DancingHorizonSetting();
            setSceneSettings(
                dancingHorizonSetting,
                sceneName,
                this.isExternalUI
            );

            this.sceneSettingsFolder
                .add(
                    {
                        reset: () => {
                            dancingHorizonSetting = new DancingHorizonSetting();
                            setSceneSettings(
                                dancingHorizonSetting,
                                sceneName,
                                this.isExternalUI
                            );
                            this.buildSettings(sceneName);
                        },
                    },
                    'reset'
                )
                .name('Reset Settings');
            dancingHorizonSettings(
                sceneName,
                dancingHorizonSetting,
                this.sceneSettingsFolder,
                this.isExternalUI
            );

            return dancingHorizonSetting;
        } else if (sceneName === sceneNames.Butterchurn.toString()) {
            let butterChurnSettings = settings
                ? (settings as ButterchurnSettings)
                : new ButterchurnSettings();
            setSceneSettings(butterChurnSettings, sceneName, this.isExternalUI);

            this.sceneSettingsFolder
                .add(
                    {
                        reset: () => {
                            butterChurnSettings = new ButterchurnSettings();
                            setSceneSettings(
                                butterChurnSettings,
                                sceneName,
                                this.isExternalUI
                            );
                            this.buildSettings(sceneName);
                        },
                    },
                    'reset'
                )
                .name('Reset Settings');
            buildButterchurnSetting(
                sceneName,
                butterChurnSettings,
                this.sceneSettingsFolder,
                this.isExternalUI
            );

            return butterChurnSettings;
        } else if (sceneName === sceneNames.DancingCubes3DSinus.toString()) {
            let dancingCubes3DSinusSetting = settings
                ? (settings as DancingCubes3DSinusSetting)
                : new DancingCubes3DSinusSetting();
            setSceneSettings(
                dancingCubes3DSinusSetting,
                sceneName,
                this.isExternalUI
            );

            this.sceneSettingsFolder
                .add(
                    {
                        reset: () => {
                            dancingCubes3DSinusSetting = new DancingCubes3DSinusSetting();
                            setSceneSettings(
                                dancingCubes3DSinusSetting,
                                sceneName,
                                this.isExternalUI
                            );
                            this.buildSettings(sceneName);
                        },
                    },
                    'reset'
                )
                .name('Reset Settings');
            dancingCubes3DSinusSettings(
                sceneName,
                dancingCubes3DSinusSetting,
                this.sceneSettingsFolder,
                this.isExternalUI
            );

            return dancingCubes3DSinusSetting;
        } else if (sceneName === sceneNames.WormScene.toString()) {
            let wormSceneSetting = settings
                ? (settings as WormSceneSetting)
                : new WormSceneSetting();
            setSceneSettings(
                wormSceneSetting,
                sceneName,
                this.isExternalUI
            );

            this.sceneSettingsFolder
                .add(
                    {
                        reset: () => {
                            wormSceneSetting = new WormSceneSetting();
                            setSceneSettings(
                                wormSceneSetting,
                                sceneName,
                                this.isExternalUI
                            );
                            this.buildSettings(sceneName);
                        },
                    },
                    'reset'
                )
                .name('Reset Settings');
            wormSceneSettings(
                sceneName,
                wormSceneSetting,
                this.sceneSettingsFolder,
                this.isExternalUI
            );

            return wormSceneSetting;
        } else if (sceneName === sceneNames.Dancing3DCubes.toString()) {
            let dancing3DCubesSetting = settings
                ? (settings as Dancing3DCubesSetting)
                : new Dancing3DCubesSetting();
            setSceneSettings(
                dancing3DCubesSetting,
                sceneName,
                this.isExternalUI
            );

            this.sceneSettingsFolder
                .add(
                    {
                        reset: () => {
                            dancing3DCubesSetting = new Dancing3DCubesSetting();
                            setSceneSettings(
                                dancing3DCubesSetting,
                                sceneName,
                                this.isExternalUI
                            );
                            this.buildSettings(sceneName);
                        },
                    },
                    'reset'
                )
                .name('Reset Settings');
            dancing3DCubesSettings(
                sceneName,
                dancing3DCubesSetting,
                this.sceneSettingsFolder,
                this.isExternalUI
            );

            return dancing3DCubesSetting;
        } else if (sceneName === sceneNames.RoundSpectrum.toString()) {
            let roundSpectrumSetting = settings
                ? (settings as RoundSpectrumSetting)
                : new RoundSpectrumSetting();
            setSceneSettings(
                roundSpectrumSetting,
                sceneName,
                this.isExternalUI
            );

            this.sceneSettingsFolder
                .add(
                    {
                        reset: () => {
                            roundSpectrumSetting = new RoundSpectrumSetting();
                            setSceneSettings(
                                roundSpectrumSetting,
                                sceneName,
                                this.isExternalUI
                            );
                            this.buildSettings(sceneName);
                        },
                    },
                    'reset'
                )
                .name('Reset Settings');
            roundSpectrumSettings(
                sceneName,
                roundSpectrumSetting,
                this.sceneSettingsFolder,
                this.isExternalUI
            );

            return roundSpectrumSetting;
        } else if (sceneName === sceneNames.SeventiesScene.toString()) {
            let seventiesSceneSetting = settings
                ? (settings as SeventiesSceneSetting)
                : new SeventiesSceneSetting();
            setSceneSettings(
                seventiesSceneSetting,
                sceneName,
                this.isExternalUI
            );

            this.sceneSettingsFolder
                .add(
                    {
                        reset: () => {
                            seventiesSceneSetting = new SeventiesSceneSetting();
                            setSceneSettings(
                                seventiesSceneSetting,
                                sceneName,
                                this.isExternalUI
                            );
                            this.buildSettings(sceneName);
                        },
                    },
                    'reset'
                )
                .name('Reset Settings');
            seventiesSceneSettings(
                sceneName,
                seventiesSceneSetting,
                this.sceneSettingsFolder,
                this.isExternalUI
            );

            return seventiesSceneSetting;
        } else if (sceneName === sceneNames.ParticleCircle.toString()) {
            let particleCircleSetting = settings
                ? (settings as ParticleCircleSetting)
                : new ParticleCircleSetting();
            setSceneSettings(
                particleCircleSetting,
                sceneName,
                this.isExternalUI
            );

            this.sceneSettingsFolder
                .add(
                    {
                        reset: () => {
                            particleCircleSetting = new ParticleCircleSetting();
                            setSceneSettings(
                                particleCircleSetting,
                                sceneName,
                                this.isExternalUI
                            );
                            this.buildSettings(sceneName);
                        },
                    },
                    'reset'
                )
                .name('Reset Settings');
            particleCircleSettings(
                sceneName,
                particleCircleSetting,
                this.sceneSettingsFolder,
                this.isExternalUI
            );

            return particleCircleSetting;
        } else if (sceneName === sceneNames.PsychedelicCube.toString()) {
            let psychedelicCubeSetting = settings
                ? (settings as PsychedelicCubeSetting)
                : new PsychedelicCubeSetting();
            setSceneSettings(
                psychedelicCubeSetting,
                sceneName,
                this.isExternalUI
            );

            this.sceneSettingsFolder
                .add(
                    {
                        reset: () => {
                            psychedelicCubeSetting = new PsychedelicCubeSetting();
                            setSceneSettings(
                                psychedelicCubeSetting,
                                sceneName,
                                this.isExternalUI
                            );
                            this.buildSettings(sceneName);
                        },
                    },
                    'reset'
                )
                .name('Reset Settings');
            psychedelicCubeSettings(
                sceneName,
                psychedelicCubeSetting,
                this.sceneSettingsFolder,
                this.isExternalUI
            );

            return psychedelicCubeSetting;
        } else if (sceneName === sceneNames.PulsingGrid.toString()) {
            let pulsingGridSetting = settings
                ? (settings as PulsingGridSetting)
                : new PulsingGridSetting();
            setSceneSettings(
                pulsingGridSetting,
                sceneName,
                this.isExternalUI
            );

            this.sceneSettingsFolder
                .add(
                    {
                        reset: () => {
                            pulsingGridSetting = new PulsingGridSetting();
                            setSceneSettings(
                                pulsingGridSetting,
                                sceneName,
                                this.isExternalUI
                            );
                            this.buildSettings(sceneName);
                        },
                    },
                    'reset'
                )
                .name('Reset Settings');
            pulsingGridSettings(
                sceneName,
                pulsingGridSetting,
                this.sceneSettingsFolder,
                this.isExternalUI
            );

            return pulsingGridSetting;
        } else if (sceneName === sceneNames.AudioTerrain.toString()) {
            let audioTerrainSetting = settings
                ? (settings as AudioTerrainSetting)
                : new AudioTerrainSetting();
            setSceneSettings(
                audioTerrainSetting,
                sceneName,
                this.isExternalUI
            );

            this.sceneSettingsFolder
                .add(
                    {
                        reset: () => {
                            audioTerrainSetting = new AudioTerrainSetting();
                            setSceneSettings(
                                audioTerrainSetting,
                                sceneName,
                                this.isExternalUI
                            );
                            this.buildSettings(sceneName);
                        },
                    },
                    'reset'
                )
                .name('Reset Settings');
            audioTerrainSettings(
                sceneName,
                audioTerrainSetting,
                this.sceneSettingsFolder,
                this.isExternalUI
            );

            return audioTerrainSetting;
        } else if (sceneName === sceneNames.CircleBurst.toString()) {
            let circleBurstSetting = settings
                ? (settings as CircleBurstSetting)
                : new CircleBurstSetting();
            setSceneSettings(
                circleBurstSetting,
                sceneName,
                this.isExternalUI
            );

            this.sceneSettingsFolder
                .add(
                    {
                        reset: () => {
                            circleBurstSetting = new CircleBurstSetting();
                            setSceneSettings(
                                circleBurstSetting,
                                sceneName,
                                this.isExternalUI
                            );
                            this.buildSettings(sceneName);
                        },
                    },
                    'reset'
                )
                .name('Reset Settings');
            circleBurstSettings(
                sceneName,
                circleBurstSetting,
                this.sceneSettingsFolder,
                this.isExternalUI
            );

            return circleBurstSetting;
        } else if (sceneName === sceneNames.PaintSplash.toString()) {
            let paintSplashSetting = settings
                ? (settings as PaintSplashSetting)
                : new PaintSplashSetting();
            setSceneSettings(
                paintSplashSetting,
                sceneName,
                this.isExternalUI
            );

            this.sceneSettingsFolder
                .add(
                    {
                        reset: () => {
                            paintSplashSetting = new PaintSplashSetting();
                            setSceneSettings(
                                paintSplashSetting,
                                sceneName,
                                this.isExternalUI
                            );
                            this.buildSettings(sceneName);
                        },
                    },
                    'reset'
                )
                .name('Reset Settings');
            paintSplashSettings(
                sceneName,
                paintSplashSetting,
                this.sceneSettingsFolder,
                this.isExternalUI
            );

            return paintSplashSetting;
        } else if (sceneName === sceneNames.HexagonPulse.toString()) {
            let hexagonPulseSetting = settings
                ? (settings as HexagonPulseSetting)
                : new HexagonPulseSetting();
            setSceneSettings(
                hexagonPulseSetting,
                sceneName,
                this.isExternalUI
            );

            this.sceneSettingsFolder
                .add(
                    {
                        reset: () => {
                            hexagonPulseSetting = new HexagonPulseSetting();
                            setSceneSettings(
                                hexagonPulseSetting,
                                sceneName,
                                this.isExternalUI
                            );
                            this.buildSettings(sceneName);
                        },
                    },
                    'reset'
                )
                .name('Reset Settings');
            hexagonPulseSettings(
                sceneName,
                hexagonPulseSetting,
                this.sceneSettingsFolder,
                this.isExternalUI
            );

            return hexagonPulseSetting;
        } else if (sceneName === sceneNames.OrbitalRing.toString()) {
            let orbitalRingSetting = settings
                ? (settings as OrbitalRingSetting)
                : new OrbitalRingSetting();
            setSceneSettings(
                orbitalRingSetting,
                sceneName,
                this.isExternalUI
            );

            this.sceneSettingsFolder
                .add(
                    {
                        reset: () => {
                            orbitalRingSetting = new OrbitalRingSetting();
                            setSceneSettings(
                                orbitalRingSetting,
                                sceneName,
                                this.isExternalUI
                            );
                            this.buildSettings(sceneName);
                        },
                    },
                    'reset'
                )
                .name('Reset Settings');
            orbitalRingSettings(
                sceneName,
                orbitalRingSetting,
                this.sceneSettingsFolder,
                this.isExternalUI
            );

            return orbitalRingSetting;
        } else if (sceneName === sceneNames.NeuralWeb.toString()) {
            let neuralWebSetting = settings
                ? (settings as NeuralWebSetting)
                : new NeuralWebSetting();
            setSceneSettings(
                neuralWebSetting,
                sceneName,
                this.isExternalUI
            );

            this.sceneSettingsFolder
                .add(
                    {
                        reset: () => {
                            neuralWebSetting = new NeuralWebSetting();
                            setSceneSettings(
                                neuralWebSetting,
                                sceneName,
                                this.isExternalUI
                            );
                            this.buildSettings(sceneName);
                        },
                    },
                    'reset'
                )
                .name('Reset Settings');
            neuralWebSettings(
                sceneName,
                neuralWebSetting,
                this.sceneSettingsFolder,
                this.isExternalUI
            );

            return neuralWebSetting;
        } else if (sceneName === sceneNames.FloatingCubes.toString()) {
            let floatingCubesSetting = settings
                ? (settings as FloatingCubesSetting)
                : new FloatingCubesSetting();
            setSceneSettings(
                floatingCubesSetting,
                sceneName,
                this.isExternalUI
            );

            this.sceneSettingsFolder
                .add(
                    {
                        reset: () => {
                            floatingCubesSetting = new FloatingCubesSetting();
                            setSceneSettings(
                                floatingCubesSetting,
                                sceneName,
                                this.isExternalUI
                            );
                            this.buildSettings(sceneName);
                        },
                    },
                    'reset'
                )
                .name('Reset Settings');
            floatingCubesSettings(
                sceneName,
                floatingCubesSetting,
                this.sceneSettingsFolder,
                this.isExternalUI
            );

            return floatingCubesSetting;
        } else if (sceneName === sceneNames.ChromaWave.toString()) {
            let chromaWaveSetting = settings
                ? (settings as ChromaWaveSetting)
                : new ChromaWaveSetting();
            setSceneSettings(
                chromaWaveSetting,
                sceneName,
                this.isExternalUI
            );

            this.sceneSettingsFolder
                .add(
                    {
                        reset: () => {
                            chromaWaveSetting = new ChromaWaveSetting();
                            setSceneSettings(
                                chromaWaveSetting,
                                sceneName,
                                this.isExternalUI
                            );
                            this.buildSettings(sceneName);
                        },
                    },
                    'reset'
                )
                .name('Reset Settings');
            chromaWaveSettings(
                sceneName,
                chromaWaveSetting,
                this.sceneSettingsFolder,
                this.isExternalUI
            );

            return chromaWaveSetting;
        }
        return {};
    }

    public destroy(): void {
        // Proper cleanup of GUI components
        if (this.sceneSettingsFolder !== null && this.sceneFolder !== null) {
            this.sceneFolder.removeFolder(this.sceneSettingsFolder);
            this.sceneSettingsFolder = null;
        }
        if (this.sceneFolder !== null && this.gui !== null) {
            this.gui.removeFolder(this.sceneFolder);
            this.sceneFolder = null;
        }
        if (this.generalSettingsFolder !== null && this.gui !== null) {
            this.gui.removeFolder(this.generalSettingsFolder);
            this.generalSettingsFolder = null;
        }

        // Destroy the main GUI
        if (this.gui !== null) {
            this.gui.destroy();
            this.gui = null;
        }
    }
}
