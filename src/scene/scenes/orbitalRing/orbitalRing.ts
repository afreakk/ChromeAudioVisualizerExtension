import { IScene } from '@/src/scene/scene';
import { createFullscreenCanvas } from '@/src/utils/canvas';
import { NormalAudioDataDto, streamType } from '@/src/utils/eventMessage';
import { OrbitalRingSetting } from './setting';

export class OrbitalRing implements IScene {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private audioData: NormalAudioDataDto;
    private settings: OrbitalRingSetting = new OrbitalRingSetting();
    private colorOffset: number = 0;
    private rotationOffset: number = 0;

    constructor() {
        this.audioData = new NormalAudioDataDto([]);
    }

    streamType = streamType.normal;

    build(): void {
        this.canvas = createFullscreenCanvas();
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            console.error('Unable to get 2D context');
            return;
        }
    }

    private hslToString(h: number, s: number, l: number, a: number = 1): string {
        h = ((h % 1) + 1) % 1;
        return `hsla(${h * 360}, ${s * 100}%, ${l * 100}%, ${a})`;
    }

    updateSettings(settings: OrbitalRingSetting): void {
        this.settings = settings;
    }

    updateAudioData(data: NormalAudioDataDto): void {
        this.audioData = data;
    }

    render(): void {
        if (!this.canvas || !this.ctx) return;

        // Resize if needed
        if (this.canvas.width !== window.innerWidth || this.canvas.height !== window.innerHeight) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }

        const { width, height } = this.canvas;
        const centerX = width / 2;
        const centerY = height / 2;
        const minDim = Math.min(width, height);

        // Fade background
        this.ctx.fillStyle = `rgba(0, 0, 0, ${this.settings.trailFade})`;
        this.ctx.fillRect(0, 0, width, height);

        const audioArray = this.audioData.timeByteArray;
        const binSize = Math.max(1, Math.floor(audioArray.length / this.settings.dotCount));

        this.ctx.lineWidth = this.settings.lineWidth;

        const positions: { x: number; y: number; hue: number; audioValue: number }[] = [];
        let totalAudio = 0;
        let lastX: number | null = null;
        let lastY: number | null = null;

        for (let i = 0; i < this.settings.dotCount; i++) {
            // Get audio value for this dot
            const binIndex = (i * binSize) % audioArray.length;
            const audioValue = ((audioArray[binIndex] || 0) / 255) * this.settings.audioSensitivity;
            totalAudio += audioValue;

            // Calculate angle with rotation offset
            const angle = ((i / this.settings.dotCount) * Math.PI * 2) + this.rotationOffset;

            // Calculate radius based on audio
            const baseR = this.settings.baseRadius * minDim;
            const audioR = audioValue * this.settings.audioRadiusMultiplier * minDim;
            const radius = baseR + audioR;

            // Calculate position
            const x = centerX + Math.sin(angle) * radius;
            const y = centerY + Math.cos(angle) * radius;

            // Calculate color
            const hue = (i / this.settings.dotCount) + this.colorOffset;
            const color = this.hslToString(
                hue,
                this.settings.colorSaturation,
                this.settings.colorBrightness * (0.5 + audioValue * 0.5)
            );

            positions.push({ x, y, hue, audioValue });

            // Draw connection line
            if (this.settings.showConnections && lastX !== null && lastY !== null) {
                this.ctx.strokeStyle = color;
                this.ctx.beginPath();
                this.ctx.moveTo(lastX, lastY);
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
            }

            // Draw dot with glow
            const dotRadius = (this.settings.dotSize + audioValue * this.settings.dotSizeAudioScale) * minDim;

            if (this.settings.glowIntensity > 0) {
                const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, dotRadius * 3);
                gradient.addColorStop(0, this.hslToString(hue, this.settings.colorSaturation, this.settings.colorBrightness, 0.5));
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                this.ctx.fillStyle = gradient;
                this.ctx.globalAlpha = this.settings.glowIntensity * audioValue;
                this.ctx.beginPath();
                this.ctx.arc(x, y, dotRadius * 3, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.globalAlpha = 1;
            }

            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            this.ctx.fill();

            lastX = x;
            lastY = y;
        }

        // Close the ring with a line
        if (this.settings.showConnections && positions.length > 1) {
            const first = positions[0];
            const lastPos = positions[positions.length - 1];
            this.ctx.strokeStyle = this.hslToString(
                first.hue,
                this.settings.colorSaturation,
                this.settings.colorBrightness * 0.5
            );
            this.ctx.beginPath();
            this.ctx.moveTo(lastPos.x, lastPos.y);
            this.ctx.lineTo(first.x, first.y);
            this.ctx.stroke();
        }

        // Update animation values
        const avgAudio = totalAudio / this.settings.dotCount;
        this.colorOffset += this.settings.colorSpeed * 0.01 * (1 + avgAudio);
        this.rotationOffset += this.settings.rotationSpeed * 0.01 * (1 + avgAudio * 2);
    }

    clean(): void {
        if (this.canvas) {
            this.canvas.remove();
            this.canvas = null;
        }
        this.ctx = null;
    }
}
