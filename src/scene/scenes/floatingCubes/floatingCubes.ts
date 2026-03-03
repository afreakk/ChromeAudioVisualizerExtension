import type { IScene } from '@/src/scene/scene';
import { createFullscreenCanvas } from '@/src/utils/canvas';
import { hexToRgb } from '@/src/utils/color';
import { NormalAudioDataDto, streamType } from '@/src/utils/eventMessage';
import { FloatingCubesSetting } from './setting';

interface Cube {
    x: number;
    y: number;
    audioIndex: number;
    hue: number;
}

export class FloatingCubes implements IScene {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private audioData: NormalAudioDataDto;
    private settings: FloatingCubesSetting = new FloatingCubesSetting();
    private cubes: Cube[] = [];
    private cachedBgColor = { r: 0, g: 0, b: 0 };
    private cachedBorderColor = { r: 0, g: 0, b: 0 };

    constructor() {
        this.audioData = new NormalAudioDataDto([]);
        this.cacheColors();
    }

    private cacheColors(): void {
        this.cachedBgColor = hexToRgb(this.settings.backgroundColor) ?? { r: 0, g: 0, b: 0 };
        this.cachedBorderColor = hexToRgb(this.settings.borderColor) ?? { r: 0, g: 0, b: 0 };
    }

    streamType = streamType.normal;

    build(): void {
        this.canvas = createFullscreenCanvas();
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            return;
        }

        this.initCubes();
    }

    private initCubes(): void {
        if (!this.canvas) return;
        this.cubes = [];

        for (let i = 0; i < this.settings.cubeCount; i++) {
            this.cubes.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                audioIndex: i % 256,
                hue: (i / this.settings.cubeCount) * 360,
            });
        }
    }

    private hslToString(h: number, s: number, l: number, alpha?: number): string {
        if (alpha !== undefined) {
            return `hsla(${h % 360}, ${s}%, ${l}%, ${alpha})`;
        }
        return `hsl(${h % 360}, ${s}%, ${l}%)`;
    }

    updateSettings(settings: FloatingCubesSetting): void {
        const needsReinit = settings.cubeCount !== this.settings.cubeCount;
        this.settings = settings;
        this.cacheColors();
        if (needsReinit) {
            this.initCubes();
        }
    }

    updateAudioData(data: NormalAudioDataDto): void {
        this.audioData = data;
    }

    render(): void {
        if (!this.canvas || !this.ctx) return;

        const audioArray = this.audioData.timeByteArray;
        if (!audioArray || audioArray.length === 0) {
            return;
        }

        // Only resize when necessary (resizing clears the canvas)
        const needsResize = this.canvas.width !== window.innerWidth || this.canvas.height !== window.innerHeight;
        if (needsResize) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.initCubes();
        }

        const { width, height } = this.canvas;
        const bgColor = this.cachedBgColor;
        const borderColor = this.cachedBorderColor;

        // Draw background - solid if resized, semi-transparent for trail effect otherwise
        if (needsResize) {
            this.ctx.fillStyle = `rgb(${bgColor.r}, ${bgColor.g}, ${bgColor.b})`;
        } else {
            this.ctx.fillStyle = `rgba(${bgColor.r}, ${bgColor.g}, ${bgColor.b}, ${1 - this.settings.trailOpacity})`;
        }
        this.ctx.fillRect(0, 0, width, height);

        const size = this.settings.cubeSize;
        const halfSize = size / 2;

        for (const cube of this.cubes) {
            // Get audio value
            const audioValue = ((audioArray[cube.audioIndex] || 0) / 255) * this.settings.audioSensitivity;

            // Update position based on audio
            const moveX =
                Math.sin(audioValue * this.settings.directionChangeSpeed * 100) *
                audioValue *
                this.settings.danceSpeed *
                100;
            const moveY =
                Math.cos(audioValue * this.settings.directionChangeSpeed * 100) *
                audioValue *
                this.settings.danceSpeed *
                100;

            cube.x += moveX;
            cube.y += moveY;

            // Wrap around screen
            if (cube.x > width + size) cube.x = -size;
            if (cube.x < -size) cube.x = width + size;
            if (cube.y > height + size) cube.y = -size;
            if (cube.y < -size) cube.y = height + size;

            // Update hue based on audio
            cube.hue += audioValue * this.settings.colorSpeed * 10;

            // Calculate color
            const brightness = 30 + audioValue * this.settings.colorStrength * 70;
            const color = this.hslToString(cube.hue, 80, brightness);

            // Draw glow
            if (this.settings.glowIntensity > 0 && audioValue > 0.1) {
                const glowSize = size * 2 * this.settings.glowIntensity;
                const gradient = this.ctx.createRadialGradient(
                    cube.x + halfSize,
                    cube.y + halfSize,
                    0,
                    cube.x + halfSize,
                    cube.y + halfSize,
                    glowSize,
                );
                // '40' was likely meant as 40% opacity for glow effect
                gradient.addColorStop(0, this.hslToString(cube.hue, 80, 50, 0.4));
                gradient.addColorStop(1, 'transparent');
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(
                    cube.x + halfSize - glowSize,
                    cube.y + halfSize - glowSize,
                    glowSize * 2,
                    glowSize * 2,
                );
            }

            // Draw cube
            this.ctx.fillStyle = color;
            this.ctx.fillRect(cube.x, cube.y, size, size);

            // Draw border
            if (this.settings.borderWidth > 0) {
                this.ctx.strokeStyle = `rgb(${borderColor.r}, ${borderColor.g}, ${borderColor.b})`;
                this.ctx.lineWidth = this.settings.borderWidth;
                this.ctx.strokeRect(cube.x, cube.y, size, size);
            }
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
        this.cubes = [];
    }
}
