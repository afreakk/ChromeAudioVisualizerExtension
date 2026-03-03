import type { ISceneSetting } from '@/src/scene/sceneSetting';

export class OrbitalRingSetting implements ISceneSetting {
    // Ring configuration
    public dotCount: number = 96;
    public baseRadius: number = 0.25;
    public audioRadiusMultiplier: number = 0.4;

    // Dots
    public dotSize: number = 0.015;
    public dotSizeAudioScale: number = 0.02;

    // Lines
    public lineWidth: number = 1.5;
    public showConnections: boolean = true;

    // Colors
    public colorSpeed: number = 0.3;
    public colorSaturation: number = 0.85;
    public colorBrightness: number = 0.8;
    public colorOffset: number = 0.5;

    // Animation
    public rotationSpeed: number = 0.2;
    public audioSensitivity: number = 1.0;

    // Effects
    public glowIntensity: number = 0.4;
    public trailFade: number = 0.15;
}
