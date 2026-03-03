import butterchurn from 'butterchurn';
import butterchurnPresets from 'butterchurn-presets';
import type { IScene } from '@/src/scene/scene';
import { ButterChurnAudioDataDto, streamType } from '@/src/utils/eventMessage';
import { type ButterchurnSetting, getRandomPreset } from './setting';

const presets = butterchurnPresets.getPresets();

export class Butterchurn implements IScene {
    private canvas: HTMLCanvasElement | null = null;
    private audioData: ButterChurnAudioDataDto;
    private visualizer: any = null;
    private lastTime: any;
    private lastCycleSeconds: number = 0;
    private cyclePresetInterval: NodeJS.Timeout | null = null;
    private audioBuffer: Uint8Array = new Uint8Array(1024);
    private audioBufferL: Uint8Array = new Uint8Array(1024);
    private audioBufferR: Uint8Array = new Uint8Array(1024);
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
    updateSettings(settings: ButterchurnSetting): void {
        if (!this.visualizer) return;
        const preset = presets[settings.preset];
        this.visualizer.loadPreset(preset, settings.blendLength);
        if (!settings.cyclePresets) {
            clearInterval(this.cyclePresetInterval as NodeJS.Timeout);
        } else if (settings.cycleSeconds !== this.lastCycleSeconds || this.cyclePresetInterval === null) {
            clearInterval(this.cyclePresetInterval as NodeJS.Timeout);
            this.lastCycleSeconds = settings.cycleSeconds;
            this.cyclePresetInterval = setInterval(() => {
                settings.preset = getRandomPreset();
                this.updateSettings(settings);
            }, settings.cycleSeconds * 1000);
        }
    }
    updateAudioData(data: ButterChurnAudioDataDto): void {
        if (data.timeByteArrayLeft !== undefined) {
            this.audioData = data;
        }
    }
    render(): void {
        if (this.canvas === null) {
            return;
        }

        this.audioBuffer.set(this.audioData.timeByteArray);
        this.audioBufferL.set(this.audioData.timeByteArrayLeft);
        this.audioBufferR.set(this.audioData.timeByteArrayRight);
        const data = this.audioBuffer;
        const dataL = this.audioBufferL;
        const dataR = this.audioBufferR;
        const currentTime = +Date.now();
        const elapsedTime = (currentTime - this.lastTime) / 1000;
        if (this.canvas.width !== window.innerWidth || this.canvas.height !== window.innerHeight) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.visualizer.setRendererSize(this.canvas.width, this.canvas.height);
        }
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
        if (this.cyclePresetInterval) {
            clearInterval(this.cyclePresetInterval);
            this.cyclePresetInterval = null;
        }
        if (this.canvas === null) {
            return;
        }
        this.canvas.remove();
        this.canvas = null;
        this.visualizer = null;
    }
}
