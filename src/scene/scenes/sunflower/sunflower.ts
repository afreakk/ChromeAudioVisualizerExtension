import { Scene } from '@/src/scene/scene';
import { AudioDataDto } from '@/src/utils/eventMessage';
import { bindAudioDataToTexture, initTexture, initShaderProgram } from '@/src/utils/openGl/openGl';
import { SunFlowerSetting } from './setting';
import { hexToRGBNormalized } from '@/src/utils/openGl/colorConverter';

export class SunFlower implements Scene {
    private canvas;
    private gl;
    private audioTexture: WebGLTexture | null = null;
    private audioTextureUniformLocation: WebGLUniformLocation | null = null;
    private resolutionUniformLocation: WebGLUniformLocation | null = null;
    private timeUniformLocation: WebGLUniformLocation | null = null;
    private radiusUniformLocation: WebGLUniformLocation | null = null;
    private sizeUniformLocation: WebGLUniformLocation | null = null;
    private innerColorUniformLocation: WebGLUniformLocation | null = null;
    private midColorUniformLocation: WebGLUniformLocation | null = null;
    private outerColorUniformLocation: WebGLUniformLocation | null = null;
    private innerRadiusGainUniformLocation: WebGLUniformLocation | null = null;
    private midRadiusGainUniformLocation: WebGLUniformLocation | null = null;
    private outerRadiusGainUniformLocation: WebGLUniformLocation | null = null;
    private vertexBuffer: WebGLBuffer | null = null;
    private shaderProgram: WebGLProgram | null = null;
    private audioData: AudioDataDto;
    constructor(canvas: HTMLCanvasElement) {
        this.audioData = new AudioDataDto([], [], []);
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl');
    }
    build(): void {
        if (!this.gl) {
            console.error('Unable to initialize WebGL. Your browser may not support it.');
            return;
        }
        const vs =
            `
                attribute vec4 vertexPosition;
                void main() {
                    gl_Position = vertexPosition;
                }
            `;

        const fs =
            `
                precision mediump float;
                uniform vec2 resolution;
                uniform vec3 innerColor;
                uniform vec3 midColor;
                uniform vec3 outerColor;

                uniform float innerRadiusGain;
                uniform float midRadiusGain;
                uniform float outerRadiusGain;
                uniform float radius;
                uniform float size;
                uniform float time;
                uniform sampler2D audioTexture;

                // Parameters
                const float PI = 3.141592653589793;
                float random(vec2 co) {
                  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
                }
                void main() {
                  vec2 fragCoord = gl_FragCoord.xy;
                  vec2 uv = fragCoord.xy / resolution.xy;
                  uv.y -= 0.1;

                  // Center the coordinates
                  vec2 centeredUV = uv * 2.0 - 1.0;
                  centeredUV.x *= resolution.x / resolution.y;

                  // Flip the Y axis to create symmetry
                  if (centeredUV.x >= 0.0)
                  {
                    centeredUV.y = -centeredUV.y;
                  }

                  // Noice
                  float noise = random(uv + time);

                  // Convert UV to polar coordinates
                  float angle = atan(centeredUV.x, centeredUV.y);
                  if(angle < 0.0) angle += 1.0 * PI;

                  float dist = length(centeredUV);
                  float index = angle / (1.0 * PI);
                  float audioValue = texture2D(audioTexture, vec2(index, 0.0)).x;
                  if (audioValue < 0.01)
                  {
                    audioValue = 0.01 + sin(noise) * 0.01;
                  }


                  float dynamicInnerRadius = radius + audioValue * size * innerRadiusGain;
                  float dynamicMidRadius = radius + audioValue * size * midRadiusGain;
                  float dynamicOuterRadius = radius + audioValue * size * outerRadiusGain;
                  float dynamicEndRadius = radius + audioValue * size;

                  vec3 color = mix(midColor, outerColor, smoothstep(dynamicMidRadius, dynamicOuterRadius, dist));
                  color = mix(innerColor, color, smoothstep(dynamicInnerRadius, dynamicMidRadius, dist));
                  color *= 1.0 - smoothstep(dynamicMidRadius, dynamicEndRadius, dist);

                  gl_FragColor = vec4(color, 1.0); // Color based on intensit
                }
            `;

        // Vertex data for a square
        const vertices = new Float32Array([
            -1.0, 1.0,
            -1.0, -1.0,
            1.0, 1.0,
            1.0, -1.0,
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
        this.timeUniformLocation = this.gl.getUniformLocation(this.shaderProgram, "time");
        this.radiusUniformLocation = this.gl.getUniformLocation(this.shaderProgram, "radius");
        this.sizeUniformLocation = this.gl.getUniformLocation(this.shaderProgram, "size");
        this.innerColorUniformLocation = this.gl.getUniformLocation(this.shaderProgram, "innerColor");
        this.midColorUniformLocation = this.gl.getUniformLocation(this.shaderProgram, "midColor");
        this.outerColorUniformLocation = this.gl.getUniformLocation(this.shaderProgram, "outerColor");
        this.innerRadiusGainUniformLocation = this.gl.getUniformLocation(this.shaderProgram, "innerRadiusGain");
        this.midRadiusGainUniformLocation = this.gl.getUniformLocation(this.shaderProgram, "midRadiusGain");
        this.outerRadiusGainUniformLocation = this.gl.getUniformLocation(this.shaderProgram, "outerRadiusGain");

    }
    updateSettings(settings: SunFlowerSetting): void {
        if (!this.gl) {
            return;
        }
        this.gl.useProgram(this.shaderProgram);
        this.gl.uniform1f(this.innerRadiusGainUniformLocation, settings.innerRadiusGain);
        this.gl.uniform1f(this.midRadiusGainUniformLocation, settings.midRadiusGain);
        this.gl.uniform1f(this.outerRadiusGainUniformLocation, settings.outerRadiusGain);
        this.gl.uniform1f(this.radiusUniformLocation, settings.radius);
        this.gl.uniform1f(this.sizeUniformLocation, settings.size);
        const innerColor = hexToRGBNormalized(settings.innerColor);
        const midColor = hexToRGBNormalized(settings.midColor);
        const outerColor = hexToRGBNormalized(settings.outerColor);

        this.gl.uniform3fv(this.innerColorUniformLocation, innerColor);
        this.gl.uniform3fv(this.midColorUniformLocation, midColor);
        this.gl.uniform3fv(this.outerColorUniformLocation, outerColor);
    }
    updateAudioData(data: AudioDataDto): void {
        this.audioData = data;
    }
    render(): void {
        if (!this.gl) {
            return;
        }

        // Update canvas size and viewport
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        // Update audio texture
        bindAudioDataToTexture(new Uint8Array(this.audioData.timeByteArray), this.gl);
        // Update resolution
        this.gl.uniform2f(this.resolutionUniformLocation, this.gl.canvas.width, this.gl.canvas.height);

        // Updated time
        const timeInSeconds = performance.now() / 1000.0;
        this.gl.uniform1f(this.timeUniformLocation, timeInSeconds);

        // Bind texture
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.audioTexture);
        this.gl.uniform1i(this.audioTextureUniformLocation, 0);

        // Draw the quad
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    }
    clean(): void {
        if (!this.gl) {
            return;
        }

        if (this.vertexBuffer !== null) {
            this.gl.deleteBuffer(this.vertexBuffer);
        }

        if (this.audioTexture !== null) {
            this.gl.deleteTexture(this.audioTexture);
        }
        if (this.shaderProgram !== null) {
            const shaders = this.gl.getAttachedShaders(this.shaderProgram);
            if (shaders !== null && shaders.length > 0) {
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
    }
}
