import { SceneSetting } from '@/src/scene/sceneSetting';


export class SynthBarsSetting implements SceneSetting {
    public bottomColor: string = "#33FF33";
    public topColor: string = "#5555FF";
    public numberOfbars: number = 40.0;
    public noiceGain: number = 0.5;
}
