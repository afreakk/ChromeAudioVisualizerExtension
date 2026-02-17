import { IScene } from '@/src/scene/scene';
import { NormalAudioDataDto, streamType } from '@/src/utils/eventMessage';
import { bindAudioDataToTexture, initTexture, initShaderProgram } from '@/src/utils/openGl/openGl';
import { CircleBurstSetting } from './setting';
import { hexToRGBNormalized } from '@/src/utils/openGl/colorConverter';

export class CircleBurst implements IScene {
    private canvas: HTMLCanvasElement | null = null;
    private gl: WebGLRenderingContext | null = null;
    private audioTexture: WebGLTexture | null = null;
    private audioTextureUniformLocation: WebGLUniformLocation | null = null;
    private resolutionUniformLocation: WebGLUniformLocation | null = null;
    private timeUniformLocation: WebGLUniformLocation | null = null;
    private baseRadiusUniformLocation: WebGLUniformLocation | null = null;
    private maxRadiusUniformLocation: WebGLUniformLocation | null = null;
    private numSpokesUniformLocation: WebGLUniformLocation | null = null;
    private rotationSpeedUniformLocation: WebGLUniformLocation | null = null;
    private colorCycleSpeedUniformLocation: WebGLUniformLocation | null = null;
    private audioSensitivityUniformLocation: WebGLUniformLocation | null = null;
    private innerColorUniformLocation: WebGLUniformLocation | null = null;
    private outerColorUniformLocation: WebGLUniformLocation | null = null;
    private backgroundColorUniformLocation: WebGLUniformLocation | null = null;
    private glowIntensityUniformLocation: WebGLUniformLocation | null = null;
    private spokeWidthUniformLocation: WebGLUniformLocation | null = null;
    private vertexBuffer: WebGLBuffer | null = null;
    private shaderProgram: WebGLProgram | null = null;
    private audioData: NormalAudioDataDto;

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
            uniform float time;
            uniform float baseRadius;
            uniform float maxRadius;
            uniform float numSpokes;
            uniform float rotationSpeed;
            uniform float colorCycleSpeed;
            uniform float audioSensitivity;
            uniform vec3 innerColor;
            uniform vec3 outerColor;
            uniform vec3 backgroundColor;
            uniform float glowIntensity;
            uniform float spokeWidth;
            uniform sampler2D audioTexture;

            const float PI = 3.141592653589793;
            const float TAU = 6.283185307179586;

            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                vec2 center = vec2(0.5, 0.5);
                vec2 pos = uv - center;
                pos.x *= resolution.x / resolution.y;

                float dist = length(pos);
                float angle = atan(pos.y, pos.x);

                // Rotation based on time and audio
                float rotation = time * rotationSpeed;
                angle += rotation;

                // Normalize angle to 0-1 range
                float normalizedAngle = (angle + PI) / TAU;
                normalizedAngle = fract(normalizedAngle);

                // Get audio value for this angle
                float audioValue = texture2D(audioTexture, vec2(normalizedAngle, 0.0)).x;
                audioValue = pow(audioValue, 0.8) * audioSensitivity;

                // Calculate spoke index
                float spokeIndex = floor(normalizedAngle * numSpokes);
                float spokeAngle = (spokeIndex + 0.5) / numSpokes;

                // Get audio for this specific spoke
                float spokeAudio = texture2D(audioTexture, vec2(spokeAngle, 0.0)).x;
                spokeAudio = pow(spokeAudio, 0.8) * audioSensitivity;

                // Calculate spoke shape
                float spokeFraction = fract(normalizedAngle * numSpokes);
                float spokeShape = smoothstep(0.5 - spokeWidth * 0.5, 0.5, spokeFraction) *
                                   smoothstep(0.5 + spokeWidth * 0.5, 0.5, spokeFraction);

                // Dynamic radius based on audio
                float dynamicRadius = baseRadius + spokeAudio * (maxRadius - baseRadius);

                // Create the burst effect
                float innerEdge = baseRadius * 0.8;
                float spokeMask = spokeShape * smoothstep(innerEdge, baseRadius, dist) *
                                  smoothstep(dynamicRadius + 0.02, dynamicRadius - 0.02, dist);

                // Color based on audio and position
                float colorPhase = time * colorCycleSpeed + normalizedAngle;
                vec3 dynamicInner = innerColor * (0.8 + 0.4 * sin(colorPhase * TAU));
                vec3 dynamicOuter = outerColor * (0.8 + 0.4 * cos(colorPhase * TAU));

                float colorMix = (dist - innerEdge) / (dynamicRadius - innerEdge);
                vec3 spokeColor = mix(dynamicInner, dynamicOuter, clamp(colorMix, 0.0, 1.0));

                // Add glow effect
                float glow = exp(-dist * 3.0) * audioValue * glowIntensity;
                vec3 glowColor = mix(innerColor, outerColor, 0.5) * glow;

                // Inner circle glow
                float innerGlow = smoothstep(baseRadius, baseRadius * 0.5, dist) * (0.5 + audioValue * 0.5);
                vec3 innerGlowColor = innerColor * innerGlow * 0.3;

                // Combine
                vec3 color = backgroundColor;
                color += spokeColor * spokeMask;
                color += glowColor;
                color += innerGlowColor;

                // Add subtle pulse to background
                color += backgroundColor * audioValue * 0.1;

                gl_FragColor = vec4(color, 1.0);
            }
        `;

        const vertices = new Float32Array([
            -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, -1.0,
        ]);

        this.vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

        this.audioTexture = initTexture(this.gl);

        this.shaderProgram = initShaderProgram(this.gl, vs, fs);
        if (!this.shaderProgram) {
            console.error('Unable to initialize the shader program');
            return;
        }

        this.gl.useProgram(this.shaderProgram);

        this.audioTextureUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'audioTexture');
        const position = this.gl.getAttribLocation(this.shaderProgram, 'vertexPosition');
        this.gl.vertexAttribPointer(position, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(position);

        this.resolutionUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'resolution');
        this.timeUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'time');
        this.baseRadiusUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'baseRadius');
        this.maxRadiusUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'maxRadius');
        this.numSpokesUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'numSpokes');
        this.rotationSpeedUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'rotationSpeed');
        this.colorCycleSpeedUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'colorCycleSpeed');
        this.audioSensitivityUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'audioSensitivity');
        this.innerColorUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'innerColor');
        this.outerColorUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'outerColor');
        this.backgroundColorUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'backgroundColor');
        this.glowIntensityUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'glowIntensity');
        this.spokeWidthUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'spokeWidth');
    }

    updateSettings(settings: CircleBurstSetting): void {
        if (!this.gl) return;

        this.gl.useProgram(this.shaderProgram);
        this.gl.uniform1f(this.baseRadiusUniformLocation, settings.baseRadius);
        this.gl.uniform1f(this.maxRadiusUniformLocation, settings.maxRadius);
        this.gl.uniform1f(this.numSpokesUniformLocation, settings.numSpokes);
        this.gl.uniform1f(this.rotationSpeedUniformLocation, settings.rotationSpeed);
        this.gl.uniform1f(this.colorCycleSpeedUniformLocation, settings.colorCycleSpeed);
        this.gl.uniform1f(this.audioSensitivityUniformLocation, settings.audioSensitivity);
        this.gl.uniform1f(this.glowIntensityUniformLocation, settings.glowIntensity);
        this.gl.uniform1f(this.spokeWidthUniformLocation, settings.spokeWidth);

        const innerColor = hexToRGBNormalized(settings.innerColor);
        const outerColor = hexToRGBNormalized(settings.outerColor);
        const backgroundColor = hexToRGBNormalized(settings.backgroundColor);

        this.gl.uniform3fv(this.innerColorUniformLocation, innerColor);
        this.gl.uniform3fv(this.outerColorUniformLocation, outerColor);
        this.gl.uniform3fv(this.backgroundColorUniformLocation, backgroundColor);
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

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.audioTexture);
        this.gl.uniform1i(this.audioTextureUniformLocation, 0);
        bindAudioDataToTexture(new Uint8Array(this.audioData.timeByteArray), this.gl);

        this.gl.uniform2f(this.resolutionUniformLocation, this.canvas.width, this.canvas.height);
        this.gl.uniform1f(this.timeUniformLocation, performance.now() / 1000.0);

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    clean(): void {
        if (!this.canvas || !this.gl) return;

        if (this.vertexBuffer) this.gl.deleteBuffer(this.vertexBuffer);
        if (this.audioTexture) this.gl.deleteTexture(this.audioTexture);

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
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.canvas.remove();

        this.canvas = null;
        this.gl = null;
        this.shaderProgram = null;
        this.vertexBuffer = null;
        this.audioTexture = null;
        this.audioTextureUniformLocation = null;
        this.resolutionUniformLocation = null;
        this.timeUniformLocation = null;
        this.baseRadiusUniformLocation = null;
        this.maxRadiusUniformLocation = null;
        this.numSpokesUniformLocation = null;
        this.rotationSpeedUniformLocation = null;
        this.colorCycleSpeedUniformLocation = null;
        this.audioSensitivityUniformLocation = null;
        this.innerColorUniformLocation = null;
        this.outerColorUniformLocation = null;
        this.backgroundColorUniformLocation = null;
        this.glowIntensityUniformLocation = null;
        this.spokeWidthUniformLocation = null;
    }
}
