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
    private rawLowUniformLocation: WebGLUniformLocation | null = null;
    private rawMidUniformLocation: WebGLUniformLocation | null = null;
    private rawHighUniformLocation: WebGLUniformLocation | null = null;
    private intensityUniformLocation: WebGLUniformLocation | null = null;
    private waveFrequencyUniformLocation: WebGLUniformLocation | null = null;
    private colorShiftUniformLocation: WebGLUniformLocation | null = null;
    private patternStyleUniformLocation: WebGLUniformLocation | null = null;
    private distortionUniformLocation: WebGLUniformLocation | null = null;
    private audioSensitivityUniformLocation: WebGLUniformLocation | null = null;

    private audioData: NormalAudioDataDto;
    private settings: ChromaWaveSetting = new ChromaWaveSetting();

    private low: number = 0;
    private mid: number = 0;
    private high: number = 0;
    private smoothLow: number = 0;
    private smoothMid: number = 0;
    private smoothHigh: number = 0;

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
            uniform float rawLow;
            uniform float rawMid;
            uniform float rawHigh;
            uniform float intensity;
            uniform float waveFrequency;
            uniform float colorShift;
            uniform float patternStyle;
            uniform float distortion;
            uniform float audioSensitivity;

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

                // Audio-reactive coordinate distortion
                float audioPower = (rawLow + rawMid + rawHigh) * audioSensitivity;
                p += vec2(
                    sin(p.y * 3.0 + low) * rawLow * distortion * 0.15,
                    cos(p.x * 3.0 + mid) * rawMid * distortion * 0.15
                );

                float r, g, b;
                float time1 = low * colorShift;
                float time2 = mid * colorShift;
                float time3 = high * colorShift;

                // Different pattern styles
                if (patternStyle < 0.5) {
                    // Wave pattern - now with strong audio reactivity
                    float waveAmp = 1.0 + audioPower * 0.5;
                    r = sin(p.x * waveFrequency * waveAmp + time1) * 0.5 + 0.5;
                    g = sin(p.y * waveFrequency * waveAmp + time2 + PI / 3.0) * 0.5 + 0.5;
                    b = sin((p.x + p.y) * waveFrequency * 0.7 * waveAmp + time3 + PI * 2.0 / 3.0) * 0.5 + 0.5;

                    // Audio-reactive distortion rings
                    float dist = length(p);
                    float bassRing = sin(dist * 8.0 - rawLow * 20.0 * audioSensitivity) * rawLow * distortion;
                    float midRing = sin(dist * 12.0 - rawMid * 15.0 * audioSensitivity) * rawMid * distortion;
                    float highRing = sin(dist * 16.0 - rawHigh * 10.0 * audioSensitivity) * rawHigh * distortion;

                    r += bassRing * 0.4 + sin(dist * 3.0 + time1 * 2.0) * 0.2;
                    g += midRing * 0.4 + sin(dist * 4.0 + time2 * 2.0) * 0.2;
                    b += highRing * 0.4 + sin(dist * 5.0 + time3 * 2.0) * 0.2;
                } else if (patternStyle < 1.5) {
                    // Spiral pattern - now pulses with audio
                    float angle = atan(p.y, p.x);
                    float radius = length(p);

                    // Audio-reactive spiral speed and expansion
                    float spiralSpeed = 3.0 + rawLow * 5.0 * audioSensitivity;
                    float spiralExpand = 4.0 + rawMid * 8.0 * audioSensitivity;

                    r = sin(angle * waveFrequency + radius * spiralExpand - time1 * spiralSpeed) * 0.5 + 0.5;
                    g = sin(angle * waveFrequency + radius * spiralExpand - time2 * spiralSpeed + PI / 2.0) * 0.5 + 0.5;
                    b = sin(angle * waveFrequency + radius * spiralExpand - time3 * spiralSpeed + PI) * 0.5 + 0.5;

                    // Strong audio pulse rings
                    float pulse = sin(radius * 15.0 - audioPower * 8.0) * distortion;
                    float bassPulse = sin(radius * 6.0 - rawLow * 30.0 * audioSensitivity) * rawLow;
                    r += pulse * 0.3 + bassPulse * 0.5;
                    g += pulse * 0.25 + bassPulse * 0.3;
                    b += pulse * 0.2 + bassPulse * 0.2;
                } else {
                    // Plasma pattern - audio warps the plasma
                    float audioWarp = 1.0 + audioPower * 0.3;
                    float v1 = sin(p.x * waveFrequency * audioWarp + time1 + rawLow * 5.0);
                    float v2 = sin(waveFrequency * audioWarp * (p.x * sin(time2 * 0.5 + rawMid * 3.0) + p.y * cos(time2 * 0.3)));
                    float v3 = sin(waveFrequency * audioWarp * (p.x * cos(time3 * 0.3) + p.y * sin(time3 * 0.5 + rawHigh * 3.0)));
                    float v4 = sin(sqrt(p.x * p.x + p.y * p.y) * waveFrequency * (1.0 + rawLow * audioSensitivity));

                    float v = v1 + v2 + v3 + v4;
                    v *= 0.25;

                    // Audio-reactive color cycling
                    float colorSpeed = colorShift * (1.0 + audioPower);
                    r = sin(v * PI + time1 * colorSpeed) * 0.5 + 0.5;
                    g = sin(v * PI + time2 * colorSpeed + PI / 3.0) * 0.5 + 0.5;
                    b = sin(v * PI + time3 * colorSpeed + PI * 2.0 / 3.0) * 0.5 + 0.5;

                    // Strong audio color mixing
                    float audioMix = audioPower * distortion * 0.4;
                    r = mix(r, sin(v * PI * 2.0 + rawLow * 10.0), audioMix);
                    g = mix(g, cos(v * PI * 2.0 + rawMid * 10.0), audioMix);
                    b = mix(b, sin(v * PI * 1.5 + rawHigh * 10.0), audioMix * 0.8);
                }

                // Audio-reactive brightness boost
                float brightnessBoost = 1.0 + audioPower * 0.3;

                // Apply intensity with audio boost
                r *= intensity * brightnessBoost;
                g *= intensity * brightnessBoost;
                b *= intensity * brightnessBoost;

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
        this.rawLowUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'rawLow');
        this.rawMidUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'rawMid');
        this.rawHighUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'rawHigh');
        this.intensityUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'intensity');
        this.waveFrequencyUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'waveFrequency');
        this.colorShiftUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'colorShift');
        this.patternStyleUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'patternStyle');
        this.distortionUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'distortion');
        this.audioSensitivityUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'audioSensitivity');
    }

    private getFrequencyBands(): { low: number; mid: number; high: number } {
        const audioArray = this.audioData.timeByteArray;
        const len = audioArray.length;
        if (len === 0) return { low: 0, mid: 0, high: 0 };

        // Use first 15% for bass (more accurate for bass frequencies)
        const bassEnd = Math.floor(len * 0.15);
        const midEnd = Math.floor(len * 0.5);
        let lowSum = 0, midSum = 0, highSum = 0;

        for (let i = 0; i < bassEnd; i++) {
            lowSum += audioArray[i] || 0;
        }
        for (let i = bassEnd; i < midEnd; i++) {
            midSum += audioArray[i] || 0;
        }
        for (let i = midEnd; i < len; i++) {
            highSum += audioArray[i] || 0;
        }

        // Normalize to 0-1 range (divide by 255, not 100!)
        return {
            low: (lowSum / bassEnd / 255) * this.settings.audioSensitivity,
            mid: (midSum / (midEnd - bassEnd) / 255) * this.settings.audioSensitivity,
            high: (highSum / (len - midEnd) / 255) * this.settings.audioSensitivity,
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
            this.gl.uniform1f(this.audioSensitivityUniformLocation, settings.audioSensitivity);
        }
    }

    updateAudioData(data: NormalAudioDataDto): void {
        this.audioData = data;
    }

    render(): void {
        if (!this.canvas || !this.gl) return;

        if (this.canvas.width !== window.innerWidth || this.canvas.height !== window.innerHeight) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        // Calculate frequency bands
        const bands = this.getFrequencyBands();

        // Smooth the raw audio values for less jittery visuals
        const smoothFactor = 0.3;
        this.smoothLow += (bands.low - this.smoothLow) * smoothFactor;
        this.smoothMid += (bands.mid - this.smoothMid) * smoothFactor;
        this.smoothHigh += (bands.high - this.smoothHigh) * smoothFactor;

        // Update accumulated time values (for continuous animation)
        const lowDelta = bands.low * this.settings.lowSpeed + this.settings.baseLowSpeed;
        const midDelta = bands.mid * this.settings.midSpeed + this.settings.baseMidSpeed;
        const highDelta = bands.high * this.settings.highSpeed + this.settings.baseHighSpeed;

        this.low += lowDelta;
        this.mid += midDelta;
        this.high += highDelta;

        this.gl.uniform2f(this.resolutionUniformLocation, this.canvas.width, this.canvas.height);

        // Time-accumulated values for continuous movement
        this.gl.uniform1f(this.lowUniformLocation, this.low);
        this.gl.uniform1f(this.midUniformLocation, this.mid);
        this.gl.uniform1f(this.highUniformLocation, this.high);

        // Raw audio values for immediate reactivity
        this.gl.uniform1f(this.rawLowUniformLocation, this.smoothLow);
        this.gl.uniform1f(this.rawMidUniformLocation, this.smoothMid);
        this.gl.uniform1f(this.rawHighUniformLocation, this.smoothHigh);

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

        this.canvas = null;
        this.gl = null;
        this.shaderProgram = null;
        this.vertexBuffer = null;
        this.resolutionUniformLocation = null;
        this.lowUniformLocation = null;
        this.midUniformLocation = null;
        this.highUniformLocation = null;
        this.rawLowUniformLocation = null;
        this.rawMidUniformLocation = null;
        this.rawHighUniformLocation = null;
        this.intensityUniformLocation = null;
        this.waveFrequencyUniformLocation = null;
        this.colorShiftUniformLocation = null;
        this.patternStyleUniformLocation = null;
        this.distortionUniformLocation = null;
        this.audioSensitivityUniformLocation = null;
    }
}
