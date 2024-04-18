import { IAudioDataDto, streamType } from "@/src/utils/eventMessage";
import { ISceneSetting } from "./sceneSetting";
export interface IScene {
    streamType: streamType;
    build(): void;
    updateSettings(settings: ISceneSetting): void;
    updateAudioData(data: IAudioDataDto): void;
    render(): void;
    clean(): void;
}

