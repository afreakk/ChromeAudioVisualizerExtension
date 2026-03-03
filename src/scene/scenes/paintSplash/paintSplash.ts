import type { IScene } from '@/src/scene/scene';
import { createFullscreenCanvas } from '@/src/utils/canvas';
import { hslToCssString } from '@/src/utils/color';
import { NormalAudioDataDto, streamType } from '@/src/utils/eventMessage';
import { PaintSplashSetting } from './setting';

interface SplashParticle {
    angle: number;
    hue: number;
}

export class PaintSplash implements IScene {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private audioData: NormalAudioDataDto;
    private settings: PaintSplashSetting = new PaintSplashSetting();
    private particles: SplashParticle[] = [];
    private rotationOffset: number = 0;
    private colorOffset: number = 0;
    private lastFrameTime: number = 0;

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

        // Initialize particles
        this.initParticles();
        this.lastFrameTime = performance.now();
    }

    private initParticles(): void {
        this.particles = [];
        for (let i = 0; i < this.settings.numSplashes; i++) {
            this.particles.push({
                angle: (i / this.settings.numSplashes) * Math.PI * 2,
                hue: (i / this.settings.numSplashes) * 360,
            });
        }
    }

    updateSettings(settings: PaintSplashSetting): void {
        const needsReinit = settings.numSplashes !== this.settings.numSplashes;
        this.settings = settings;
        if (needsReinit) {
            this.initParticles();
        }
    }

    updateAudioData(data: NormalAudioDataDto): void {
        this.audioData = data;
    }

    render(): void {
        if (!this.canvas || !this.ctx) return;

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;

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
        if (this.settings.trailPersistence) {
            this.ctx.fillStyle = `rgba(0, 0, 0, ${this.settings.fadeAmount})`;
            this.ctx.fillRect(0, 0, width, height);
        } else {
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, 0, width, height);
        }

        const audioArray = this.audioData.timeByteArray;
        const binSize = audioArray.length > 0 ? Math.floor(audioArray.length / this.settings.numSplashes) : 0;

        let totalAudio = 0;

        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];

            // Get audio value for this particle
            let audioValue = 0;
            if (binSize > 0 && audioArray.length > 0) {
                let sum = 0;
                const startBin = (i * binSize) % audioArray.length;
                for (let j = 0; j < binSize; j++) {
                    const idx = (startBin + j) % audioArray.length;
                    sum += audioArray[idx] || 0;
                }
                audioValue = (sum / binSize / 255) * this.settings.audioSensitivity;
            }
            totalAudio += audioValue;

            // Calculate position based on audio
            const spreadFactor = this.settings.spreadRadius * minDim * audioValue;
            const angle = particle.angle - this.rotationOffset;

            const x = centerX + Math.sin(angle) * spreadFactor;
            const y = centerY + Math.cos(angle) * spreadFactor;

            // Size based on audio
            const size = (this.settings.baseSize + audioValue * this.settings.maxSize) * minDim;

            // Color
            const hue = (particle.hue + this.colorOffset * 360) % 360;
            const color = hslToCssString(
                hue,
                this.settings.colorSaturation,
                this.settings.colorBrightness * (0.5 + audioValue * 0.5),
            );

            // Draw glow
            if (this.settings.glowIntensity > 0) {
                const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, size * 2);
                gradient.addColorStop(
                    0,
                    hslToCssString(hue, this.settings.colorSaturation, this.settings.colorBrightness * 0.3),
                );
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                this.ctx.fillStyle = gradient;
                this.ctx.globalAlpha = this.settings.glowIntensity * audioValue;
                this.ctx.beginPath();
                this.ctx.arc(x, y, size * 2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.globalAlpha = 1;
            }

            // Draw main circle
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Update animation values
        const avgAudio = totalAudio / this.particles.length;
        this.rotationOffset += avgAudio * this.settings.rotationSpeed * deltaTime;
        this.colorOffset += avgAudio * this.settings.colorSpeed * deltaTime;
    }

    clean(): void {
        if (this.canvas) {
            this.canvas.remove();
            this.canvas = null;
        }
        this.ctx = null;
        this.particles = [];
    }
}
