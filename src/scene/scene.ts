import type { IAudioDataDto, streamType } from '@/src/utils/eventMessage';
import type { ISceneSetting } from './sceneSetting';
export interface IScene {
    streamType: streamType;
    build(): void;
    updateSettings(settings: ISceneSetting): void;
    updateAudioData(data: IAudioDataDto): void;
    render(): void;
    clean(): void;
}
