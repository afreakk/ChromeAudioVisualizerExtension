import type { IScene } from '@/src/scene/scene';
import { getFrequencyBands } from '@/src/utils/audio';
import { createFullscreenCanvas } from '@/src/utils/canvas';
import { hexToRgb } from '@/src/utils/color';
import { NormalAudioDataDto, streamType } from '@/src/utils/eventMessage';
import { CosmicAuroraSetting } from './setting';

interface Star {
    x: number;
    y: number;
    size: number;
    brightness: number;
    twinklePhase: number;
    twinkleSpeed: number;
    layer: number;
}

interface ShootingStar {
    x: number;
    y: number;
    vx: number;
    vy: number;
    length: number;
    life: number;
    maxLife: number;
    hue: number;
}

interface AuroraRibbon {
    points: { x: number; y: number; phase: number }[];
    hue: number;
    speed: number;
    amplitude: number;
    yOffset: number;
    thickness: number;
}

interface NebulaCloud {
    x: number;
    y: number;
    radius: number;
    hue: number;
    alpha: number;
    vx: number;
    vy: number;
    phase: number;
}

interface PulseRing {
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    hue: number;
    alpha: number;
    lineWidth: number;
}

interface AuroraParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    hue: number;
    size: number;
}

export class CosmicAurora implements IScene {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private audioData: NormalAudioDataDto;
    private settings: CosmicAuroraSetting = new CosmicAuroraSetting();

    private stars: Star[] = [];
    private shootingStars: ShootingStar[] = [];
    private auroraRibbons: AuroraRibbon[] = [];
    private nebulaClouds: NebulaCloud[] = [];
    private pulseRings: PulseRing[] = [];
    private auroraParticles: AuroraParticle[] = [];
    private starSprite: HTMLCanvasElement | null = null;
    private particleSprite: HTMLCanvasElement | null = null;
    private static readonly STAR_SPRITE_SIZE = 64;
    private static readonly PARTICLE_SPRITE_SIZE = 32;
    private static readonly MAX_AURORA_PARTICLES = 100;
    private static readonly MAX_PULSE_RINGS = 20;
    private static readonly MAX_SHOOTING_STARS = 10;

    private cachedColors: { r: number; g: number; b: number }[] = [];

    private time: number = 0;
    private lastBass: number = 0;
    private smoothedBass: number = 0;
    private smoothedMid: number = 0;
    private smoothedHigh: number = 0;
    private colorPhase: number = 0;
    private lastPeakTime: number = 0;
    private beatFlash: number = 0;

    constructor() {
        this.audioData = new NormalAudioDataDto([]);
    }

    streamType = streamType.normal;

    build(): void {
        this.canvas = createFullscreenCanvas();
        this.ctx = this.canvas.getContext('2d');

        this.initStarSprite();
        this.initParticleSprite();
        this.cacheColors();
        this.initStars();
        this.initAuroraRibbons();
        this.initNebulaClouds();
    }

    private initStarSprite(): void {
        const size = CosmicAurora.STAR_SPRITE_SIZE;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const half = size / 2;
        const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.2, 'rgba(200, 220, 255, 0.3)');
        gradient.addColorStop(0.6, 'rgba(100, 150, 255, 0.05)');
        gradient.addColorStop(1, 'rgba(100, 150, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        this.starSprite = canvas;
    }

    private initParticleSprite(): void {
        const size = CosmicAurora.PARTICLE_SPRITE_SIZE;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const half = size / 2;
        const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        this.particleSprite = canvas;
    }

    private cacheColors(): void {
        this.cachedColors = [
            hexToRgb(this.settings.auroraColor1),
            hexToRgb(this.settings.auroraColor2),
            hexToRgb(this.settings.auroraColor3),
        ];
    }

    private initStars(): void {
        this.stars = [];
        const width = this.canvas?.width || window.innerWidth;
        const height = this.canvas?.height || window.innerHeight;

        for (let i = 0; i < this.settings.starCount; i++) {
            this.stars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * 2 + 0.5,
                brightness: Math.random(),
                twinklePhase: Math.random() * Math.PI * 2,
                twinkleSpeed: Math.random() * 2 + 0.5,
                layer: Math.floor(Math.random() * 3),
            });
        }
    }

    private initAuroraRibbons(): void {
        this.auroraRibbons = [];
        const width = this.canvas?.width || window.innerWidth;
        const height = this.canvas?.height || window.innerHeight;

        for (let i = 0; i < this.settings.auroraWaveCount; i++) {
            const points: { x: number; y: number; phase: number }[] = [];
            const segmentCount = 60;

            for (let j = 0; j <= segmentCount; j++) {
                points.push({
                    x: (j / segmentCount) * width,
                    y: height * 0.3,
                    phase: (j / segmentCount) * Math.PI * 4 + i * 0.5,
                });
            }

            this.auroraRibbons.push({
                points,
                hue: (i / this.settings.auroraWaveCount) * 120 + 120,
                speed: 0.5 + Math.random() * 0.5,
                amplitude: 50 + Math.random() * 100,
                yOffset: height * (0.15 + i * 0.08),
                thickness: 40 + Math.random() * 40,
            });
        }
    }

    private initNebulaClouds(): void {
        this.nebulaClouds = [];
        const width = this.canvas?.width || window.innerWidth;
        const height = this.canvas?.height || window.innerHeight;

        for (let i = 0; i < 8; i++) {
            this.nebulaClouds.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: 100 + Math.random() * 200,
                hue: Math.random() * 60 + 240,
                alpha: 0.1 + Math.random() * 0.15,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.2,
                phase: Math.random() * Math.PI * 2,
            });
        }
    }

    updateSettings(settings: CosmicAuroraSetting): void {
        const oldStarCount = this.settings.starCount;
        const oldWaveCount = this.settings.auroraWaveCount;
        this.settings = settings;
        this.cacheColors();

        if (oldStarCount !== settings.starCount) {
            this.initStars();
        }
        if (oldWaveCount !== settings.auroraWaveCount) {
            this.initAuroraRibbons();
        }
    }

    updateAudioData(data: NormalAudioDataDto): void {
        this.audioData = data;
    }

    private getAudioBands(): { bass: number; mid: number; high: number; average: number } {
        const audioArray = this.audioData.timeByteArray;
        if (!audioArray || audioArray.length === 0) {
            return { bass: 0, mid: 0, high: 0, average: 0 };
        }
        const bands = getFrequencyBands(audioArray);
        let total = 0;
        for (let i = 0; i < audioArray.length; i++) {
            total += audioArray[i] / 255;
        }
        return {
            bass: bands.bass * this.settings.bassReactivity,
            mid: bands.mid,
            high: bands.high,
            average: total / audioArray.length,
        };
    }

    private renderStars(
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        audio: ReturnType<typeof this.getAudioBands>,
    ): void {
        if (!this.starSprite) return;

        const audioBoost = 1 + this.smoothedBass * this.settings.audioSensitivity * 1.5;
        const savedAlpha = ctx.globalAlpha;
        const layerSpeeds = [0.15, 0.4, 0.8];

        for (const star of this.stars) {
            star.twinklePhase += this.settings.starTwinkleSpeed * 0.02 * star.twinkleSpeed;

            // Parallax drift — deeper layers move slower
            star.x -= layerSpeeds[star.layer] * (1 + this.smoothedMid * 0.5);
            if (star.x < -10) star.x = width + 10;

            const twinkle = (Math.sin(star.twinklePhase) + 1) / 2;
            const layerBrightness = [0.4, 0.7, 1.0][star.layer];
            const brightness = (star.brightness * 0.5 + twinkle * 0.5) * layerBrightness * audioBoost;

            const d = star.size * (1 + this.smoothedBass * 1.5) * 3;

            ctx.globalAlpha = brightness;
            ctx.drawImage(this.starSprite, star.x - d / 2, star.y - d / 2, d, d);
        }

        ctx.globalAlpha = savedAlpha;
    }

    private renderShootingStars(
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        audio: ReturnType<typeof this.getAudioBands>,
    ): void {
        if (
            this.settings.showShootingStars &&
            audio.bass > 0.4 &&
            this.time - this.lastPeakTime > 20 &&
            this.shootingStars.length < CosmicAurora.MAX_SHOOTING_STARS
        ) {
            this.lastPeakTime = this.time;
            const startX = Math.random() * width;
            const startY = Math.random() * height * 0.3;
            const angle = Math.PI * 0.2 + Math.random() * Math.PI * 0.3;
            const speed = 8 + Math.random() * 12;

            this.shootingStars.push({
                x: startX,
                y: startY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                length: 50 + Math.random() * 100,
                life: 1,
                maxLife: 60 + Math.random() * 40,
                hue: 180 + Math.random() * 60,
            });
        }

        this.shootingStars = this.shootingStars.filter((star) => {
            star.x += star.vx;
            star.y += star.vy;
            star.life++;

            const progress = star.life / star.maxLife;
            const alpha = progress < 0.2 ? progress * 5 : 1 - (progress - 0.2) / 0.8;

            if (alpha <= 0) return false;

            const speed = Math.sqrt(star.vx * star.vx + star.vy * star.vy);
            const tailX = star.x - star.vx * (star.length / speed);
            const tailY = star.y - star.vy * (star.length / speed);

            // Two solid line segments instead of gradient
            const midX = (tailX + star.x) / 2;
            const midY = (tailY + star.y) / 2;

            ctx.beginPath();
            ctx.strokeStyle = `hsla(${star.hue}, 80%, 70%, ${alpha * 0.3})`;
            ctx.lineWidth = 2;
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(midX, midY);
            ctx.stroke();

            ctx.beginPath();
            ctx.strokeStyle = `hsla(${star.hue}, 100%, 90%, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.moveTo(midX, midY);
            ctx.lineTo(star.x, star.y);
            ctx.stroke();

            ctx.beginPath();
            ctx.fillStyle = `hsla(${star.hue}, 100%, 95%, ${alpha})`;
            ctx.arc(star.x, star.y, 3, 0, Math.PI * 2);
            ctx.fill();

            return star.x < width + 100 && star.y < height + 100 && star.life < star.maxLife;
        });
    }

    private renderNebulaClouds(ctx: CanvasRenderingContext2D, width: number, height: number): void {
        const intensity = this.settings.nebulaIntensity * (1 + this.smoothedBass * this.settings.audioSensitivity * 2);

        for (const cloud of this.nebulaClouds) {
            cloud.x += cloud.vx * this.settings.nebulaSpeed * (1 + this.smoothedBass);
            cloud.y += cloud.vy * this.settings.nebulaSpeed * (1 + this.smoothedBass);
            cloud.phase += 0.01;

            if (cloud.x < -cloud.radius) cloud.x = width + cloud.radius;
            if (cloud.x > width + cloud.radius) cloud.x = -cloud.radius;
            if (cloud.y < -cloud.radius) cloud.y = height + cloud.radius;
            if (cloud.y > height + cloud.radius) cloud.y = -cloud.radius;

            const pulseRadius = cloud.radius * (1 + Math.sin(cloud.phase) * 0.2 + this.smoothedBass * 0.8);
            const hueShift = (this.colorPhase * 30) % 360;

            const gradient = ctx.createRadialGradient(cloud.x, cloud.y, 0, cloud.x, cloud.y, pulseRadius);

            const alpha = cloud.alpha * intensity;
            gradient.addColorStop(0, `hsla(${(cloud.hue + hueShift) % 360}, 70%, 50%, ${alpha * 0.8})`);
            gradient.addColorStop(0.5, `hsla(${(cloud.hue + hueShift + 30) % 360}, 60%, 35%, ${alpha * 0.3})`);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.beginPath();
            ctx.fillStyle = gradient;
            ctx.arc(cloud.x, cloud.y, pulseRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    private spawnAuroraParticles(ribbon: AuroraRibbon): void {
        // Pick a random point on the ribbon to spawn from
        const idx = Math.floor(Math.random() * ribbon.points.length);
        const point = ribbon.points[idx];
        const count = 2 + Math.floor(Math.random() * 3);

        for (let i = 0; i < count; i++) {
            if (this.auroraParticles.length >= CosmicAurora.MAX_AURORA_PARTICLES) {
                this.auroraParticles.shift();
            }
            this.auroraParticles.push({
                x: point.x,
                y: point.y,
                vx: (Math.random() - 0.5) * 3,
                vy: -1 - Math.random() * 3,
                life: 0,
                maxLife: 30 + Math.random() * 40,
                hue: ribbon.hue + Math.random() * 40 - 20,
                size: 2 + Math.random() * 4,
            });
        }
    }

    private renderAuroraParticles(ctx: CanvasRenderingContext2D): void {
        const sprite = this.particleSprite;
        if (!sprite) return;

        const savedAlpha = ctx.globalAlpha;

        this.auroraParticles = this.auroraParticles.filter((p) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy -= 0.02; // float upward
            p.life++;

            const progress = p.life / p.maxLife;
            if (progress >= 1) return false;

            const alpha = progress < 0.2 ? progress * 5 : (1 - progress) * 1.25;
            const drawSize = p.size * (1 - progress * 0.5) * 2;

            ctx.globalAlpha = alpha * 0.8;
            ctx.drawImage(sprite, p.x - drawSize / 2, p.y - drawSize / 2, drawSize, drawSize);

            return true;
        });

        ctx.globalAlpha = savedAlpha;
    }

    private renderPulseRings(ctx: CanvasRenderingContext2D): void {
        this.pulseRings = this.pulseRings.filter((ring) => {
            ring.radius += 6;
            const progress = ring.radius / ring.maxRadius;
            if (progress >= 1) return false;

            ring.alpha = (1 - progress) * 0.4;

            ctx.beginPath();
            ctx.strokeStyle = `hsla(${ring.hue}, 80%, 60%, ${ring.alpha})`;
            ctx.lineWidth = ring.lineWidth * (1 - progress * 0.7);
            ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
            ctx.stroke();

            return true;
        });
    }

    private renderAurora(ctx: CanvasRenderingContext2D, width: number, height: number): void {
        const audioArray = this.audioData.timeByteArray;
        const intensity = this.settings.auroraIntensity * (1 + this.smoothedBass * this.settings.audioSensitivity * 2);

        const colors = this.cachedColors;

        for (let ribbonIndex = 0; ribbonIndex < this.auroraRibbons.length; ribbonIndex++) {
            const ribbon = this.auroraRibbons[ribbonIndex];

            for (let i = 0; i < ribbon.points.length; i++) {
                const point = ribbon.points[i];
                const audioIndex = Math.floor((i / ribbon.points.length) * (audioArray?.length || 1));
                const audioValue = (audioArray?.[audioIndex] || 0) / 255;

                const waveOffset =
                    Math.sin(point.phase + this.time * 0.06 * ribbon.speed * this.settings.auroraSpeed) *
                    ribbon.amplitude *
                    (1 + audioValue * this.settings.audioSensitivity * 2);

                // Direct audio displacement — each point is pushed by its corresponding audio bin
                const directDisplacement = audioValue * 80 * this.settings.audioSensitivity;

                const bassWave = Math.sin(point.phase * 0.5 + this.time * 0.03) * this.smoothedBass * 120;

                point.y = ribbon.yOffset + waveOffset + bassWave - directDisplacement;
                point.phase += 0.004 * this.settings.auroraSpeed;
            }

            // Spawn particles from aurora on beats
            if (this.beatFlash > 0.3 && Math.random() < 0.4) {
                this.spawnAuroraParticles(ribbon);
            }

            const colorIndex = ribbonIndex % colors.length;
            const nextColorIndex = (ribbonIndex + 1) % colors.length;
            const color1 = colors[colorIndex];
            const color2 = colors[nextColorIndex];

            const auroraGradient = ctx.createLinearGradient(0, 0, 0, height);
            auroraGradient.addColorStop(0, `rgba(${color1.r}, ${color1.g}, ${color1.b}, ${0.01 * intensity})`);
            auroraGradient.addColorStop(0.3, `rgba(${color1.r}, ${color1.g}, ${color1.b}, ${0.06 * intensity})`);
            auroraGradient.addColorStop(0.6, `rgba(${color2.r}, ${color2.g}, ${color2.b}, ${0.03 * intensity})`);
            auroraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            // Direct ctx path instead of Path2D allocation
            ctx.beginPath();
            ctx.moveTo(ribbon.points[0].x, ribbon.points[0].y);

            for (let i = 1; i < ribbon.points.length - 2; i++) {
                const xc = (ribbon.points[i].x + ribbon.points[i + 1].x) / 2;
                const yc = (ribbon.points[i].y + ribbon.points[i + 1].y) / 2;
                ctx.quadraticCurveTo(ribbon.points[i].x, ribbon.points[i].y, xc, yc);
            }

            ctx.lineTo(width, ribbon.points[ribbon.points.length - 1].y);
            ctx.lineTo(width, height);
            ctx.lineTo(0, height);
            ctx.closePath();

            ctx.fillStyle = auroraGradient;
            ctx.fill();

            // Dual-stroke glow instead of shadowBlur
            for (let layer = 0; layer < 3; layer++) {
                const layerOffset = layer * 15;
                const layerAlpha = (0.15 - layer * 0.04) * intensity;

                ctx.beginPath();
                ctx.moveTo(ribbon.points[0].x, ribbon.points[0].y + layerOffset);

                for (let i = 1; i < ribbon.points.length - 2; i++) {
                    const xc = (ribbon.points[i].x + ribbon.points[i + 1].x) / 2;
                    const yc = (ribbon.points[i].y + ribbon.points[i + 1].y) / 2 + layerOffset;
                    ctx.quadraticCurveTo(ribbon.points[i].x, ribbon.points[i].y + layerOffset, xc, yc);
                }

                const layerColor = colors[(colorIndex + layer) % colors.length];
                const bright = Math.min(255, layerColor.r + 50 - layer * 25);
                const brightG = Math.min(255, layerColor.g + 50 - layer * 25);
                const brightB = Math.min(255, layerColor.b + 50 - layer * 25);

                const baseLineWidth = ribbon.thickness / (layer + 2);

                // Glow stroke — wider, dimmer, using color1
                ctx.strokeStyle = `rgba(${color1.r}, ${color1.g}, ${color1.b}, ${layerAlpha * 0.25 * this.settings.glowIntensity})`;
                ctx.lineWidth = baseLineWidth * (2 + this.settings.glowIntensity);
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.stroke();

                // Sharp stroke on top
                ctx.strokeStyle = `rgba(${bright}, ${brightG}, ${brightB}, ${layerAlpha})`;
                ctx.lineWidth = baseLineWidth;
                ctx.stroke();
            }
        }
    }

    private renderCentralGlow(ctx: CanvasRenderingContext2D, width: number, height: number): void {
        const glowRadius = Math.min(width, height) * 0.4 * (1 + this.smoothedBass * 1.0);
        const centerX = width / 2;
        const centerY = height * 0.7;

        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);

        const hueShift = this.colorPhase * 60;
        const bassGlow = 0.05 + this.smoothedBass * 0.25;
        gradient.addColorStop(
            0,
            `hsla(${(180 + hueShift) % 360}, 80%, 30%, ${bassGlow * this.settings.glowIntensity})`,
        );
        gradient.addColorStop(
            0.5,
            `hsla(${(220 + hueShift) % 360}, 70%, 20%, ${bassGlow * 0.4 * this.settings.glowIntensity})`,
        );
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    private renderBeatFlash(ctx: CanvasRenderingContext2D, width: number, height: number): void {
        if (this.beatFlash <= 0) return;

        const hueShift = this.colorPhase * 60;
        ctx.fillStyle = `hsla(${(200 + hueShift) % 360}, 60%, 50%, ${this.beatFlash * 0.08})`;
        ctx.fillRect(0, 0, width, height);
    }

    render(): void {
        if (!this.canvas || !this.ctx) return;

        const width = window.innerWidth;
        const height = window.innerHeight;

        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
            this.initStars();
            this.initAuroraRibbons();
        }

        const ctx = this.ctx;
        this.time++;
        this.colorPhase += this.settings.colorCycleSpeed * 0.01 * (1 + this.smoothedBass * 2);

        const audio = this.getAudioBands();
        this.smoothedBass += (audio.bass - this.smoothedBass) * 0.3;
        this.smoothedMid += (audio.mid - this.smoothedMid) * 0.25;
        this.smoothedHigh += (audio.high - this.smoothedHigh) * 0.25;

        // Detect beat — sharp rise in bass
        const beatDelta = audio.bass - this.lastBass;
        if (beatDelta > 0.15 && this.time - this.lastPeakTime > 10) {
            this.lastPeakTime = this.time;
            this.beatFlash = Math.min(beatDelta * 3, 1.0);

            // Spawn a pulse ring on strong beats
            if (beatDelta > 0.25 && this.pulseRings.length < CosmicAurora.MAX_PULSE_RINGS) {
                const hueShift = (this.colorPhase * 60) % 360;
                this.pulseRings.push({
                    x: width * (0.3 + Math.random() * 0.4),
                    y: height * (0.3 + Math.random() * 0.4),
                    radius: 10,
                    maxRadius: Math.min(width, height) * (0.3 + beatDelta * 0.5),
                    hue: (180 + hueShift + Math.random() * 60) % 360,
                    alpha: 0.5,
                    lineWidth: 3 + beatDelta * 8,
                });
            }
        }
        this.lastBass = audio.bass;

        // Decay beat flash
        this.beatFlash *= 0.85;

        ctx.fillStyle = `rgba(0, 0, 8, ${1 - this.settings.trailLength})`;
        ctx.fillRect(0, 0, width, height);

        // Default composite renders
        this.renderCentralGlow(ctx, width, height);
        this.renderNebulaClouds(ctx, width, height);
        this.renderStars(ctx, width, height, audio);
        this.renderPulseRings(ctx);
        this.renderShootingStars(ctx, width, height, audio);

        // Batch 'lighter' composite for aurora, particles, and beat flash
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        this.renderAurora(ctx, width, height);
        this.renderAuroraParticles(ctx);
        this.renderBeatFlash(ctx, width, height);
        ctx.restore();
    }

    clean(): void {
        if (this.canvas) {
            if (this.ctx) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }
            this.canvas.remove();
            this.canvas = null;
        }
        this.ctx = null;
        this.stars = [];
        this.shootingStars = [];
        this.auroraRibbons = [];
        this.nebulaClouds = [];
        this.pulseRings = [];
        this.auroraParticles = [];
        this.starSprite = null;
        this.particleSprite = null;
    }
}
