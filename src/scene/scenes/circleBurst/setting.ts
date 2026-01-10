import { ISceneSetting } from '@/src/scene/sceneSetting';

export class CircleBurstSetting implements ISceneSetting {
    // Circle dimensions
    public baseRadius: number = 0.15;
    public maxRadius: number = 0.45;
    public numSpokes: number = 64;

    // Animation
    public rotationSpeed: number = 0.5;
    public colorCycleSpeed: number = 0.3;
    public audioSensitivity: number = 1.2;
    public smoothing: number = 0.85;

    // Visual style
    public innerColor: string = '#FF1493';
    public outerColor: string = '#00BFFF';
    public backgroundColor: string = '#0a0a0a';
    public glowIntensity: number = 0.6;
    public spokeWidth: number = 0.8;
}
