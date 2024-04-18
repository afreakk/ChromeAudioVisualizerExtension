import { IScene } from '@/src/scene/scene';
import { ISceneSetting } from '@/src/scene/sceneSetting';
import { ButterChurnAudioDataDto, IAudioDataDto, streamType } from '@/src/utils/eventMessage';
import butterchurn from 'butterchurn';
export class Butterchurn implements IScene {
    private canvas: HTMLCanvasElement | null = null;
    private audioData: ButterChurnAudioDataDto;
    private visualizer: any = null;
    private lastTime: any;
    constructor() {
        this.audioData = new ButterChurnAudioDataDto([], [], []);
    }
    streamType = streamType.butterChurn;
    build(): void {
        this.canvas = document.createElement('canvas');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.style.position = 'fixed';
        this.canvas.style.left = '0';
        this.canvas.style.top = '0';
        this.canvas.style.zIndex = '-1';
        document.body.insertBefore(this.canvas, document.body.firstChild);
        this.lastTime = +Date.now();
        this.visualizer = butterchurn.createVisualizer(null, this.canvas, {
            width: this.canvas.width,
            height: this.canvas.height,
            mesh_width: 64,
            mesh_height: 48,
            pixelRatio: window.devicePixelRatio || 1,
            textureRatio: 1,
        });
    }
    updateSettings(settings: ISceneSetting): void { }
    updateAudioData(data: ButterChurnAudioDataDto): void {
        if (data.timeByteArrayLeft !== undefined) {
            this.audioData = data;
        }

    }
    render(): void {
        if (this.canvas === null) {
            return;
        }

        const data = new Uint8Array(this.audioData.timeByteArray);
        const dataL = new Uint8Array(this.audioData.timeByteArrayLeft);
        const dataR = new Uint8Array(this.audioData.timeByteArrayRight);
        const currentTime = +Date.now();
        const elapsedTime = (currentTime - this.lastTime) / 1000;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.visualizer.setRendererSize(this.canvas.width, this.canvas.height);
        this.lastTime = currentTime;
        this.visualizer.render({
            elapsedTime: elapsedTime,
            audioLevels: {
                timeByteArray: data,
                timeByteArrayL: dataL,
                timeByteArrayR: dataR,
            },
            width: this.canvas.width,
        });
    }
    clean(): void {
        if (this.canvas === null) {
            return;
        }
        this.canvas.remove();
    }

}
