import { Scene } from '@/src/scene/scene';
import { AudioDataDto } from '@/src/utils/eventMessage';
import { bindAudioDataToTexture, initTexture, initShaderProgram } from '@/src/utils/openGl/openGl';
import { SceneSetting } from '../../sceneSetting';

export class SunFlower implements Scene {
    private canvas;
    private gl;
    private audioTexture: WebGLTexture | null = null;
    private audioTextureUniformLocation: WebGLUniformLocation | null = null;
    private resolutionUniformLocation: WebGLUniformLocation | null = null;
    private timeUniformLocation: WebGLUniformLocation | null = null;
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
                uniform float time;
                uniform sampler2D audioTexture;

                // Parameters
                const float radius = 0.2;
                const float barHeight = 0.9;
                const float PI = 3.141592653589793;
                float random(vec2 co) {
                  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
                }
                const vec3 innerColor = vec3(1.0, 1.0, 0.0);
                void main() {
                  vec2 fragCoord = gl_FragCoord.xy;
                  vec2 uv = fragCoord.xy / resolution.xy;

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


                  float dynamicMidRadius = radius + audioValue * barHeight * 0.5;
                  float dynamicOuterRadius = radius + audioValue * barHeight;
                  vec3 outerColor = mix(vec3(1.0, 0.4, 0.0), vec3(1.0, 0.0, 0.6), smoothstep(radius, dynamicOuterRadius, dist));;
                  vec3 color = mix(innerColor, outerColor, smoothstep(radius, dynamicMidRadius, dist));
                  color *= 1.0 - smoothstep(dynamicMidRadius, dynamicOuterRadius, dist);

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

    }
    updateSettings(settings: SceneSetting): void {
        throw new Error('Method not implemented.');
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
