import { IScene } from '@/src/scene/scene';
import { NormalAudioDataDto, streamType } from '@/src/utils/eventMessage';
import { AudioTerrainSetting } from './setting';

// Simple noise function (simplex-like)
class SimplexNoise {
    private perm: number[] = [];

    constructor() {
        const p = [];
        for (let i = 0; i < 256; i++) p[i] = Math.floor(Math.random() * 256);
        for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
    }

    private fade(t: number): number {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    private lerp(a: number, b: number, t: number): number {
        return a + t * (b - a);
    }

    private grad(hash: number, x: number, y: number): number {
        const h = hash & 3;
        const u = h < 2 ? x : y;
        const v = h < 2 ? y : x;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    noise(x: number, y: number): number {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        x -= Math.floor(x);
        y -= Math.floor(y);
        const u = this.fade(x);
        const v = this.fade(y);
        const A = this.perm[X] + Y;
        const B = this.perm[X + 1] + Y;
        return this.lerp(
            this.lerp(this.grad(this.perm[A], x, y), this.grad(this.perm[B], x - 1, y), u),
            this.lerp(this.grad(this.perm[A + 1], x, y - 1), this.grad(this.perm[B + 1], x - 1, y - 1), u),
            v
        );
    }
}

export class AudioTerrain implements IScene {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private audioData: NormalAudioDataDto;
    private settings: AudioTerrainSetting;
    private noise: SimplexNoise;
    private scrollOffset: number = 0;
    private time: number = 0;

    constructor() {
        this.audioData = new NormalAudioDataDto([]);
        this.settings = new AudioTerrainSetting();
        this.noise = new SimplexNoise();
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
            console.error('Unable to initialize Canvas 2D.');
            return;
        }
    }

    updateSettings(settings: AudioTerrainSetting): void {
        this.settings = settings;
    }

    updateAudioData(data: NormalAudioDataDto): void {
        this.audioData = data;
    }

    private getAudioSum(): number {
        const data = this.audioData.timeByteArray;
        if (data.length === 0) return 0;
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            sum += data[i];
        }
        return sum;
    }

    private getAudioAt(index: number): number {
        const data = this.audioData.timeByteArray;
        if (data.length === 0) return 0;
        const i = Math.abs(index) % data.length;
        return (data[i] || 0) / 255;
    }

    private projectPoint(x: number, y: number, z: number): { x: number; y: number; scale: number } | null {
        const s = this.settings;
        const canvas = this.canvas!;

        // Camera position
        const camY = s.cameraHeight;
        const camZ = s.cameraDistance;

        // Translate relative to camera
        const relZ = z - camZ;

        // Don't render points behind camera
        if (relZ >= -1) return null;

        // Perspective projection
        const fov = 400;
        const scale = fov / -relZ;
        const screenX = canvas.width / 2 + x * scale;
        const screenY = canvas.height / 2 - (y - camY) * scale + s.horizonOffset;

        return { x: screenX, y: screenY, scale };
    }

    private getTerrainHeight(x: number, z: number, audioBoost: number): number {
        const s = this.settings;
        const noiseVal = this.noise.noise(x * s.noiseScale, z * s.noiseScale + this.scrollOffset);
        const baseHeight = (noiseVal * 0.5 + 0.5) * s.mountainHeight;

        // Add audio reactivity based on x position
        const audioIndex = Math.floor(Math.abs(x) * 2);
        const audioHeight = this.getAudioAt(audioIndex) * s.audioHeightMultiplier * s.mountainHeight;

        return baseHeight + audioHeight * audioBoost;
    }

    private lerpColor(
        r1: number, g1: number, b1: number,
        r2: number, g2: number, b2: number,
        t: number
    ): string {
        // Apply power curve for more dramatic color transition
        const curve = Math.pow(t, 0.7);
        const r = Math.floor(r1 + (r2 - r1) * curve);
        const g = Math.floor(g1 + (g2 - g1) * curve);
        const b = Math.floor(b1 + (b2 - b1) * curve);
        return `rgb(${r},${g},${b})`;
    }

    private getHeightColor(heightRatio: number): string {
        const s = this.settings;
        // Multi-stop gradient: low -> mid -> high
        // This creates more visible height bands
        if (heightRatio < 0.4) {
            // Low areas - dark blue/purple
            const t = heightRatio / 0.4;
            return this.lerpColor(
                s.terrainLowR * 255 * 0.3, s.terrainLowG * 255 * 0.3, s.terrainLowB * 255 * 0.5,
                s.terrainLowR * 255, s.terrainLowG * 255, s.terrainLowB * 255,
                t
            );
        } else if (heightRatio < 0.7) {
            // Mid areas - transition
            const t = (heightRatio - 0.4) / 0.3;
            return this.lerpColor(
                s.terrainLowR * 255, s.terrainLowG * 255, s.terrainLowB * 255,
                (s.terrainLowR + s.terrainHighR) * 127, (s.terrainLowG + s.terrainHighG) * 127, (s.terrainLowB + s.terrainHighB) * 127,
                t
            );
        } else {
            // High areas - bright magenta/pink
            const t = (heightRatio - 0.7) / 0.3;
            return this.lerpColor(
                (s.terrainLowR + s.terrainHighR) * 127, (s.terrainLowG + s.terrainHighG) * 127, (s.terrainLowB + s.terrainHighB) * 127,
                s.terrainHighR * 255, s.terrainHighG * 255, s.terrainHighB * 255,
                t
            );
        }
    }

    render(): void {
        if (!this.canvas || !this.ctx) return;

        const ctx = this.ctx;
        const s = this.settings;

        // Update canvas size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        const width = this.canvas.width;
        const height = this.canvas.height;

        // Get audio data
        const audioSum = this.getAudioSum();
        const normalizedAudio = audioSum / (this.audioData.timeByteArray.length * 255 || 1);

        // Update scroll
        this.scrollOffset += s.scrollSpeed + normalizedAudio * s.audioScrollMultiplier * s.scrollSpeed * 10;
        this.time += 0.016;

        // Draw gradient sky
        const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.6);
        skyGradient.addColorStop(0, `rgb(${Math.floor(s.skyTopR * 255)},${Math.floor(s.skyTopG * 255)},${Math.floor(s.skyTopB * 255)})`);
        skyGradient.addColorStop(1, `rgb(${Math.floor(s.skyBottomR * 255)},${Math.floor(s.skyBottomG * 255)},${Math.floor(s.skyBottomB * 255)})`);
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, width, height);

        // Draw sun
        if (s.showSun) {
            const sunX = width / 2;
            const sunY = height * (1 - s.sunY);
            const sunRadius = s.sunSize;

            // Sun glow
            const glowGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 2);
            glowGradient.addColorStop(0, 'rgba(255, 100, 50, 0.8)');
            glowGradient.addColorStop(0.3, 'rgba(255, 50, 100, 0.4)');
            glowGradient.addColorStop(1, 'rgba(255, 0, 100, 0)');
            ctx.fillStyle = glowGradient;
            ctx.fillRect(0, 0, width, height);

            // Sun body with horizontal lines
            ctx.save();
            ctx.beginPath();
            ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
            ctx.clip();

            const sunGradient = ctx.createLinearGradient(sunX, sunY - sunRadius, sunX, sunY + sunRadius);
            sunGradient.addColorStop(0, '#ff6030');
            sunGradient.addColorStop(0.5, '#ff3060');
            sunGradient.addColorStop(1, '#ff0080');
            ctx.fillStyle = sunGradient;
            ctx.fillRect(sunX - sunRadius, sunY - sunRadius, sunRadius * 2, sunRadius * 2);

            // Sun stripes
            ctx.fillStyle = `rgba(${Math.floor(s.skyBottomR * 255)},${Math.floor(s.skyBottomG * 255)},${Math.floor(s.skyBottomB * 255)}, 1)`;
            for (let i = 0; i < 8; i++) {
                const stripeY = sunY + sunRadius * 0.2 + i * sunRadius * 0.12;
                const stripeHeight = 2 + i * 1.5;
                ctx.fillRect(sunX - sunRadius, stripeY, sunRadius * 2, stripeHeight);
            }
            ctx.restore();
        }

        // Generate terrain grid
        const gridW = s.gridWidth;
        const gridH = s.gridHeight;
        const halfW = gridW / 2;

        // Store projected points
        const points: ({ x: number; y: number; worldY: number; scale: number } | null)[][] = [];

        for (let z = 0; z < gridH; z++) {
            points[z] = [];
            const worldZ = -z * s.tileSize;

            for (let x = 0; x < gridW; x++) {
                const worldX = (x - halfW) * s.tileSize;
                const terrainY = this.getTerrainHeight(worldX, worldZ, normalizedAudio * 3 + 0.5);
                const projected = this.projectPoint(worldX, terrainY, worldZ);

                if (projected) {
                    points[z][x] = { ...projected, worldY: terrainY };
                } else {
                    points[z][x] = null;
                }
            }
        }

        // Draw terrain
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (s.wireframeMode) {
            // Wireframe mode - draw grid lines
            ctx.lineWidth = s.lineWidth;

            // Draw horizontal lines (rows)
            for (let z = 0; z < gridH; z++) {
                ctx.beginPath();
                let started = false;

                for (let x = 0; x < gridW; x++) {
                    const p = points[z][x];
                    if (p) {
                        const heightRatio = Math.min(Math.max(p.worldY / s.mountainHeight, 0), 1);
                        const alpha = Math.min(1, p.scale * 0.5) * (0.5 + s.glowIntensity * 0.5);

                        ctx.strokeStyle = this.getHeightColor(heightRatio);
                        ctx.globalAlpha = alpha;

                        if (!started) {
                            ctx.moveTo(p.x, p.y);
                            started = true;
                        } else {
                            ctx.lineTo(p.x, p.y);
                        }
                    }
                }
                ctx.stroke();
            }

            // Draw vertical lines (columns)
            for (let x = 0; x < gridW; x++) {
                ctx.beginPath();
                let started = false;

                for (let z = 0; z < gridH; z++) {
                    const p = points[z][x];
                    if (p) {
                        const heightRatio = Math.min(Math.max(p.worldY / s.mountainHeight, 0), 1);
                        const alpha = Math.min(1, p.scale * 0.5) * (0.5 + s.glowIntensity * 0.5);

                        ctx.strokeStyle = this.getHeightColor(heightRatio);
                        ctx.globalAlpha = alpha;

                        if (!started) {
                            ctx.moveTo(p.x, p.y);
                            started = true;
                        } else {
                            ctx.lineTo(p.x, p.y);
                        }
                    }
                }
                ctx.stroke();
            }
        } else {
            // Filled polygon mode
            for (let z = 0; z < gridH - 1; z++) {
                for (let x = 0; x < gridW - 1; x++) {
                    const p1 = points[z][x];
                    const p2 = points[z][x + 1];
                    const p3 = points[z + 1][x + 1];
                    const p4 = points[z + 1][x];

                    if (p1 && p2 && p3 && p4) {
                        const avgHeight = (p1.worldY + p2.worldY + p3.worldY + p4.worldY) / 4;
                        const heightRatio = Math.min(Math.max(avgHeight / s.mountainHeight, 0), 1);
                        const alpha = Math.min(1, p1.scale * 0.3) * 0.8;

                        ctx.globalAlpha = alpha;
                        ctx.fillStyle = this.getHeightColor(heightRatio);

                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.lineTo(p3.x, p3.y);
                        ctx.lineTo(p4.x, p4.y);
                        ctx.closePath();
                        ctx.fill();

                        // Draw edges with brighter color
                        ctx.globalAlpha = alpha * 0.7;
                        ctx.strokeStyle = this.getHeightColor(Math.min(heightRatio + 0.2, 1));
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }
        }

        ctx.globalAlpha = 1;

        // Add scan line effect for extra retro feel
        ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
        for (let y = 0; y < height; y += 3) {
            ctx.fillRect(0, y, width, 1);
        }
    }

    clean(): void {
        if (!this.canvas) return;

        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }

        this.canvas.remove();
        this.canvas = null;
        this.ctx = null;
    }
}
