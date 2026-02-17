import { IScene } from '@/src/scene/scene';
import { NormalAudioDataDto, streamType } from '@/src/utils/eventMessage';
import { WormSceneSetting } from './setting';

function componentToHex(c: number): string {
    const hex = Math.min(Math.round(c), 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
}

function rgbToHex(r: number, g: number, b: number): string {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function spin(i: number, data: number[]): number {
    const max = data.length - 1;
    if (i > max) {
        i = 0 + (i - max);
    }
    while (i > max) {
        i -= max + 1;
    }
    while (i < 0) {
        i += max + 1;
    }
    const idx = Math.max(Math.min(i, max), 0);
    return data[idx] ? data[idx] : 0;
}

export class WormScene implements IScene {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private audioData: NormalAudioDataDto;
    private settings: WormSceneSetting;
    private rotationOffset: number = Math.PI / 4.0;
    private colorOffset: number = 0.0;

    constructor() {
        this.audioData = new NormalAudioDataDto([]);
        this.settings = new WormSceneSetting();
    }

    streamType = streamType.normal;

    build(): void {
        this.canvas = document.createElement('canvas');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.style.position = 'fixed';
        this.canvas.style.left = '0';
        this.canvas.style.top = '0';
        this.canvas.style.zIndex = '-1';
        document.body.insertBefore(this.canvas, document.body.firstChild);

        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            console.error('Unable to initialize Canvas 2D. Your browser may not support it.');
            return;
        }
    }

    updateSettings(settings: WormSceneSetting): void {
        this.settings = settings;
    }

    updateAudioData(data: NormalAudioDataDto): void {
        this.audioData = data;
    }

    private getClr(rgbS: number, scaled_average_c: number): string {
        return rgbToHex(
            (Math.sin(rgbS) / 2.0 + 0.5) * scaled_average_c,
            (Math.cos(rgbS) / 2.0 + 0.5) * scaled_average_c,
            (Math.sin(rgbS + this.settings.colorOffset) / 2.0 + 0.5) * scaled_average_c
        );
    }

    render(): void {
        if (!this.canvas || !this.ctx) {
            return;
        }

        // Update canvas size
        if (this.canvas.width !== window.innerWidth || this.canvas.height !== window.innerHeight) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }

        // Clear background
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const xs = this.settings;
        const circleWidth = this.canvas.width * xs.circleSize;
        const circleHeight = this.canvas.height * xs.circleSize;
        const circleSpread = (Math.PI * 4) / xs.numBars;
        const data = this.audioData.timeByteArray;
        const bin_size = Math.floor(data.length / xs.numBars);
        let sumtotal = 0;
        let z = 0;
        let yy = 0;
        const widthInHalf = this.canvas.width / 2;
        const heightInHalf = this.canvas.height / 2;

        for (let i = 0; i < xs.numBars; i += 1) {
            const sum = Math.max(spin(z += xs.spectrumJumps, data) - (yy += xs.innSnevring), 0);
            const scaled_average_c = sum * xs.colorStrength;
            const scaled_average_v = sum * xs.circleSize;
            const scaled_average_m = sum * xs.moveLength;
            const s0 = i * circleSpread - this.rotationOffset;
            const x0 = Math.sin(s0) * circleWidth * scaled_average_m + widthInHalf;
            const y0 = Math.cos(s0) * circleHeight * scaled_average_m + heightInHalf;
            const rgbS = i / xs.colorWidth + this.colorOffset;

            this.ctx.beginPath();
            this.ctx.arc(x0, y0, scaled_average_v, 0, 2 * Math.PI, false);
            this.ctx.fillStyle = this.getClr(rgbS, scaled_average_c);
            this.ctx.fill();
            sumtotal += sum;
        }

        sumtotal /= 10000000;
        this.rotationOffset += sumtotal * xs.rotationSpeed;
        this.colorOffset += sumtotal * xs.colorSpeed;
    }

    clean(): void {
        if (this.canvas === null) {
            return;
        }

        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }

        this.canvas.remove();
        this.canvas = null;
        this.ctx = null;
    }
}

