import type { NeuralWebSetting } from '@/src/scene/scenes/neuralWeb/setting';
import { setSceneSettings } from '../settingsManager';

export function neuralWebSettings(
    sceneName: string,
    settings: NeuralWebSetting,
    settingsFolder: any,
    isExternalUi: boolean,
): void {
    // Nodes
    settingsFolder
        .add(settings, 'nodeCount', 1, 200)
        .step(1)
        .name('Node Count')
        .onChange((value: number) => {
            settings.nodeCount = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'nodeSize', 0.001, 100)
        .name('Node Size')
        .onChange((value: number) => {
            settings.nodeSize = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'nodeSizeAudioScale', 0, 20)
        .name('Node Audio Scale')
        .onChange((value: number) => {
            settings.nodeSizeAudioScale = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    // Connections
    settingsFolder
        .add(settings, 'connectionDistance', 50, 300)
        .name('Connection Distance')
        .onChange((value: number) => {
            settings.connectionDistance = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'lineWidth', 0.5, 3)
        .name('Line Width')
        .onChange((value: number) => {
            settings.lineWidth = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'lineOpacity', 0.1, 1)
        .name('Line Opacity')
        .onChange((value: number) => {
            settings.lineOpacity = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    // Movement
    settingsFolder
        .add(settings, 'driftSpeed', 0.1, 2)
        .name('Drift Speed')
        .onChange((value: number) => {
            settings.driftSpeed = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'audioInfluence', 0.5, 5)
        .name('Audio Influence')
        .onChange((value: number) => {
            settings.audioInfluence = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'bounceOnEdges')
        .name('Bounce On Edges')
        .onChange((value: boolean) => {
            settings.bounceOnEdges = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    // Colors
    settingsFolder
        .addColor(settings, 'nodeColor')
        .name('Node Color')
        .onChange((value: string) => {
            settings.nodeColor = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .addColor(settings, 'lineColor')
        .name('Line Color')
        .onChange((value: string) => {
            settings.lineColor = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .addColor(settings, 'backgroundColor')
        .name('Background')
        .onChange((value: string) => {
            settings.backgroundColor = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });

    // Effects
    settingsFolder
        .add(settings, 'glowIntensity', 0, 1)
        .name('Glow Intensity')
        .onChange((value: number) => {
            settings.glowIntensity = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'pulseOnBeat')
        .name('Pulse On Beat')
        .onChange((value: boolean) => {
            settings.pulseOnBeat = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
    settingsFolder
        .add(settings, 'audioSensitivity', 1, 35)
        .name('Audio Sensitivity')
        .onChange((value: number) => {
            settings.audioSensitivity = value;
            setSceneSettings(settings, sceneName, isExternalUi);
        });
}
