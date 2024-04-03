import { AudioDataDto } from "@/utils/eventMessage";
export interface Scene {
    build(): void;
    updateParams(params: any): void;
    updateAudioData(data: AudioDataDto): void;
    render(): void;
    clean(): void;
}

