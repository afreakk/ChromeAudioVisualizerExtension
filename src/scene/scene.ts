import { AudioDataDto } from "@/src/utils/eventMessage";
import { SceneSetting } from "./sceneSetting";
export interface Scene {
    build(): void;
    updateSettings(settings: SceneSetting): void;
    updateAudioData(data: AudioDataDto): void;
    render(): void;
    clean(): void;
}

