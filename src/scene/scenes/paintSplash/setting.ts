import type { ISceneSetting } from '@/src/scene/sceneSetting';

export class PaintSplashSetting implements ISceneSetting {
    // Splash configuration
    public numSplashes: number = 24;
    public baseSize: number = 0.02;
    public maxSize: number = 0.15;

    // Movement
    public spreadRadius: number = 0.3;
    public rotationSpeed: number = 0.4;

    // Colors
    public colorSpeed: number = 0.5;
    public colorSaturation: number = 0.9;
    public colorBrightness: number = 0.8;

    // Effects
    public fadeAmount: number = 0.02;
    public glowIntensity: number = 0.5;
    public audioSensitivity: number = 1.5;
    public trailPersistence: boolean = true;
}
