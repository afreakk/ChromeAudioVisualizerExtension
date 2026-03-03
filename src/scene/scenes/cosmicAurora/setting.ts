import type { ISceneSetting } from '@/src/scene/sceneSetting';

export class CosmicAuroraSetting implements ISceneSetting {
    // Aurora settings
    public auroraIntensity: number = 0.2;
    public auroraSpeed: number = 1.0;
    public auroraWaveCount: number = 5;
    public auroraColor1: string = '#00ff88';
    public auroraColor2: string = '#ff00ff';
    public auroraColor3: string = '#00ffff';

    // Star field settings
    public starCount: number = 150;
    public starTwinkleSpeed: number = 1.0;
    public showShootingStars: boolean = true;

    // Nebula settings
    public nebulaIntensity: number = 0.5;
    public nebulaSpeed: number = 0.5;

    // Audio reactivity
    public audioSensitivity: number = 2.0;
    public bassReactivity: number = 2.5;
    public colorCycleSpeed: number = 0.5;

    // Effects
    public glowIntensity: number = 0.3;
    public trailLength: number = 0.85;
}
