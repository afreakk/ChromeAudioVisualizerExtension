import { ISceneSetting } from '@/src/scene/sceneSetting';

export class ChromaWaveSetting implements ISceneSetting {
    // Frequency band speeds (how fast each frequency band affects the visual)
    public lowSpeed: number = 0.008;
    public midSpeed: number = 0.006;
    public highSpeed: number = 0.004;

    // Base movement (when there's no audio)
    public baseLowSpeed: number = 0.1;
    public baseMidSpeed: number = 0.1;
    public baseHighSpeed: number = 0.1;

    // Visual intensity
    public intensity: number = 1.0;
    public waveFrequency: number = 3.0;
    public colorShift: number = 1.0;

    // Effect style
    public patternStyle: number = 0; // 0 = waves, 1 = spirals, 2 = plasma
    public distortionAmount: number = 0.5;
}
