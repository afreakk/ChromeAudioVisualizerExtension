import type { ISceneSetting } from '@/src/scene/sceneSetting';

export class NeuralWebSetting implements ISceneSetting {
    // Nodes
    public nodeCount: number = 80;
    public nodeSize: number = 4;
    public nodeSizeAudioScale: number = 8;

    // Connections
    public connectionDistance: number = 150;
    public lineWidth: number = 1;
    public lineOpacity: number = 0.5;

    // Movement
    public driftSpeed: number = 0.5;
    public audioInfluence: number = 1.5;
    public bounceOnEdges: boolean = true;

    // Colors
    public nodeColor: string = '#00FFFF';
    public lineColor: string = '#0088FF';
    public backgroundColor: string = '#050510';

    // Effects
    public glowIntensity: number = 0.6;
    public pulseOnBeat: boolean = true;
    public audioSensitivity: number = 9;
}
