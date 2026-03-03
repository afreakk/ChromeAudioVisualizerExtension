import type { ISceneSetting } from '@/src/scene/sceneSetting';

export class WormSceneSetting implements ISceneSetting {
    public moveLength: number = 0.01;
    public numBars: number = 48;
    public circleSize: number = 0.1;
    public rotationSpeed: number = 85.0;
    public colorSpeed: number = 150.0;
    public colorStrength: number = 0.85;
    public colorWidth: number = 2.5;
    public colorOffset: number = Math.PI;
    public spectrumJumps: number = 10.0;
    public innSnevring: number = 0.001;
}
