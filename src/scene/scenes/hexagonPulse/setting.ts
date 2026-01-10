import { ISceneSetting } from '@/src/scene/sceneSetting';

export class HexagonPulseSetting implements ISceneSetting {
    // Hexagon grid
    public tileSize: number = 40;
    public numLayers: number = 6;
    public rotationSpeed: number = 0.003;

    // Colors
    public baseHue: number = 200;
    public hueRange: number = 120;
    public saturation: number = 0.8;
    public brightness: number = 0.7;

    // Effects
    public pulseIntensity: number = 1.2;
    public distortionAmount: number = 0.5;
    public decayRate: number = 2.0;
    public highlightIntensity: number = 0.8;

    // Starfield
    public showStars: boolean = true;
    public starCount: number = 100;
    public starSpeed: number = 1.0;

    // Background
    public backgroundR: number = 0.02;
    public backgroundG: number = 0.0;
    public backgroundB: number = 0.05;
}
