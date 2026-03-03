import type { IScene } from '@/src/scene/scene';
import { createFullscreenCanvas } from '@/src/utils/canvas';
import { hexToRgb } from '@/src/utils/color';
import { NormalAudioDataDto, streamType } from '@/src/utils/eventMessage';
import { NeuralWebSetting } from './setting';

interface Node {
    x: number;
    y: number;
    vx: number;
    vy: number;
    audioIndex: number;
}

export class NeuralWeb implements IScene {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private audioData: NormalAudioDataDto;
    private settings: NeuralWebSetting = new NeuralWebSetting();
    private nodes: Node[] = [];

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

        this.initNodes();
    }

    private initNodes(): void {
        if (!this.canvas) return;
        this.nodes = [];

        for (let i = 0; i < this.settings.nodeCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.2 + Math.random() * 0.8;
            this.nodes.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                audioIndex: Math.floor(Math.random() * 256),
            });
        }
    }

    updateSettings(settings: NeuralWebSetting): void {
        const needsReinit = settings.nodeCount !== this.settings.nodeCount;
        this.settings = settings;
        if (needsReinit) {
            this.initNodes();
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
        }

        const { width, height } = this.canvas;
        const audioArray = this.audioData.timeByteArray;

        // Calculate average audio level
        let avgAudio = 0;
        if (audioArray.length > 0) {
            for (let i = 0; i < audioArray.length; i++) {
                avgAudio += audioArray[i] || 0;
            }
            avgAudio = (avgAudio / audioArray.length / 255) * this.settings.audioSensitivity;
        }

        // Clear background
        this.ctx.fillStyle = this.settings.backgroundColor;
        this.ctx.fillRect(0, 0, width, height);

        const nodeColor = hexToRgb(this.settings.nodeColor);
        const lineColor = hexToRgb(this.settings.lineColor);

        // Update and draw nodes
        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];
            const nodeAudio = ((audioArray[node.audioIndex] || 0) / 255) * this.settings.audioSensitivity;

            // Update velocity based on audio
            const audioForce = nodeAudio * this.settings.audioInfluence;
            node.vx += (Math.random() - 0.5) * audioForce * 0.5;
            node.vy += (Math.random() - 0.5) * audioForce * 0.5;

            // Apply drift speed
            node.x += node.vx * this.settings.driftSpeed;
            node.y += node.vy * this.settings.driftSpeed;

            // Dampen velocity
            node.vx *= 0.99;
            node.vy *= 0.99;

            // Handle edges
            if (this.settings.bounceOnEdges) {
                if (node.x < 0 || node.x > width) node.vx *= -1;
                if (node.y < 0 || node.y > height) node.vy *= -1;
                node.x = Math.max(0, Math.min(width, node.x));
                node.y = Math.max(0, Math.min(height, node.y));
            } else {
                if (node.x < 0) node.x = width;
                if (node.x > width) node.x = 0;
                if (node.y < 0) node.y = height;
                if (node.y > height) node.y = 0;
            }
        }

        // Draw connections
        const connectionDist = this.settings.connectionDistance * (1 + avgAudio * 0.5);
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const nodeA = this.nodes[i];
                const nodeB = this.nodes[j];
                const dx = nodeA.x - nodeB.x;
                const dy = nodeA.y - nodeB.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < connectionDist) {
                    const opacity = (1 - distance / connectionDist) * this.settings.lineOpacity;
                    const audioBoost = this.settings.pulseOnBeat ? 1 + avgAudio * 0.5 : 1;

                    this.ctx.strokeStyle = `rgba(${lineColor.r}, ${lineColor.g}, ${lineColor.b}, ${opacity * audioBoost})`;
                    this.ctx.lineWidth = this.settings.lineWidth;
                    this.ctx.beginPath();
                    this.ctx.moveTo(nodeA.x, nodeA.y);
                    this.ctx.lineTo(nodeB.x, nodeB.y);
                    this.ctx.stroke();
                }
            }
        }

        // Draw nodes
        for (const node of this.nodes) {
            const nodeAudio = ((audioArray[node.audioIndex] || 0) / 255) * this.settings.audioSensitivity;
            const size = this.settings.nodeSize + nodeAudio * this.settings.nodeSizeAudioScale;

            // Draw glow
            if (this.settings.glowIntensity > 0) {
                const gradient = this.ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, size * 4);
                gradient.addColorStop(
                    0,
                    `rgba(${nodeColor.r}, ${nodeColor.g}, ${nodeColor.b}, ${0.3 * this.settings.glowIntensity})`,
                );
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, size * 4, 0, Math.PI * 2);
                this.ctx.fill();
            }

            // Draw node
            const brightness = 0.7 + nodeAudio * 0.3;
            this.ctx.fillStyle = `rgba(${Math.floor(nodeColor.r * brightness)}, ${Math.floor(nodeColor.g * brightness)}, ${Math.floor(nodeColor.b * brightness)}, 1)`;
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    clean(): void {
        if (this.canvas) {
            this.canvas.remove();
            this.canvas = null;
        }
        this.ctx = null;
        this.nodes = [];
    }
}
