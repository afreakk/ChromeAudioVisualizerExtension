import { IScene } from '@/src/scene/scene';
import { NormalAudioDataDto, streamType } from '@/src/utils/eventMessage';
import { initShaderProgram } from '@/src/utils/openGl/openGl';
import { ChromaWaveSetting } from './setting';

export class ChromaWave implements IScene {
    private canvas: HTMLCanvasElement | null = null;
    private gl: WebGLRenderingContext | null = null;
    private shaderProgram: WebGLProgram | null = null;
    private vertexBuffer: WebGLBuffer | null = null;

    private resolutionUniformLocation: WebGLUniformLocation | null = null;
    private lowUniformLocation: WebGLUniformLocation | null = null;
    private midUniformLocation: WebGLUniformLocation | null = null;
    private highUniformLocation: WebGLUniformLocation | null = null;
    private intensityUniformLocation: WebGLUniformLocation | null = null;
    private waveFrequencyUniformLocation: WebGLUniformLocation | null = null;
    private colorShiftUniformLocation: WebGLUniformLocation | null = null;
    private patternStyleUniformLocation: WebGLUniformLocation | null = null;
    private distortionUniformLocation: WebGLUniformLocation | null = null;

    private audioData: NormalAudioDataDto;
    private settings: ChromaWaveSetting = new ChromaWaveSetting();

    private low: number = 0;
    private mid: number = 0;
    private high: number = 0;

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

        this.gl = this.canvas.getContext('webgl');
        if (!this.gl) {
            console.error('Unable to initialize WebGL.');
            return;
        }

        const vs = `
            attribute vec4 vertexPosition;
            void main() {
                gl_Position = vertexPosition;
            }
        `;

        const fs = `
            precision mediump float;
            uniform vec2 resolution;
            uniform float low;
            uniform float mid;
            uniform float high;
            uniform float intensity;
            uniform float waveFrequency;
            uniform float colorShift;
            uniform float patternStyle;
            uniform float distortion;

            const float PI = 3.141592653589793;

            vec3 hsv2rgb(vec3 c) {
                vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
                vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
                return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
            }

            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                vec2 p = uv * 2.0 - 1.0;
                p.x *= resolution.x / resolution.y;

                float r, g, b;
                float time1 = low * colorShift;
                float time2 = mid * colorShift;
                float time3 = high * colorShift;

                // Different pattern styles
                if (patternStyle < 0.5) {
                    // Wave pattern
                    r = sin(p.x * waveFrequency + time1) * 0.5 + 0.5;
                    g = sin(p.y * waveFrequency + time2 + PI / 3.0) * 0.5 + 0.5;
                    b = sin((p.x + p.y) * waveFrequency * 0.7 + time3 + PI * 2.0 / 3.0) * 0.5 + 0.5;

                    // Add audio distortion
                    float dist = length(p) * distortion;
                    r += sin(dist * 3.0 + time1 * 2.0) * 0.2;
                    g += sin(dist * 4.0 + time2 * 2.0) * 0.2;
                    b += sin(dist * 5.0 + time3 * 2.0) * 0.2;
                } else if (patternStyle < 1.5) {
                    // Spiral pattern
                    float angle = atan(p.y, p.x);
                    float radius = length(p);

                    r = sin(angle * waveFrequency + radius * 4.0 - time1 * 3.0) * 0.5 + 0.5;
                    g = sin(angle * waveFrequency + radius * 4.0 - time2 * 3.0 + PI / 2.0) * 0.5 + 0.5;
                    b = sin(angle * waveFrequency + radius * 4.0 - time3 * 3.0 + PI) * 0.5 + 0.5;

                    // Audio pulse
                    float pulse = sin(radius * 10.0 - (low + mid + high) * 0.5) * distortion;
                    r += pulse * 0.2;
                    g += pulse * 0.15;
                    b += pulse * 0.1;
                } else {
                    // Plasma pattern
                    float v1 = sin(p.x * waveFrequency + time1);
                    float v2 = sin(waveFrequency * (p.x * sin(time2 * 0.5) + p.y * cos(time2 * 0.3)));
                    float v3 = sin(waveFrequency * (p.x * cos(time3 * 0.3) + p.y * sin(time3 * 0.5)));
                    float v4 = sin(sqrt(p.x * p.x + p.y * p.y) * waveFrequency);

                    float v = v1 + v2 + v3 + v4;
                    v *= 0.25;

                    r = sin(v * PI + time1 * colorShift) * 0.5 + 0.5;
                    g = sin(v * PI + time2 * colorShift + PI / 3.0) * 0.5 + 0.5;
                    b = sin(v * PI + time3 * colorShift + PI * 2.0 / 3.0) * 0.5 + 0.5;

                    // Distortion based on audio
                    float audioMix = (low + mid + high) / 30.0 * distortion;
                    r = mix(r, sin(v * PI * 2.0), audioMix);
                    g = mix(g, cos(v * PI * 2.0), audioMix);
                }

                // Apply intensity
                r *= intensity;
                g *= intensity;
                b *= intensity;

                // Clamp values
                gl_FragColor = vec4(clamp(r, 0.0, 1.0), clamp(g, 0.0, 1.0), clamp(b, 0.0, 1.0), 1.0);
            }
        `;

        const vertices = new Float32Array([
            -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, -1.0,
        ]);

        this.vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

        this.shaderProgram = initShaderProgram(this.gl, vs, fs);
        if (!this.shaderProgram) {
            console.error('Unable to initialize the shader program');
            return;
        }

        this.gl.useProgram(this.shaderProgram);

        const position = this.gl.getAttribLocation(this.shaderProgram, 'vertexPosition');
        this.gl.vertexAttribPointer(position, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(position);

        this.resolutionUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'resolution');
        this.lowUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'low');
        this.midUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'mid');
        this.highUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'high');
        this.intensityUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'intensity');
        this.waveFrequencyUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'waveFrequency');
        this.colorShiftUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'colorShift');
        this.patternStyleUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'patternStyle');
        this.distortionUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'distortion');
    }

    private getFrequencyBands(): { low: number; mid: number; high: number } {
        const audioArray = this.audioData.timeByteArray;
        const len = audioArray.length;
        if (len === 0) return { low: 0, mid: 0, high: 0 };

        const third = Math.floor(len / 3);
        let lowSum = 0, midSum = 0, highSum = 0;

        for (let i = 0; i < third; i++) {
            lowSum += audioArray[i] || 0;
        }
        for (let i = third; i < third * 2; i++) {
            midSum += audioArray[i] || 0;
        }
        for (let i = third * 2; i < len; i++) {
            highSum += audioArray[i] || 0;
        }

        return {
            low: lowSum / third / 100,
            mid: midSum / third / 100,
            high: highSum / (len - third * 2) / 100,
        };
    }

    updateSettings(settings: ChromaWaveSetting): void {
        this.settings = settings;
        if (this.gl && this.shaderProgram) {
            this.gl.useProgram(this.shaderProgram);
            this.gl.uniform1f(this.intensityUniformLocation, settings.intensity);
            this.gl.uniform1f(this.waveFrequencyUniformLocation, settings.waveFrequency);
            this.gl.uniform1f(this.colorShiftUniformLocation, settings.colorShift);
            this.gl.uniform1f(this.patternStyleUniformLocation, settings.patternStyle);
            this.gl.uniform1f(this.distortionUniformLocation, settings.distortionAmount);
        }
    }

    updateAudioData(data: NormalAudioDataDto): void {
        this.audioData = data;
    }

    render(): void {
        if (!this.canvas || !this.gl) return;

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        // Calculate frequency bands
        const bands = this.getFrequencyBands();

        // Update accumulated values
        const lowDelta = (bands.low * this.settings.lowSpeed - this.settings.baseLowSpeed) * 0.1;
        const midDelta = (bands.mid * this.settings.midSpeed - this.settings.baseMidSpeed) * 0.1;
        const highDelta = (bands.high * this.settings.highSpeed - this.settings.baseHighSpeed) * 0.1;

        this.low += Math.max(lowDelta, this.settings.baseLowSpeed * 0.05);
        this.mid += Math.max(midDelta, this.settings.baseMidSpeed * 0.05);
        this.high += Math.max(highDelta, this.settings.baseHighSpeed * 0.05);

        this.gl.uniform2f(this.resolutionUniformLocation, this.canvas.width, this.canvas.height);
        this.gl.uniform1f(this.lowUniformLocation, this.low);
        this.gl.uniform1f(this.midUniformLocation, this.mid);
        this.gl.uniform1f(this.highUniformLocation, this.high);

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    clean(): void {
        if (!this.canvas || !this.gl) return;

        if (this.vertexBuffer) this.gl.deleteBuffer(this.vertexBuffer);

        if (this.shaderProgram) {
            const shaders = this.gl.getAttachedShaders(this.shaderProgram);
            if (shaders) {
                for (const shader of shaders) {
                    this.gl.detachShader(this.shaderProgram, shader);
                    this.gl.deleteShader(shader);
                }
            }
            this.gl.deleteProgram(this.shaderProgram);
        }

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.canvas.remove();
    }
}
