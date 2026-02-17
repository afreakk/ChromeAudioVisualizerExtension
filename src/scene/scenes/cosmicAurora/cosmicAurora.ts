import { IScene } from '@/src/scene/scene';
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

export class CosmicAurora implements IScene {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private audioData: NormalAudioDataDto;
    private settings: CosmicAuroraSetting = new CosmicAuroraSetting();

    private stars: Star[] = [];
    private shootingStars: ShootingStar[] = [];
    private auroraRibbons: AuroraRibbon[] = [];
    private nebulaClouds: NebulaCloud[] = [];
    private starSprite: HTMLCanvasElement | null = null;
    private static readonly STAR_SPRITE_SIZE = 64;

    private time: number = 0;
    private lastBass: number = 0;
    private smoothedBass: number = 0;
    private smoothedMid: number = 0;
    private smoothedHigh: number = 0;
    private colorPhase: number = 0;
    private lastPeakTime: number = 0;

    constructor() {
        this.audioData = new NormalAudioDataDto([]);
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

        this.initStarSprite();
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
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
        gradient.addColorStop(0.3, 'rgba(200, 220, 255, 0.6)');
        gradient.addColorStop(1, 'rgba(100, 150, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        this.starSprite = canvas;
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
                thickness: 80 + Math.random() * 60,
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

    private getFrequencyBands(): { bass: number; mid: number; high: number; average: number } {
        const audioArray = this.audioData.timeByteArray;
        if (!audioArray || audioArray.length === 0) {
            return { bass: 0, mid: 0, high: 0, average: 0 };
        }

        let bassSum = 0, midSum = 0, highSum = 0, total = 0;
        const bassEnd = Math.floor(audioArray.length * 0.15);
        const midEnd = Math.floor(audioArray.length * 0.5);

        for (let i = 0; i < audioArray.length; i++) {
            const value = audioArray[i] / 255;
            total += value;
            if (i < bassEnd) bassSum += value;
            else if (i < midEnd) midSum += value;
            else highSum += value;
        }

        return {
            bass: (bassSum / bassEnd) * this.settings.bassReactivity,
            mid: midSum / (midEnd - bassEnd),
            high: highSum / (audioArray.length - midEnd),
            average: total / audioArray.length,
        };
    }

    private hexToRgb(hex: string): { r: number; g: number; b: number } {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? {
                  r: parseInt(result[1], 16),
                  g: parseInt(result[2], 16),
                  b: parseInt(result[3], 16),
              }
            : { r: 0, g: 255, b: 136 };
    }

    private renderStars(ctx: CanvasRenderingContext2D, width: number, height: number, audio: ReturnType<typeof this.getFrequencyBands>): void {
        if (!this.starSprite) return;

        const audioBoost = 1 + audio.high * this.settings.audioSensitivity;
        const savedAlpha = ctx.globalAlpha;

        for (const star of this.stars) {
            star.twinklePhase += this.settings.starTwinkleSpeed * 0.02 * star.twinkleSpeed;

            const twinkle = (Math.sin(star.twinklePhase) + 1) / 2;
            const layerBrightness = [0.4, 0.7, 1.0][star.layer];
            const brightness = (star.brightness * 0.5 + twinkle * 0.5) * layerBrightness * audioBoost;

            const d = star.size * (1 + audio.average * 0.5) * 6;

            ctx.globalAlpha = brightness;
            ctx.drawImage(this.starSprite, star.x - d / 2, star.y - d / 2, d, d);
        }

        ctx.globalAlpha = savedAlpha;
    }

    private renderShootingStars(ctx: CanvasRenderingContext2D, width: number, height: number, audio: ReturnType<typeof this.getFrequencyBands>): void {
        if (this.settings.showShootingStars && audio.bass > 0.6 && this.time - this.lastPeakTime > 30) {
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

        this.shootingStars = this.shootingStars.filter(star => {
            star.x += star.vx;
            star.y += star.vy;
            star.life++;

            const progress = star.life / star.maxLife;
            const alpha = progress < 0.2 ? progress * 5 : 1 - (progress - 0.2) / 0.8;

            if (alpha <= 0) return false;

            const tailX = star.x - star.vx * (star.length / Math.sqrt(star.vx * star.vx + star.vy * star.vy));
            const tailY = star.y - star.vy * (star.length / Math.sqrt(star.vx * star.vx + star.vy * star.vy));

            const gradient = ctx.createLinearGradient(tailX, tailY, star.x, star.y);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
            gradient.addColorStop(0.7, `hsla(${star.hue}, 80%, 70%, ${alpha * 0.5})`);
            gradient.addColorStop(1, `hsla(${star.hue}, 100%, 90%, ${alpha})`);

            ctx.beginPath();
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(star.x, star.y);
            ctx.stroke();

            ctx.beginPath();
            ctx.fillStyle = `hsla(${star.hue}, 100%, 95%, ${alpha})`;
            ctx.arc(star.x, star.y, 3, 0, Math.PI * 2);
            ctx.fill();

            return star.x < width + 100 && star.y < height + 100 && star.life < star.maxLife;
        });
    }

    private renderNebulaClouds(ctx: CanvasRenderingContext2D, width: number, height: number, audio: ReturnType<typeof this.getFrequencyBands>): void {
        const intensity = this.settings.nebulaIntensity * (1 + audio.average * this.settings.audioSensitivity);

        for (const cloud of this.nebulaClouds) {
            cloud.x += cloud.vx * this.settings.nebulaSpeed;
            cloud.y += cloud.vy * this.settings.nebulaSpeed;
            cloud.phase += 0.01;

            if (cloud.x < -cloud.radius) cloud.x = width + cloud.radius;
            if (cloud.x > width + cloud.radius) cloud.x = -cloud.radius;
            if (cloud.y < -cloud.radius) cloud.y = height + cloud.radius;
            if (cloud.y > height + cloud.radius) cloud.y = -cloud.radius;

            const pulseRadius = cloud.radius * (1 + Math.sin(cloud.phase) * 0.2 + audio.bass * 0.3);
            const hueShift = (this.colorPhase * 30) % 360;

            const gradient = ctx.createRadialGradient(
                cloud.x,
                cloud.y,
                0,
                cloud.x,
                cloud.y,
                pulseRadius
            );

            const alpha = cloud.alpha * intensity;
            gradient.addColorStop(0, `hsla(${(cloud.hue + hueShift) % 360}, 70%, 50%, ${alpha * 0.8})`);
            gradient.addColorStop(0.4, `hsla(${(cloud.hue + hueShift + 30) % 360}, 60%, 40%, ${alpha * 0.4})`);
            gradient.addColorStop(0.7, `hsla(${(cloud.hue + hueShift + 60) % 360}, 50%, 30%, ${alpha * 0.2})`);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.beginPath();
            ctx.fillStyle = gradient;
            ctx.arc(cloud.x, cloud.y, pulseRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    private renderAurora(ctx: CanvasRenderingContext2D, width: number, height: number, audio: ReturnType<typeof this.getFrequencyBands>): void {
        const audioArray = this.audioData.timeByteArray;
        const intensity = this.settings.auroraIntensity * (1 + audio.average * this.settings.audioSensitivity);

        const colors = [
            this.hexToRgb(this.settings.auroraColor1),
            this.hexToRgb(this.settings.auroraColor2),
            this.hexToRgb(this.settings.auroraColor3),
        ];

        for (let ribbonIndex = 0; ribbonIndex < this.auroraRibbons.length; ribbonIndex++) {
            const ribbon = this.auroraRibbons[ribbonIndex];

            for (let i = 0; i < ribbon.points.length; i++) {
                const point = ribbon.points[i];
                const audioIndex = Math.floor((i / ribbon.points.length) * (audioArray?.length || 1));
                const audioValue = (audioArray?.[audioIndex] || 0) / 255;

                const waveOffset =
                    Math.sin(point.phase + this.time * 0.02 * ribbon.speed * this.settings.auroraSpeed) *
                    ribbon.amplitude *
                    (1 + audioValue * this.settings.audioSensitivity);

                const bassWave =
                    Math.sin(point.phase * 0.5 + this.time * 0.01) *
                    this.smoothedBass *
                    50;

                point.y = ribbon.yOffset + waveOffset + bassWave;
                point.phase += 0.001 * this.settings.auroraSpeed;
            }

            const colorIndex = ribbonIndex % colors.length;
            const nextColorIndex = (ribbonIndex + 1) % colors.length;
            const color1 = colors[colorIndex];
            const color2 = colors[nextColorIndex];

            ctx.save();
            ctx.globalCompositeOperation = 'lighter';

            const auroraGradient = ctx.createLinearGradient(0, 0, 0, height);
            auroraGradient.addColorStop(0, `rgba(${color1.r}, ${color1.g}, ${color1.b}, ${0.02 * intensity})`);
            auroraGradient.addColorStop(0.3, `rgba(${color1.r}, ${color1.g}, ${color1.b}, ${0.15 * intensity})`);
            auroraGradient.addColorStop(0.6, `rgba(${color2.r}, ${color2.g}, ${color2.b}, ${0.08 * intensity})`);
            auroraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

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

            for (let layer = 0; layer < 3; layer++) {
                const layerOffset = layer * 15;
                const layerAlpha = (0.3 - layer * 0.08) * intensity;

                ctx.beginPath();
                ctx.moveTo(ribbon.points[0].x, ribbon.points[0].y + layerOffset);

                for (let i = 1; i < ribbon.points.length - 2; i++) {
                    const xc = (ribbon.points[i].x + ribbon.points[i + 1].x) / 2;
                    const yc = (ribbon.points[i].y + ribbon.points[i + 1].y) / 2 + layerOffset;
                    ctx.quadraticCurveTo(
                        ribbon.points[i].x,
                        ribbon.points[i].y + layerOffset,
                        xc,
                        yc
                    );
                }

                const layerColor = colors[(colorIndex + layer) % colors.length];
                const bright = Math.min(255, layerColor.r + 50 - layer * 25);
                const brightG = Math.min(255, layerColor.g + 50 - layer * 25);
                const brightB = Math.min(255, layerColor.b + 50 - layer * 25);
                ctx.strokeStyle = `rgba(${bright}, ${brightG}, ${brightB}, ${layerAlpha})`;
                ctx.lineWidth = ribbon.thickness / (layer + 1);
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                ctx.shadowColor = `rgba(${color1.r}, ${color1.g}, ${color1.b}, ${layerAlpha * 0.5})`;
                ctx.shadowBlur = 30 * this.settings.glowIntensity;
                ctx.stroke();
            }

            ctx.shadowBlur = 0;
            ctx.restore();
        }
    }

    private renderCentralGlow(ctx: CanvasRenderingContext2D, width: number, height: number, audio: ReturnType<typeof this.getFrequencyBands>): void {
        const glowRadius = Math.min(width, height) * 0.4 * (1 + audio.bass * 0.5);
        const centerX = width / 2;
        const centerY = height * 0.7;

        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);

        const hueShift = this.colorPhase * 60;
        gradient.addColorStop(0, `hsla(${(180 + hueShift) % 360}, 80%, 30%, ${0.1 * this.settings.glowIntensity * audio.average})`);
        gradient.addColorStop(0.5, `hsla(${(220 + hueShift) % 360}, 70%, 20%, ${0.05 * this.settings.glowIntensity})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
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
        this.colorPhase += this.settings.colorCycleSpeed * 0.01;

        const audio = this.getFrequencyBands();
        this.smoothedBass += (audio.bass - this.smoothedBass) * 0.1;
        this.smoothedMid += (audio.mid - this.smoothedMid) * 0.1;
        this.smoothedHigh += (audio.high - this.smoothedHigh) * 0.1;

        if (audio.bass > this.lastBass + 0.3) {
            this.lastPeakTime = this.time;
        }
        this.lastBass = audio.bass;

        ctx.fillStyle = `rgba(0, 0, 8, ${1 - this.settings.trailLength})`;
        ctx.fillRect(0, 0, width, height);

        this.renderCentralGlow(ctx, width, height, audio);
        this.renderNebulaClouds(ctx, width, height, audio);
        this.renderStars(ctx, width, height, audio);
        this.renderAurora(ctx, width, height, audio);
        this.renderShootingStars(ctx, width, height, audio);
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
        this.starSprite = null;
    }
}
