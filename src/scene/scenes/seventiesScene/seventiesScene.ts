import type { IScene } from '@/src/scene/scene';
import { createFullscreenCanvas } from '@/src/utils/canvas';
import { NormalAudioDataDto, streamType } from '@/src/utils/eventMessage';
import { SeventiesSceneSetting } from './setting';

interface Circle {
    x: number;
    y: number;
    r: number;
    target: number;
    speed: number;
    hue: number;
    opacity: number;
}

export class SeventiesScene implements IScene {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private audioData: NormalAudioDataDto;
    private settings: SeventiesSceneSetting;
    private circles: Circle[] = [];

    constructor() {
        this.audioData = new NormalAudioDataDto([]);
        this.settings = new SeventiesSceneSetting();
    }

    streamType = streamType.normal;

    build(): void {
        this.canvas = createFullscreenCanvas();
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            return;
        }
    }

    updateSettings(settings: SeventiesSceneSetting): void {
        this.settings = settings;
    }

    updateAudioData(data: NormalAudioDataDto): void {
        this.audioData = data;
    }

    private getVolume(): number {
        const data = this.audioData.timeByteArray;
        if (data.length === 0) return 0;

        // Use more frequency bins for better responsiveness
        const binCount = Math.floor(data.length / 8); // Use 1/8 instead of 1/16 for more data
        let sum = 0;
        for (let i = 0; i < binCount; i++) {
            sum += data[i] || 0;
        }
        // Apply sensitivity as a multiplier
        return sum * this.settings.volumeSensitivity;
    }

    private startCircles(vol: number): void {
        const threshold = vol / (this.circles.length * this.settings.crowdSuppression);
        if (threshold > this.settings.spawnThreshold) {
            this.createCircle(vol);
        }
    }

    private updateCircles(vol: number): void {
        const data = this.audioData.timeByteArray;
        if (data.length === 0) return;

        // Volume is already multiplied by volumeSensitivity in getVolume()
        // Now just divide by speedReducer for controlled movement
        vol = vol / this.settings.speedReducer;

        // Calculate bottom and top frequency ranges
        const bottomEnd = Math.floor(data.length / 10);
        let bottom = 0;
        for (let i = 0; i < bottomEnd; i++) {
            bottom += data[i] || 0;
        }

        let top = 0;
        for (let i = bottomEnd; i < data.length; i++) {
            top += data[i] || 0;
        }

        // Apply volumeSensitivity to frequency difference for responsiveness
        const controller = ((top - bottom) * this.settings.volumeSensitivity) / this.settings.speedReducer;

        // Update all circles
        for (let i = this.circles.length - 1; i >= 0; i--) {
            const circle = this.circles[i];

            circle.x += controller;
            circle.y += vol;
            circle.r += vol * this.settings.expansionSpeed;
            circle.hue += vol * this.settings.hueRotationSpeed;

            // Wrap hue
            if (circle.hue > 360) {
                circle.hue -= 360;
            } else if (circle.hue < 0) {
                circle.hue += 360;
            }

            // Fade out when reaching target size
            if (circle.r > circle.target) {
                circle.opacity -= this.settings.fadeSpeed * vol;
                if (circle.opacity <= 0) {
                    this.circles.splice(i, 1);
                    continue;
                }
            }

            // Remove circles that are off-screen
            if (
                circle.x < -circle.r ||
                circle.x > (this.canvas?.width || 0) + circle.r ||
                circle.y < -circle.r ||
                circle.y > (this.canvas?.height || 0) + circle.r
            ) {
                this.circles.splice(i, 1);
            }
        }
    }

    private drawCircles(): void {
        if (!this.ctx) return;

        for (const circle of this.circles) {
            this.ctx.lineWidth = this.settings.lineWidth;
            this.ctx.strokeStyle = `hsla(${circle.hue}, ${this.settings.saturation}%, ${this.settings.lightness}%, ${circle.opacity})`;

            this.ctx.beginPath();
            this.ctx.arc(circle.x, circle.y, circle.r, 0, 2 * Math.PI);
            this.ctx.stroke();

            // Optional fill for more dramatic effect
            if (this.settings.enableFill) {
                this.ctx.fillStyle = `hsla(${circle.hue}, ${this.settings.saturation}%, ${this.settings.lightness}%, ${circle.opacity * this.settings.fillOpacity})`;
                this.ctx.fill();
            }
        }
    }

    private createCircle(vol: number): void {
        if (!this.canvas) return;

        const x = Math.random() * this.canvas.width;
        const y = Math.max(0, Math.min(this.canvas.height - vol / 10, this.canvas.height));
        const speed = this.settings.speedMusicScale;
        const hue_start = Math.random() * 360;
        const opacity_step = Math.PI / this.settings.opacitySteps;
        const target_size = this.settings.targetSize;

        // Create multiple circles per spawn for layered effect
        for (let i = 0; i < this.settings.circleResolution; i++) {
            this.circles.push({
                x: x + (Math.random() - 0.5) * this.settings.spreadAmount,
                y: y + (Math.random() - 0.5) * this.settings.spreadAmount,
                r: i * this.settings.initialRadiusStep,
                target: target_size + (Math.random() - 0.5) * this.settings.targetSizeVariation,
                speed: speed,
                hue: hue_start + i * this.settings.hueStep + (Math.random() - 0.5) * this.settings.hueVariation,
                opacity: 1 - Math.abs(Math.cos(opacity_step * i)),
            });
        }
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

        // Clear background with optional fade for trails
        if (this.settings.enableTrails) {
            this.ctx.fillStyle = `rgba(0, 0, 0, ${this.settings.trailOpacity})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        const vol = this.getVolume();
        this.startCircles(vol);
        this.updateCircles(vol);
        this.drawCircles();
    }

    clean(): void {
        if (this.canvas === null) {
            return;
        }

        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }

        this.circles = [];
        this.canvas.remove();
    }
}
