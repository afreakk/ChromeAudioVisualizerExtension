import type { IScene } from '@/src/scene/scene';
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
    private glowSprites: HTMLCanvasElement[] = [];
    private static readonly GLOW_HUE_BUCKETS = 36;
    private static readonly GLOW_SPRITE_SIZE = 64;

    constructor() {
        this.audioData = new NormalAudioDataDto([]);
    }

    streamType = streamType.normal;

    build(): void {
        this.canvas = createFullscreenCanvas();
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            return;
        }
        this.rebuildGlowSprites();
    }

    private hslToString(h: number, s: number, l: number, a: number = 1): string {
        h = ((h % 1) + 1) % 1;
        return `hsla(${h * 360}, ${s * 100}%, ${l * 100}%, ${a})`;
    }

    // Creating a radial gradient per dot per frame is one of the most expensive
    // 2D-canvas operations. Pre-render one glow sprite per quantized hue instead;
    // saturation/brightness only change via updateSettings, which rebuilds the set.
    private rebuildGlowSprites(): void {
        const size = OrbitalRing.GLOW_SPRITE_SIZE;
        const half = size / 2;
        this.glowSprites = [];
        for (let bucket = 0; bucket < OrbitalRing.GLOW_HUE_BUCKETS; bucket++) {
            const sprite = document.createElement('canvas');
            sprite.width = size;
            sprite.height = size;
            const sCtx = sprite.getContext('2d');
            if (!sCtx) return;
            const hue = bucket / OrbitalRing.GLOW_HUE_BUCKETS;
            const gradient = sCtx.createRadialGradient(half, half, 0, half, half, half);
            gradient.addColorStop(
                0,
                this.hslToString(hue, this.settings.colorSaturation, this.settings.colorBrightness, 0.5),
            );
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            sCtx.fillStyle = gradient;
            sCtx.fillRect(0, 0, size, size);
            this.glowSprites.push(sprite);
        }
    }

    updateSettings(settings: OrbitalRingSetting): void {
        this.settings = settings;
        this.rebuildGlowSprites();
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

        let totalAudio = 0;
        let lastX: number | null = null;
        let lastY: number | null = null;
        // Only the first dot's position/hue are needed after the loop (to close the ring)
        let firstX = 0;
        let firstY = 0;
        let firstHue = 0;

        for (let i = 0; i < this.settings.dotCount; i++) {
            // Get audio value for this dot
            const binIndex = (i * binSize) % audioArray.length;
            const audioValue = ((audioArray[binIndex] || 0) / 255) * this.settings.audioSensitivity;
            totalAudio += audioValue;

            // Calculate angle with rotation offset
            const angle = (i / this.settings.dotCount) * Math.PI * 2 + this.rotationOffset;

            // Calculate radius based on audio
            const baseR = this.settings.baseRadius * minDim;
            const audioR = audioValue * this.settings.audioRadiusMultiplier * minDim;
            const radius = baseR + audioR;

            // Calculate position
            const x = centerX + Math.sin(angle) * radius;
            const y = centerY + Math.cos(angle) * radius;

            // Calculate color
            const hue = i / this.settings.dotCount + this.colorOffset;
            const color = this.hslToString(
                hue,
                this.settings.colorSaturation,
                this.settings.colorBrightness * (0.5 + audioValue * 0.5),
            );

            if (i === 0) {
                firstX = x;
                firstY = y;
                firstHue = hue;
            }

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

            if (this.settings.glowIntensity > 0 && this.glowSprites.length > 0) {
                const normHue = ((hue % 1) + 1) % 1;
                const bucket = Math.floor(normHue * OrbitalRing.GLOW_HUE_BUCKETS) % OrbitalRing.GLOW_HUE_BUCKETS;
                const glowRadius = dotRadius * 3;
                this.ctx.globalAlpha = this.settings.glowIntensity * audioValue;
                this.ctx.drawImage(
                    this.glowSprites[bucket],
                    x - glowRadius,
                    y - glowRadius,
                    glowRadius * 2,
                    glowRadius * 2,
                );
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
        if (this.settings.showConnections && this.settings.dotCount > 1 && lastX !== null && lastY !== null) {
            this.ctx.strokeStyle = this.hslToString(
                firstHue,
                this.settings.colorSaturation,
                this.settings.colorBrightness * 0.5,
            );
            this.ctx.beginPath();
            this.ctx.moveTo(lastX, lastY);
            this.ctx.lineTo(firstX, firstY);
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
        this.glowSprites = [];
    }
}
