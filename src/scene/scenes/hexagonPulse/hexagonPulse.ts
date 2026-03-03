import type { IScene } from '@/src/scene/scene';
import { createFullscreenCanvas } from '@/src/utils/canvas';
import { NormalAudioDataDto, streamType } from '@/src/utils/eventMessage';
import { HexagonPulseSetting } from './setting';

interface Hexagon {
    x: number;
    y: number;
    vertices: [number, number][];
    high: number;
    highlight: number;
    index: number;
}

interface Star {
    x: number;
    y: number;
    angle: number;
    size: number;
    speed: number;
}

export class HexagonPulse implements IScene {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private audioData: NormalAudioDataDto;
    private settings: HexagonPulseSetting = new HexagonPulseSetting();
    private hexagons: Hexagon[] = [];
    private stars: Star[] = [];
    private rotation: number = 0;
    private volume: number = 0;

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

        this.buildHexagonGrid();
        this.buildStarfield();
    }

    private buildHexagonGrid(): void {
        this.hexagons = [];
        const size = this.settings.tileSize;
        let index = 0;

        // Center hexagon
        this.hexagons.push(this.createHexagon(0, 0, size, index++));

        // Build hexagonal layers
        for (let layer = 1; layer <= this.settings.numLayers; layer++) {
            // Top and bottom of layer
            this.hexagons.push(this.createHexagon(0, layer, size, index++));
            this.hexagons.push(this.createHexagon(0, -layer, size, index++));

            for (let x = 1; x < layer; x++) {
                this.hexagons.push(this.createHexagon(x, -layer, size, index++));
                this.hexagons.push(this.createHexagon(-x, layer, size, index++));
                this.hexagons.push(this.createHexagon(x, layer - x, size, index++));
                this.hexagons.push(this.createHexagon(-x, -layer + x, size, index++));
            }

            for (let y = -layer; y <= 0; y++) {
                this.hexagons.push(this.createHexagon(layer, y, size, index++));
                this.hexagons.push(this.createHexagon(-layer, -y, size, index++));
            }
        }
    }

    private createHexagon(gridX: number, gridY: number, size: number, index: number): Hexagon {
        const step = Math.round(Math.cos(Math.PI / 6) * size * 2);
        const y = Math.round(step * Math.sin(Math.PI / 3) * -gridY);
        const x = Math.round(gridX * step + (gridY * step) / 2);

        const vertices: [number, number][] = [];
        for (let i = 1; i <= 6; i++) {
            const vx = x + size * Math.cos((i * 2 * Math.PI) / 6 + Math.PI / 6);
            const vy = y + size * Math.sin((i * 2 * Math.PI) / 6 + Math.PI / 6);
            vertices.push([vx, vy]);
        }

        return { x, y, vertices, high: 0, highlight: 0, index };
    }

    private buildStarfield(): void {
        if (!this.canvas) return;
        this.stars = [];
        for (let i = 0; i < this.settings.starCount; i++) {
            this.stars.push({
                x: (Math.random() - 0.5) * this.canvas.width,
                y: (Math.random() - 0.5) * this.canvas.height,
                angle: Math.random() * Math.PI * 2,
                size: (Math.random() + 0.1) * 3,
                speed: 0,
            });
        }
    }

    private rotatePoint(x: number, y: number, angle: number): [number, number] {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return [x * cos - y * sin, x * sin + y * cos];
    }

    updateSettings(settings: HexagonPulseSetting): void {
        const needsRebuild =
            settings.tileSize !== this.settings.tileSize ||
            settings.numLayers !== this.settings.numLayers ||
            settings.starCount !== this.settings.starCount;
        this.settings = settings;
        if (needsRebuild) {
            this.buildHexagonGrid();
            this.buildStarfield();
        }
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
            this.buildStarfield();
        }

        const { width, height } = this.canvas;
        const centerX = width / 2;
        const centerY = height / 2;

        // Calculate volume
        const audioArray = this.audioData.timeByteArray;
        if (audioArray.length === 0) {
            this.volume = 0;
        } else {
            let sum = 0;
            for (let i = 0; i < audioArray.length; i++) {
                sum += audioArray[i] || 0;
            }
            this.volume = (sum / audioArray.length) * this.settings.pulseIntensity;
        }

        // Clear background
        this.ctx.fillStyle = `rgb(${Math.floor(this.settings.backgroundR * 255)}, ${Math.floor(this.settings.backgroundG * 255)}, ${Math.floor(this.settings.backgroundB * 255)})`;
        this.ctx.fillRect(0, 0, width, height);

        // Update rotation
        const rotationMod = this.volume > 40 ? Math.sin(this.volume / 800) : 0;
        this.rotation += this.settings.rotationSpeed - rotationMod * 0.01;

        this.ctx.save();
        this.ctx.translate(centerX, centerY);

        // Draw stars
        if (this.settings.showStars) {
            this.drawStars();
        }

        // Draw hexagons
        this.drawHexagons();

        this.ctx.restore();
    }

    private drawStars(): void {
        if (!this.ctx || !this.canvas) return;

        for (const star of this.stars) {
            const distance = Math.sqrt(star.x * star.x + star.y * star.y);
            const brightness = 200 + Math.min(Math.round(star.speed * 5), 55);

            // Draw star as line
            this.ctx.strokeStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
            this.ctx.lineWidth = 0.5 + (distance / 2000) * Math.max(star.size / 2, 1);
            this.ctx.beginPath();
            this.ctx.moveTo(star.x, star.y);

            const lengthFactor =
                1 + Math.min(((distance ** 2 / 30000) * this.volume ** 2) / 6000, distance) * this.settings.starSpeed;

            const toX = Math.cos(star.angle) * -lengthFactor;
            const toY = Math.sin(star.angle) * -lengthFactor;

            this.ctx.lineTo(star.x + (star.x > 0 ? toX : -toX), star.y + (star.y > 0 ? toY : -toY));
            this.ctx.stroke();

            // Update star position
            const speed = (lengthFactor / 20) * star.size * this.settings.starSpeed;
            star.speed = Math.max(star.speed - 0.0001, 0);
            if (speed > star.speed) star.speed = speed;

            const dX = Math.cos(star.angle) * star.speed;
            const dY = Math.sin(star.angle) * star.speed;
            star.x += star.x > 0 ? dX : -dX;
            star.y += star.y > 0 ? dY : -dY;

            // Respawn if off screen
            const limitY = this.canvas.height / 2 + 500;
            const limitX = this.canvas.width / 2 + 500;
            if (Math.abs(star.y) > limitY || Math.abs(star.x) > limitX) {
                star.x = ((Math.random() - 0.5) * this.canvas.width) / 3;
                star.y = ((Math.random() - 0.5) * this.canvas.height) / 3;
                star.angle = Math.atan2(star.y, star.x);
            }
        }
    }

    private drawHexagons(): void {
        if (!this.ctx) return;

        const audioArray = this.audioData.timeByteArray;

        for (const hex of this.hexagons) {
            // Get audio value for this hexagon
            const bucket = Math.ceil((audioArray.length / this.hexagons.length) * hex.index);
            let val = ((audioArray[bucket] || 0) / 255) ** 2 * 255;
            val *= hex.index > 42 ? 1.1 : 1;

            // Update high value with decay
            if (val > hex.high) {
                hex.high = val;
            } else {
                hex.high -= this.settings.decayRate;
            }
            val = Math.max(hex.high, 0);

            if (val > 0) {
                // Rotate vertices
                const rotatedVerts = hex.vertices.map((v) => this.rotatePoint(v[0], v[1], this.rotation));

                // Calculate offset based on audio
                const mentalFactor = Math.min(
                    Math.max(Math.tan(this.volume / 6000) * this.settings.distortionAmount, -20),
                    2,
                );

                this.ctx.beginPath();
                const offset0 = this.calculateOffset(rotatedVerts[0], hex.high, mentalFactor);
                this.ctx.moveTo(rotatedVerts[0][0] + offset0[0], rotatedVerts[0][1] + offset0[1]);

                for (let i = 1; i < 6; i++) {
                    const offset = this.calculateOffset(rotatedVerts[i], hex.high, mentalFactor);
                    this.ctx.lineTo(rotatedVerts[i][0] + offset[0], rotatedVerts[i][1] + offset[1]);
                }
                this.ctx.closePath();

                // Calculate color
                const hue = (this.settings.baseHue + (val / 255) * this.settings.hueRange) % 360;
                const sat = this.settings.saturation * 100;
                const light = this.settings.brightness * (val / 255) * 100;
                const alpha = 0.5 + (val / 255) * 0.5;

                this.ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;
                this.ctx.fill();

                // Stroke
                if (val > 20) {
                    this.ctx.strokeStyle = 'rgba(20, 20, 20, 0.5)';
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }

                // Highlight effect
                if (val > 120) {
                    hex.highlight = 100;
                }
            }

            // Draw highlight
            if (hex.highlight > 0) {
                this.drawHighlight(hex);
                hex.highlight -= 0.5;
            }
        }
    }

    private calculateOffset(coords: [number, number], high: number, mentalFactor: number): [number, number] {
        const distance = Math.sqrt(coords[0] * coords[0] + coords[1] * coords[1]);
        const angle = Math.atan2(coords[1], coords[0]);
        const offsetFactor = (((distance / 3) ** 2 * (this.volume / 2000) * high ** 1.3) / 300) * mentalFactor;
        return [Math.cos(angle) * offsetFactor, Math.sin(angle) * offsetFactor];
    }

    private drawHighlight(hex: Hexagon): void {
        if (!this.ctx) return;

        const rotatedVerts = hex.vertices.map((v) => this.rotatePoint(v[0], v[1], this.rotation));

        this.ctx.beginPath();
        this.ctx.moveTo(rotatedVerts[0][0], rotatedVerts[0][1]);
        for (let i = 1; i < 6; i++) {
            this.ctx.lineTo(rotatedVerts[i][0], rotatedVerts[i][1]);
        }
        this.ctx.closePath();

        this.ctx.strokeStyle = `rgba(255, 255, 255, ${(hex.highlight / 100) * this.settings.highlightIntensity})`;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }

    clean(): void {
        if (this.canvas) {
            this.canvas.remove();
            this.canvas = null;
        }
        this.ctx = null;
        this.hexagons = [];
        this.stars = [];
    }
}
