import type { ISceneSetting } from '@/src/scene/sceneSetting';
export class FrostFireSetting implements ISceneSetting {
    public numberOfHexagons: number = 40.0;
    public height: number = 0.55;
    public colorBlend: number = 0.7;
    public dynamicColor: number = 0.5;
    public breathing: number = 0.25;
    public frostColor: string = '#0000FF';
    public fireColor: string = '#FF0000';
    public blendColor: string = '#00FF00';
}
