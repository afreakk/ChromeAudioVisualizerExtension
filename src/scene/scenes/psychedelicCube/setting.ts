import { ISceneSetting } from '@/src/scene/sceneSetting';

export class PsychedelicCubeSetting implements ISceneSetting {
    public volumeMultiplier: number = 0.01;
    public redSpeed: number = 0.008;
    public greenSpeed: number = 0.006;
    public blueSpeed: number = 0.01;
    public spinSpeed: number = 0.003;
    public cubeVolumeScale: number = 0.004;
    public colorSeparation: number = 0.5;
    public pulseIntensity: number = 0.1;
    public bgRed: number = 0.02;
    public bgGreen: number = 0.0;
    public bgBlue: number = 0.08;
    public bgAlpha: number = 1.0;
}
