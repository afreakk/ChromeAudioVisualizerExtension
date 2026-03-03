import type { ISceneSetting } from '@/src/scene/sceneSetting';

export class DancingHorizonSetting implements ISceneSetting {
    public horizonColorNight: string = '#FFDAB9';
    public horizonColorDay: string = '#800080';
    public skyColorNight: string = '#191970';
    public skyColorDay: string = '#1E90FF';
    public oceanColorNight: string = '#000033';
    public oceanColorDay: string = '#4682B4';
    public moonColor: string = '#F0E68C';
    public sunColor: string = '#FFD700';
    public timeGain: number = 0.1;
    public noiseGain: number = 0.1;
    public cloudDensity: number = 6.0;
    public cloudGain: number = 0.4;
}
