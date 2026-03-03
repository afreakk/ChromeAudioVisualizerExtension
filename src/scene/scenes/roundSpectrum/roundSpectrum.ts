import type { IScene } from '@/src/scene/scene';
import { createFullscreenCanvas } from '@/src/utils/canvas';
import { NormalAudioDataDto, streamType } from '@/src/utils/eventMessage';
import { RoundSpectrumSetting } from './setting';

function componentToHex(c: number): string {
    const hex = Math.min(Math.round(c), 255).toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
}

function rgbToHex(r: number, g: number, b: number): string {
    return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
}

function indexSpinner(i: number, velocity: number, max: number): number {
    i += velocity;
    while (i > max) {
        i -= max + 1;
    }
    while (i < 0) {
        i += max + 1;
    }
    return Math.max(Math.min(i, max), 0);
}

function getTriangle(
    theta: number,
    baseWidth: number,
    barWidth: number,
    outerWidth: number,
    centerX: number,
    centerY: number,
): number[] {
    return [
        Math.sin(theta) * baseWidth + centerX,
        Math.cos(theta) * baseWidth + centerY,

        Math.sin(theta) * baseWidth * outerWidth + centerX,
        Math.cos(theta) * baseWidth * outerWidth + centerY,

        Math.sin(theta + barWidth) * baseWidth * outerWidth + centerX,
        Math.cos(theta + barWidth) * baseWidth * outerWidth + centerY,

        Math.sin(theta + barWidth) * baseWidth + centerX,
        Math.cos(theta + barWidth) * baseWidth + centerY,
    ];
}

export class RoundSpectrum implements IScene {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private audioData: NormalAudioDataDto;
    private settings: RoundSpectrumSetting;
    private colorOffset: number = 0.0;
    private rotation: number = 0.0;
    private time: number = 0.0;
    private glowSprite: HTMLCanvasElement | null = null;
    private static readonly GLOW_SPRITE_SIZE = 64;

    constructor() {
        this.audioData = new NormalAudioDataDto([]);
        this.settings = new RoundSpectrumSetting();
    }

    streamType = streamType.normal;

    build(): void {
        this.canvas = createFullscreenCanvas();
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            return;
        }
        this.initGlowSprite();
    }

    private initGlowSprite(): void {
        const size = RoundSpectrum.GLOW_SPRITE_SIZE;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const half = size / 2;
        const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.15)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        this.glowSprite = canvas;
    }

    updateSettings(settings: RoundSpectrumSetting): void {
        this.settings = settings;
    }

    updateAudioData(data: NormalAudioDataDto): void {
        this.audioData = data;
    }

    private getClr(rgbS: number, scaled_average_c: number): string {
        // Enhanced color calculation with more vibrant colors
        const r = (Math.sin(rgbS) / 2.0 + 0.5) * scaled_average_c;
        const g = (Math.cos(rgbS) / 2.0 + 0.5) * scaled_average_c;
        const b = (Math.sin(rgbS + this.settings.colorOffset) / 2.0 + 0.5) * scaled_average_c;

        // Boost colors for more dramatic effect
        const boost = 1.0 + this.settings.colorBoost;
        return rgbToHex(Math.min(255, r * boost), Math.min(255, g * boost), Math.min(255, b * boost));
    }

    render(): void {
        if (!this.canvas || !this.ctx) {
            return;
        }

        const data = this.audioData.timeByteArray;
        if (data.length === 0) {
            return;
        }

        // Update canvas size
        if (this.canvas.width !== window.innerWidth || this.canvas.height !== window.innerHeight) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }

        // Clear background with optional fade effect
        if (this.settings.enableTrails) {
            this.ctx.fillStyle = `rgba(0, 0, 0, ${this.settings.trailOpacity})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        const xs = this.settings;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const frequencyBinCount = data.length;

        // Update rotation for spinning effect
        if (this.settings.enableRotation) {
            this.rotation += this.settings.rotationSpeed;
            if (this.rotation > Math.PI * 2) {
                this.rotation -= Math.PI * 2;
            }
        }

        // Calculate inner radius based on canvas size
        const innerWidth = Math.min(this.canvas.width, this.canvas.height) / xs.innerRadiusDivisor;

        // Optimize: Limit number of bars and skip some for performance
        const effectiveBarCount = Math.min(frequencyBinCount, xs.maxBars);
        const actualBarCount = Math.floor(effectiveBarCount / xs.barSkip);
        const barWidth = xs.circleMax / actualBarCount;

        let z = 0;
        this.time += 0.016; // Increment time for animations

        const hasGlow = xs.enableGlow;

        // Draw spectrum bars (optimized loop)
        for (let i = 0; i < actualBarCount; i++) {
            const originalIndex = i * xs.barSkip;
            z = indexSpinner(z, xs.spectrumJumps, frequencyBinCount - 1);
            const specValue = data[z] || 0;

            // Skip very low values to save performance
            if (specValue < 5 && !hasGlow) {
                continue;
            }

            // Enhanced color calculation with time-based animation
            // Adjust color speed based on bar count for smoother transitions
            const colorStrength = xs.colorStrength * specValue;
            const colorSpeed = (xs.colorWidth / actualBarCount) * 50 - specValue / xs.musicColorInfluenceReducer;
            this.colorOffset += colorSpeed;

            // Add time-based color animation with bar-based offset for better distribution
            const timeOffset = this.time * xs.colorAnimationSpeed;
            const barColorOffset = (i / actualBarCount) * Math.PI * 2; // Distribute colors around circle
            const rgbS = this.colorOffset + timeOffset + barColorOffset;

            const fillColor = this.getClr(rgbS, colorStrength);
            this.ctx.fillStyle = fillColor;

            // Calculate angle with rotation
            const theta = (originalIndex / effectiveBarCount) * xs.circleMax + this.rotation;

            // Calculate outer width with enhanced responsiveness
            const baseOuterWidth = xs.staticWidth + specValue * xs.musicHeightPower;
            const outerWidth = baseOuterWidth * (1.0 + xs.heightMultiplier * (specValue / 255));

            // Get triangle points
            const p = getTriangle(theta, innerWidth, barWidth, outerWidth, centerX, centerY);

            // Draw sprite-based glow instead of shadowBlur
            if (hasGlow && specValue > xs.glowThreshold && this.glowSprite) {
                const glowSize = xs.glowIntensity * (specValue / 255) * 0.5;
                const spriteSize = RoundSpectrum.GLOW_SPRITE_SIZE;
                const cx = (p[0] + p[2] + p[4] + p[6]) / 4;
                const cy = (p[1] + p[3] + p[5] + p[7]) / 4;
                this.ctx.globalCompositeOperation = 'lighter';
                this.ctx.drawImage(
                    this.glowSprite,
                    0,
                    0,
                    spriteSize,
                    spriteSize,
                    cx - glowSize,
                    cy - glowSize,
                    glowSize * 2,
                    glowSize * 2,
                );
                this.ctx.globalCompositeOperation = 'source-over';
            }

            // Batch path operations
            this.ctx.beginPath();
            this.ctx.moveTo(p[0], p[1]);
            this.ctx.lineTo(p[2], p[3]);
            this.ctx.lineTo(p[4], p[5]);
            this.ctx.lineTo(p[6], p[7]);
            this.ctx.closePath();
            this.ctx.fill();
        }

        // Draw center circle for extra visual appeal
        if (this.settings.showCenterCircle) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${this.settings.centerCircleOpacity})`;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, innerWidth * 0.3, 0, Math.PI * 2);
            this.ctx.fill();
        }
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
        this.glowSprite = null;
    }
}
