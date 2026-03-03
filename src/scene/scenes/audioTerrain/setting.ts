import type { ISceneSetting } from '@/src/scene/sceneSetting';

export class AudioTerrainSetting implements ISceneSetting {
    // Grid dimensions - reduced for performance
    public gridWidth: number = 32;
    public gridHeight: number = 24;
    public tileSize: number = 7.0;

    // Movement
    public scrollSpeed: number = 0.005;
    public audioScrollMultiplier: number = 0.5;

    // Terrain shape
    public mountainHeight: number = 30;
    public noiseScale: number = 0.03;
    public audioHeightMultiplier: number = 1.0;

    // Camera - higher up to see terrain from above
    public cameraHeight: number = 100;
    public cameraDistance: number = 15;
    public horizonOffset: number = 100;

    // Colors - Synthwave style with more contrast
    public skyTopR: number = 0.02;
    public skyTopG: number = 0.0;
    public skyTopB: number = 0.1;
    public skyBottomR: number = 0.3;
    public skyBottomG: number = 0.0;
    public skyBottomB: number = 0.25;

    // More contrasting terrain colors
    public terrainLowR: number = 0.0;
    public terrainLowG: number = 0.2;
    public terrainLowB: number = 0.4;
    public terrainHighR: number = 1.0;
    public terrainHighG: number = 0.2;
    public terrainHighB: number = 0.8;

    // Effects
    public wireframeMode: boolean = true;
    public lineWidth: number = 1.5;
    public glowIntensity: number = 0.6;
    public showSun: boolean = true;
    public sunSize: number = 80;
    public sunY: number = 0.75;
}
