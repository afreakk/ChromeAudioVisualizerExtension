import presets from 'butterchurn-presets';
import type { ISceneSetting } from '@/src/scene/sceneSetting';

export const getRandomPreset = () => {
    const keys = Object.keys(presets);
    return keys[Math.floor(Math.random() * keys.length)];
};

export class ButterchurnSetting implements ISceneSetting {
    public blendLength: number = 5;
    public cycleSeconds: number = 20;
    public cyclePresets: boolean = true;
    public preset: string = getRandomPreset();
}
