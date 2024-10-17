import { ISceneSetting } from '@/src/scene/sceneSetting';
import butterchurnPresets from 'butterchurn-presets';
const presets = butterchurnPresets.getPresets();
export const getRandomPreset = () => {
    return Object.keys(presets)[
        Math.round(Math.random() * Object.keys(presets).length) - 1
    ];
};

export class ButterchurnSettings implements ISceneSetting {
    public blendLength: number = 5;
    public cycleSeconds: number = 20;
    public cyclePresets: boolean = true;
    public preset: string = getRandomPreset();
}
