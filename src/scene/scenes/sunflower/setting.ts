import { ISceneSetting } from '@/src/scene/sceneSetting';

export class SunFlowerSetting implements ISceneSetting {
    public innerColor: string = '#FFD700';
    public midColor: string = '#FF4500';
    public outerColor: string = '#6A5ACD';
    public radius: number = 0.2;
    public size: number = 0.8;
    public innerRadiusGain: number = 0.15;
    public midRadiusGain: number = 0.45;
    public outerRadiusGain: number = 0.75;
}
