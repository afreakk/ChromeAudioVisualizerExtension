import { Scene } from '@/src/scene/scene';
import { SceneSetting } from '@/src/scene/sceneSetting';
import { AudioDataDto } from '@/src/utils/eventMessage';
import butterchurn from 'butterchurn';
export class Butterchurn implements Scene {
    private canvas;
    private audioData: AudioDataDto;
    private visualizer: any;
    private lastTime: any;
    constructor(canvas: HTMLCanvasElement) {
        this.audioData = new AudioDataDto([], [], []);
        this.canvas = canvas;
        this.visualizer = butterchurn.createVisualizer(null, canvas, {
            width: 800,
            height: 600,
            mesh_width: 64,
            mesh_height: 48,
            pixelRatio: window.devicePixelRatio || 1,
            textureRatio: 1,
        });
        this.lastTime = +Date.now();
    }
    build(): void {}
    updateSettings(settings: SceneSetting): void {}
    updateAudioData(data: AudioDataDto): void {
        this.audioData = data;
    }
    render(): void {
        const currentTime = +Date.now();
        const elapsedTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        this.visualizer.render({
            elapsedTime: elapsedTime,
            audioLevels: {
                timeByteArray: this.audioData.timeByteArray,
                timeByteArrayL: this.audioData.timeByteArrayLeft,
                timeByteArrayR: this.audioData.timeByteArrayRight,
            },
        });
    }
    clean(): void {}
}
