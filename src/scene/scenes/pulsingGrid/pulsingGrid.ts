import { IScene } from '@/src/scene/scene';
import { NormalAudioDataDto, streamType } from '@/src/utils/eventMessage';
import { PulsingGridSetting } from './setting';

interface GridNode {
    x: number;
    y: number;
    size: number;
    targetSize: number;
    colorPhase: number;
    audioValue: number;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export class PulsingGrid implements IScene {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private audioData: NormalAudioDataDto;
    private settings: PulsingGridSetting;
    private colorOffset: number = 0;
    private nodes: GridNode[] = [];
    private time: number = 0;

    constructor() {
        this.audioData = new NormalAudioDataDto([]);
        this.settings = new PulsingGridSetting();
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

        this.initNodes();
    }

    private initNodes(): void {
        this.nodes = [];
        const s = this.settings;
        for (let i = 0; i < s.rows; i++) {
            for (let j = 0; j < s.columns; j++) {
                this.nodes.push({
                    x: 0,
                    y: 0,
                    size: s.baseSize,
                    targetSize: s.baseSize,
                    colorPhase: (i * s.columns + j) * s.colorSpread,
                    audioValue: 0
                });
            }
        }
    }

    private getAudioValue(index: number): number {
        const data = this.audioData.timeByteArray;
        if (data.length === 0) return 0;
        const wrappedIndex = Math.abs(index * this.settings.columns) % data.length;
        return data[Math.floor(wrappedIndex)] || 0;
    }

    updateSettings(settings: PulsingGridSetting): void {
        const needsReinit = settings.rows !== this.settings.rows ||
                           settings.columns !== this.settings.columns;
        this.settings = settings;
        if (needsReinit) {
            this.initNodes();
        }
    }

    updateAudioData(data: NormalAudioDataDto): void {
        this.audioData = data;
    }

    private getColor(phase: number, brightness: number): string {
        const s = this.settings;
        const hue = (phase + this.colorOffset) % 1;
        const sat = s.saturation;
        const light = Math.min(0.3 + brightness * 0.5, 0.8);
        const [r, g, b] = hslToRgb(hue, sat, light);
        return `rgb(${r},${g},${b})`;
    }

    private getGlowColor(phase: number, brightness: number, alpha: number): string {
        const s = this.settings;
        const hue = (phase + this.colorOffset) % 1;
        const sat = s.saturation;
        const light = Math.min(0.4 + brightness * 0.4, 0.7);
        const [r, g, b] = hslToRgb(hue, sat, light);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    render(): void {
        if (!this.canvas || !this.ctx) return;

        const ctx = this.ctx;
        const s = this.settings;

        // Update canvas size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // Semi-transparent background for trail effect
        ctx.fillStyle = `rgba(${Math.floor(s.bgRed * 255)},${Math.floor(s.bgGreen * 255)},${Math.floor(s.bgBlue * 255)},${s.bgAlpha})`;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // Calculate grid dimensions
        const gridWidth = (this.canvas.width - s.padding * 2) * s.gridScale;
        const gridHeight = (this.canvas.height - s.padding * 2) * s.gridScale;
        const cellWidth = gridWidth / (s.columns - 1 || 1);
        const cellHeight = gridHeight / (s.rows - 1 || 1);
        const startX = centerX - gridWidth / 2;
        const startY = centerY - gridHeight / 2;

        // Update time and color offset
        this.time += 0.016;
        const avgAudio = this.audioData.timeByteArray.reduce((a, b) => a + b, 0) /
                        (this.audioData.timeByteArray.length || 1);
        this.colorOffset += s.colorSpeed + (avgAudio / 255) * s.colorSpeed * 2;

        // Apply rotation transform
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(s.gridRotation * Math.PI / 180);
        ctx.translate(-centerX, -centerY);

        // Update node positions and sizes
        let nodeIndex = 0;
        for (let i = 0; i < s.rows; i++) {
            for (let j = 0; j < s.columns; j++) {
                const node = this.nodes[nodeIndex];
                const audioVal = this.getAudioValue(nodeIndex);

                // Smooth the audio value
                node.audioValue += (audioVal - node.audioValue) * (1 - s.pulseSmoothing);

                // Calculate position
                node.x = startX + j * cellWidth;
                node.y = startY + i * cellHeight;

                // Calculate target size based on audio
                const normalizedAudio = node.audioValue / 255;
                node.targetSize = s.baseSize + normalizedAudio * s.sizeReactivity * 100;
                node.targetSize = Math.max(s.minSize, Math.min(s.maxSize, node.targetSize));

                // Smooth size transition
                node.size += (node.targetSize - node.size) * 0.2;

                nodeIndex++;
            }
        }

        // Draw connections first (behind circles)
        if (s.showConnections) {
            ctx.lineWidth = 1;
            for (let i = 0; i < this.nodes.length; i++) {
                const nodeA = this.nodes[i];
                const normalizedA = nodeA.audioValue / 255;

                if (normalizedA < s.connectionThreshold) continue;

                for (let j = i + 1; j < this.nodes.length; j++) {
                    const nodeB = this.nodes[j];
                    const normalizedB = nodeB.audioValue / 255;

                    if (normalizedB < s.connectionThreshold) continue;

                    const dist = Math.sqrt(
                        Math.pow(nodeA.x - nodeB.x, 2) +
                        Math.pow(nodeA.y - nodeB.y, 2)
                    );

                    const maxDist = Math.max(cellWidth, cellHeight) * 1.5;
                    if (dist < maxDist) {
                        const alpha = (1 - dist / maxDist) * s.connectionOpacity *
                                     Math.min(normalizedA, normalizedB);
                        const gradient = ctx.createLinearGradient(
                            nodeA.x, nodeA.y, nodeB.x, nodeB.y
                        );
                        gradient.addColorStop(0, this.getGlowColor(nodeA.colorPhase, normalizedA, alpha));
                        gradient.addColorStop(1, this.getGlowColor(nodeB.colorPhase, normalizedB, alpha));

                        ctx.strokeStyle = gradient;
                        ctx.beginPath();
                        ctx.moveTo(nodeA.x, nodeA.y);
                        ctx.lineTo(nodeB.x, nodeB.y);
                        ctx.stroke();
                    }
                }
            }
        }

        // Draw circles with glow
        for (const node of this.nodes) {
            const normalizedAudio = node.audioValue / 255;
            const brightness = normalizedAudio * s.colorReactivity;

            // Draw glow
            if (s.glowIntensity > 0) {
                const glowRadius = node.size + s.glowSize * normalizedAudio;
                const gradient = ctx.createRadialGradient(
                    node.x, node.y, node.size * 0.5,
                    node.x, node.y, glowRadius
                );
                gradient.addColorStop(0, this.getGlowColor(node.colorPhase, brightness, s.glowIntensity));
                gradient.addColorStop(1, this.getGlowColor(node.colorPhase, brightness, 0));

                ctx.beginPath();
                ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
            }

            // Draw main circle with gradient
            const circleGradient = ctx.createRadialGradient(
                node.x - node.size * 0.3, node.y - node.size * 0.3, 0,
                node.x, node.y, node.size
            );
            circleGradient.addColorStop(0, this.getColor(node.colorPhase, brightness + 0.3));
            circleGradient.addColorStop(0.7, this.getColor(node.colorPhase, brightness));
            circleGradient.addColorStop(1, this.getColor(node.colorPhase + 0.1, brightness * 0.5));

            ctx.beginPath();
            ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
            ctx.fillStyle = circleGradient;
            ctx.fill();

            // Subtle outline
            ctx.strokeStyle = this.getGlowColor(node.colorPhase, brightness, 0.3);
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        ctx.restore();
    }

    clean(): void {
        if (!this.canvas) return;

        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }

        this.canvas.remove();
        this.nodes = [];
    }
}
