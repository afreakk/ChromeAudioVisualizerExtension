import { Scene } from '@/src/scene/scene';
import { SceneSetting } from '@/src/scene/sceneSetting';
import { AudioDataDto } from '@/src/utils/eventMessage';
import { bindAudioDataToTexture, initTexture, initShaderProgram } from '@/src/utils/openGl/openGl';

export class SynthBars implements Scene {
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

                const float segs = 40.0;
                float random(vec2 co) {
                  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
                }
                void main() {
                  vec2 fragCoord = gl_FragCoord.xy;
                  vec2 uv = fragCoord.xy / resolution.xy;

                  float bands = segs * resolution.x / resolution.y * 0.5;
                  vec2 p;
                  p.x = floor(uv.x * bands) / bands;
                  p.y = floor(uv.y * segs) / segs;

                  float fft = texture2D(audioTexture, vec2(p.x, 0.0)).x;

                  // color
                  vec3 color = mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 0.0, 1.0), sqrt(uv.y));

                  // mask for bar graph
                  float mask = (p.y < fft) ? 1.0 : 0.1;

                  // led shape
                  vec2 d = fract((uv - p) * vec2(bands, segs)) - 0.5;
                  float led = smoothstep(0.5, 0.35, abs(d.x)) * smoothstep(0.5, 0.35, abs(d.y));
                  vec3 ledColor = led*color*mask;

                  // Horizontal line
                  float lineSpeed = 0.2;
                  float lineThickness = 0.005;
                  float linePosition = mod(time * lineSpeed, 1.0);
                  float distanceFromLine = abs(uv.y - linePosition);
                  if(distanceFromLine < lineThickness) {
                    ledColor += 0.1;
                  }

                  // White noice for
                  float noise = random(uv + time);
                  ledColor += noise * 0.06;

                  gl_FragColor = vec4(ledColor, 1.0);
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
