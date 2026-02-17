import { IScene } from '@/src/scene/scene';
import { NormalAudioDataDto, streamType } from '@/src/utils/eventMessage';
import { bindAudioDataToTexture, initTexture, initShaderProgram } from '@/src/utils/openGl/openGl';
import { hexToRGBNormalized } from '@/src/utils/openGl/colorConverter';
import { FrostFireSetting } from './setting';

export class FrostFire implements IScene {
    private canvas: HTMLCanvasElement | null = null;
    private gl: WebGLRenderingContext | null = null;
    private audioTexture: WebGLTexture | null = null;
    private audioTextureUniformLocation: WebGLUniformLocation | null = null;
    private resolutionUniformLocation: WebGLUniformLocation | null = null;
    private timeUniformLocation: WebGLUniformLocation | null = null;

    private numberOfHexagonsUniformLocation: WebGLUniformLocation | null = null;
    private heightUniformLocation: WebGLUniformLocation | null = null;
    private colorBlendUniformLocation: WebGLUniformLocation | null = null;
    private dynamicColorUniformLocation: WebGLUniformLocation | null = null;
    private breathingUniformLocation: WebGLUniformLocation | null = null;
    private frostColorUniformLocation: WebGLUniformLocation | null = null;
    private fireColorUniformLocation: WebGLUniformLocation | null = null;
    private blendColorUniformLocation: WebGLUniformLocation | null = null;

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
                uniform float time;
                uniform sampler2D audioTexture;
                uniform vec2 resolution;

                uniform vec3 frostColor;
                uniform vec3 blendColor;
                uniform vec3 fireColor;
                uniform float numberOfHexagons;
                uniform float height;
                uniform float colorBlend;
                uniform float dynamicColor;
                uniform float breathing;
                float hexDist(vec2 p) {
                    p = abs(p);
                    
                    float c = dot(p, normalize(vec2(1.0,1.73)));
                    
                    return max(c, p.x);
                }

                void main() {
                    vec2 fragCoord = gl_FragCoord.xy;

                    
                    
                    float timeGain = time * 2.0;
                    vec2 uv = (fragCoord-.5*resolution.xy)/resolution.y;
                    
                    
                    uv *= numberOfHexagons;
                    
                    vec2 r = vec2(1.0,1.73);
                    vec2 h = r * 0.5;    
                    vec2 a = mod(uv, r) - h;
                    vec2 b = mod(uv - h, r) - h;   
                    vec2 gv = b;
                    if (length(a) < length(b)) {
                        gv = a;
                    }
                    
                    float size = 0.5 - hexDist(gv);
                    vec2 id = (uv - gv);
                    size *= (1.0 - breathing) - abs(sin(id.x * id.y + timeGain)) * breathing;
                    
                    id /= numberOfHexagons;   
                    id.x = id.x * 0.5 + 0.5;
                    id.y = id.y * 0.5 + 0.5;
                    id.x = smoothstep(0.0, 1.0, id.x);
                    id.y = smoothstep(0.0, 1.0, id.y);

                    
                    float audio = texture2D(audioTexture, vec2(id.x, 0.0)).x;
                    float audioInv = texture2D(audioTexture, vec2(1.0-id.x, 0.0)).x;
                    
                    
                    audio *= height;
                    audioInv = 1.0 - audioInv * height;
                    

                    bool audioHit = false;
                    bool audioInverseHit = false;

                    vec3 fireSideColor = mix(blendColor, fireColor, id.x * colorBlend + 1.0 - colorBlend);
                    vec3 frostSideColor = mix(blendColor, frostColor, 1.0 - id.x * colorBlend);
                    vec3 col = mix(frostSideColor, fireSideColor, smoothstep(0.3, 0.7, id.y));

                    float colorGain = 0.10;
                    if (audio > id.y) {
                        colorGain = max(audio, dynamicColor);
                        col = frostSideColor;
                        audioHit = true;
                    }
                    if (audioInv < id.y) {
                        colorGain = max(audioInv, dynamicColor);
                        col = fireSideColor;
                        audioInverseHit = true;

                    }
                    if (audioHit && audioInverseHit) {
                        col = mix(frostSideColor, fireSideColor, smoothstep(0.3, 0.7, id.y));
                    }
                    float c = smoothstep(0.01, 0.03, size) * colorGain;
                    col *= c;


                  gl_FragColor = vec4(col, 1.0); 
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
        this.numberOfHexagonsUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'numberOfHexagons');
        this.heightUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'height');
        this.colorBlendUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'colorBlend');
        this.dynamicColorUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'dynamicColor');
        this.breathingUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'breathing');
        this.frostColorUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'frostColor');
        this.fireColorUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'fireColor');
        this.blendColorUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'blendColor');

    }
    updateSettings(settings: FrostFireSetting): void {
        if (!this.gl) {
            return;
        }
        this.gl.useProgram(this.shaderProgram);
        this.gl.uniform1f(this.heightUniformLocation, settings.height);
        this.gl.uniform1f(this.numberOfHexagonsUniformLocation, settings.numberOfHexagons);
        this.gl.uniform1f(this.colorBlendUniformLocation, settings.colorBlend);
        this.gl.uniform1f(this.dynamicColorUniformLocation, settings.dynamicColor);
        this.gl.uniform1f(this.breathingUniformLocation, settings.breathing);

        const frostColor = hexToRGBNormalized(settings.frostColor);
        const fireColor = hexToRGBNormalized(settings.fireColor);
        const blendColor = hexToRGBNormalized(settings.blendColor);

        this.gl.uniform3fv(this.frostColorUniformLocation, frostColor);
        this.gl.uniform3fv(this.fireColorUniformLocation, fireColor);
        this.gl.uniform3fv(this.blendColorUniformLocation, blendColor);
    }
    updateAudioData(data: NormalAudioDataDto): void {
        this.audioData = data;
    }
    render(): void {
        if (this.canvas === null) {
            return;
        }
        if (!this.gl) {
            return;
        }
        if (this.canvas.width !== window.innerWidth || this.canvas.height !== window.innerHeight) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
        // Update canvas size and viewport
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        // Bind texture
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.audioTexture);
        this.gl.uniform1i(this.audioTextureUniformLocation, 0);
        bindAudioDataToTexture(new Uint8Array(this.audioData.timeByteArray), this.gl);

        // Update resolution
        this.gl.uniform2f(this.resolutionUniformLocation, this.gl.canvas.width, this.gl.canvas.height);

        // Updated time
        const timeInSeconds = performance.now() / 1000.0;
        this.gl.uniform1f(this.timeUniformLocation, timeInSeconds);

        // Draw the quad
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
    clean(): void {
        if (this.canvas === null) {
            return;
        }
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
        this.canvas.remove();
    }
}
