import { IScene } from '@/src/scene/scene';
import { NormalAudioDataDto, streamType } from '@/src/utils/eventMessage';
import { ParticleCircleSetting } from './setting';

function componentToHex(c: number): string {
    const hex = Math.min(Math.round(c), 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
}

function rgbToHex(r: number, g: number, b: number): string {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
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

export class ParticleCircle implements IScene {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private audioData: NormalAudioDataDto;
    private settings: ParticleCircleSetting;
    private colorOffset: number = 0.0;
    private rotation: number = 0.0;
    private time: number = 0.0;

    constructor() {
        this.audioData = new NormalAudioDataDto([]);
        this.settings = new ParticleCircleSetting();
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

    updateSettings(settings: ParticleCircleSetting): void {
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
        return rgbToHex(
            Math.min(255, r * boost),
            Math.min(255, g * boost),
            Math.min(255, b * boost)
        );
    }

    private drawCircle(x: number, y: number, radius: number, color: string): void {
        if (!this.ctx || radius <= 0) return;

        this.ctx.fillStyle = color;
        
        // Optional glow effect
        if (this.settings.enableGlow && radius > this.settings.glowThreshold) {
            this.ctx.shadowBlur = this.settings.glowIntensity * (radius / this.settings.maxParticleSize);
            this.ctx.shadowColor = color;
        } else {
            this.ctx.shadowBlur = 0;
        }

        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        this.ctx.fill();

        // Optional stroke for outline
        if (this.settings.enableStroke) {
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = this.settings.strokeWidth;
            this.ctx.stroke();
        }
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
        const barWidth = xs.circleMax / frequencyBinCount;
        
        // Limit particles for performance
        const maxParticles = Math.min(frequencyBinCount, xs.maxParticles);
        const particleSkip = Math.max(1, Math.floor(frequencyBinCount / maxParticles));
        
        let z = 0;
        this.time += 0.016; // Increment time for animations

        // Draw particles
        for (let i = 0; i < frequencyBinCount; i += particleSkip) {
            z = indexSpinner(z, xs.spectrumJumps, frequencyBinCount - 1);
            const specValue = data[z] || 0;
            
            // Skip very low values to save performance
            if (specValue < 5 && !xs.enableGlow) {
                continue;
            }
            
            const scaledSpec = specValue * xs.musicScale;
            
            // Enhanced color calculation with time-based animation
            const colorStrength = xs.colorStrength * specValue;
            const colorSpeed = xs.colorWidth - specValue / xs.musicColorInfluenceReducer;
            this.colorOffset += colorSpeed;
            
            // Add time-based color animation
            const timeOffset = this.time * xs.colorAnimationSpeed;
            const barColorOffset = (i / frequencyBinCount) * Math.PI * 2; // Distribute colors around circle
            const rgbS = this.colorOffset + timeOffset + barColorOffset;
            
            const color = this.getClr(rgbS, colorStrength);

            // Calculate angle with rotation
            const theta = (i / frequencyBinCount) * xs.circleMax + this.rotation;
            
            // Calculate position
            const radius = innerWidth + scaledSpec;
            const x = Math.sin(theta) * radius + centerX;
            const y = Math.cos(theta) * radius + centerY;
            
            // Calculate particle size with enhanced responsiveness
            const baseSize = xs.particleWidth * scaledSpec;
            const size = baseSize * (1.0 + xs.sizeMultiplier * (specValue / 255));

            this.drawCircle(x, y, size, color);
        }
        
        // Reset shadow after drawing
        this.ctx.shadowBlur = 0;

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
    }
}

