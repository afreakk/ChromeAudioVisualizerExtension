import type { ISceneSetting } from '@/src/scene/sceneSetting';

export class DancingCubes3DSinusSetting implements ISceneSetting {
    public danceSpeed: number = 0.00005;
    public directionChangeSpeed: number = 0.2012;
    public cubeCount: number = 15;
    public colorStrength: number = 1.01;
    public spaceX: number = 99.091;
    public spaceY: number = 99.091;
    public spaceZ: number = 99.091;
    public spaceW: number = 99.091;
    public spaceZOffset: number = 2.5;
    public colorChangeSpeed: number = 0.0101;
    public width: number = 0.0004;
    public height: number = 0.0004;
    public textureSinusIntensity: number = 0.05;
    public bgRed: number = 0.8;
    public bgGreen: number = 0.3;
    public bgBlue: number = 0.4;
    public bgAlpha: number = 0.4;
    public cubeAlphaModifier: number = 0.1;
}
