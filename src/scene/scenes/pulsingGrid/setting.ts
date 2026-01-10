import { ISceneSetting } from '@/src/scene/sceneSetting';

export class PulsingGridSetting implements ISceneSetting {
    // Grid layout
    public rows: number = 6;
    public columns: number = 8;
    public padding: number = 80;
    public gridScale: number = 0.85;

    // Circle sizing
    public baseSize: number = 15;
    public minSize: number = 5;
    public maxSize: number = 80;
    public sizeReactivity: number = 0.4;

    // Colors
    public colorSpeed: number = 0.002;
    public colorReactivity: number = 1.2;
    public colorSpread: number = 0.15;
    public colorOffset: number = Math.PI / 2;
    public saturation: number = 1.0;

    // Effects
    public glowIntensity: number = 0.6;
    public glowSize: number = 20;
    public showConnections: boolean = true;
    public connectionOpacity: number = 0.3;
    public connectionThreshold: number = 0.4;

    // Animation
    public gridRotation: number = 0.0;
    public pulseSmoothing: number = 0.3;

    // Background
    public bgRed: number = 0.02;
    public bgGreen: number = 0.02;
    public bgBlue: number = 0.05;
    public bgAlpha: number = 0.15;
}
