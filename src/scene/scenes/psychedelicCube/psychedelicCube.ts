import * as mat4 from 'gl-matrix/mat4';
import * as vec3 from 'gl-matrix/vec3';
import type { IScene } from '@/src/scene/scene';
import { createFullscreenWebGLCanvas } from '@/src/utils/canvas';
import { NormalAudioDataDto, streamType } from '@/src/utils/eventMessage';
import { initShaderProgram } from '@/src/utils/openGl/openGl';
import { PsychedelicCubeSetting } from './setting';

interface ShaderProgram extends WebGLProgram {
    position: number;
    aTxCoords: number;
    projectionMatrix: WebGLUniformLocation | null;
    worldMatrix: WebGLUniformLocation | null;
    modelMatrix: WebGLUniformLocation | null;
    time: WebGLUniformLocation | null;
    resolution: WebGLUniformLocation | null;
    colorInfluence: WebGLUniformLocation | null;
    colorSeparation: WebGLUniformLocation | null;
    audioReact: WebGLUniformLocation | null;
}

interface CubeGeometry {
    vertices: Float32Array;
    indices: Uint16Array;
    txCoords: Float32Array;
}

export class PsychedelicCube implements IScene {
    private canvas: HTMLCanvasElement | null = null;
    private gl: WebGLRenderingContext | null = null;
    private vxBuffer: WebGLBuffer | null = null;
    private ixBuffer: WebGLBuffer | null = null;
    private txBuffer: WebGLBuffer | null = null;
    private shaderProgram: ShaderProgram | null = null;
    private modelMatrix: mat4;
    private audioData: NormalAudioDataDto;
    private cubeGeometry: CubeGeometry;
    private settings: PsychedelicCubeSetting;
    private soundValue: number = 0;
    private startTime: number;

    constructor() {
        this.audioData = new NormalAudioDataDto([]);
        this.cubeGeometry = this.getCube();
        this.settings = new PsychedelicCubeSetting();
        this.modelMatrix = mat4.create();
        this.startTime = Date.now();
    }

    streamType = streamType.normal;

    private getCube(): CubeGeometry {
        return {
            vertices: new Float32Array([
                // Front face
                -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0,

                // Back face
                -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0,

                // Top face
                -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0,

                // Bottom face
                -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,

                // Right face
                1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0,

                // Left face
                -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0,
            ]),
            indices: new Uint16Array([
                0,
                1,
                2,
                0,
                2,
                3, // Front face
                4,
                5,
                6,
                4,
                6,
                7, // Back face
                8,
                9,
                10,
                8,
                10,
                11, // Top face
                12,
                13,
                14,
                12,
                14,
                15, // Bottom face
                16,
                17,
                18,
                16,
                18,
                19, // Right face
                20,
                21,
                22,
                20,
                22,
                23, // Left face
            ]),
            txCoords: new Float32Array([
                // Front face
                0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,

                // Back face
                1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0,

                // Top face
                0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0,

                // Bottom face
                1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,

                // Right face
                1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0,

                // Left face
                0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            ]),
        };
    }

    private getVolume(): number {
        const data = this.audioData.timeByteArray;
        if (data.length === 0) return 0;
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            sum += data[i];
        }
        return sum / data.length;
    }

    private getLow(): number {
        const data = this.audioData.timeByteArray;
        if (data.length === 0) return 0;
        const third = Math.floor(data.length / 3);
        let sum = 0;
        for (let i = 0; i < third; i++) {
            sum += data[i];
        }
        return sum / third;
    }

    private getMid(): number {
        const data = this.audioData.timeByteArray;
        if (data.length === 0) return 0;
        const third = Math.floor(data.length / 3);
        let sum = 0;
        for (let i = third; i < third * 2; i++) {
            sum += data[i];
        }
        return sum / third;
    }

    private getHigh(): number {
        const data = this.audioData.timeByteArray;
        if (data.length === 0) return 0;
        const third = Math.floor(data.length / 3);
        let sum = 0;
        for (let i = third * 2; i < data.length; i++) {
            sum += data[i];
        }
        return sum / (data.length - third * 2);
    }

    build(): void {
        const { canvas, gl: webGl } = createFullscreenWebGLCanvas();
        this.canvas = canvas;
        this.gl = webGl;
        if (!this.gl) {
            return;
        }

        const gl = this.gl;

        const vs = `
            attribute vec3 position;
            attribute vec2 aTxCoords;
            uniform mat4 projectionMatrix;
            uniform mat4 worldMatrix;
            uniform mat4 modelMatrix;
            varying vec3 v_pos;
            varying vec2 vTxCoord;
            varying vec3 v_normal;
            void main() {
                gl_Position = projectionMatrix * worldMatrix * modelMatrix * vec4(position, 1.0);
                v_pos = position;
                v_normal = normalize(position);
                vTxCoord = aTxCoords;
            }
        `;

        const fs = `
            precision mediump float;
            uniform float time;
            uniform vec2 resolution;
            uniform vec3 colorInfluence;
            uniform float colorSeparation;
            uniform vec3 audioReact;
            varying vec3 v_pos;
            varying vec2 vTxCoord;
            varying vec3 v_normal;
            void main(void) {
                float posProduct = abs(v_pos.x * v_pos.y * v_pos.z);
                float edgeFactor = 1.0 - abs(dot(v_normal, vec3(0.0, 0.0, 1.0)));

                // Phase-shifted colors for more separation
                float red = abs(sin(posProduct + time * colorInfluence.r));
                float green = abs(sin(posProduct + time * colorInfluence.g + colorSeparation));
                float blue = abs(sin(posProduct + time * colorInfluence.b + colorSeparation * 2.0));

                // Audio reactive boost - make colors pulse with the beat
                red = red * (0.5 + audioReact.x * 0.5);
                green = green * (0.5 + audioReact.y * 0.5);
                blue = blue * (0.5 + audioReact.z * 0.5);

                // Add edge glow effect
                vec3 baseColor = vec3(red, green, blue);
                vec3 glowColor = vec3(1.0 - red, 1.0 - green, blue) * edgeFactor * 0.6;
                vec3 finalColor = baseColor + glowColor;

                // Boost saturation
                float luminance = dot(finalColor, vec3(0.299, 0.587, 0.114));
                finalColor = mix(vec3(luminance), finalColor, 1.4);

                gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
            }
        `;

        this.shaderProgram = initShaderProgram(gl, vs, fs) as ShaderProgram | null;
        if (!this.shaderProgram) {
            return;
        }

        // Set up uniform and attribute locations
        this.shaderProgram.position = gl.getAttribLocation(this.shaderProgram, 'position');
        this.shaderProgram.aTxCoords = gl.getAttribLocation(this.shaderProgram, 'aTxCoords');
        this.shaderProgram.projectionMatrix = gl.getUniformLocation(this.shaderProgram, 'projectionMatrix');
        this.shaderProgram.worldMatrix = gl.getUniformLocation(this.shaderProgram, 'worldMatrix');
        this.shaderProgram.modelMatrix = gl.getUniformLocation(this.shaderProgram, 'modelMatrix');
        this.shaderProgram.time = gl.getUniformLocation(this.shaderProgram, 'time');
        this.shaderProgram.resolution = gl.getUniformLocation(this.shaderProgram, 'resolution');
        this.shaderProgram.colorInfluence = gl.getUniformLocation(this.shaderProgram, 'colorInfluence');
        this.shaderProgram.colorSeparation = gl.getUniformLocation(this.shaderProgram, 'colorSeparation');
        this.shaderProgram.audioReact = gl.getUniformLocation(this.shaderProgram, 'audioReact');

        this.initBuffers();
        this.initUniforms();

        gl.enableVertexAttribArray(this.shaderProgram.position);
        gl.enableVertexAttribArray(this.shaderProgram.aTxCoords);

        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
    }

    private initUniforms(): void {
        if (!this.gl || !this.canvas || !this.shaderProgram) return;
        const gl = this.gl;

        gl.useProgram(this.shaderProgram);

        // Projection matrix
        const projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, (45 * Math.PI) / 180, 16 / 9, 1, 100);
        gl.uniformMatrix4fv(this.shaderProgram.projectionMatrix, false, projectionMatrix);

        // World matrix (camera position)
        const worldMatrix = mat4.create();
        const translateBy = vec3.create();
        translateBy[2] = -5;
        mat4.translate(worldMatrix, worldMatrix, translateBy);
        gl.uniformMatrix4fv(this.shaderProgram.worldMatrix, false, worldMatrix);
    }

    private initBuffers(): void {
        if (!this.gl) return;
        const gl = this.gl;

        this.vxBuffer = gl.createBuffer();
        this.ixBuffer = gl.createBuffer();
        this.txBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vxBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.cubeGeometry.vertices, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ixBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.cubeGeometry.indices, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.txBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.cubeGeometry.txCoords, gl.STATIC_DRAW);
    }

    updateSettings(settings: PsychedelicCubeSetting): void {
        this.settings = settings;
    }

    updateAudioData(data: NormalAudioDataDto): void {
        this.audioData = data;
    }

    render(): void {
        if (!this.canvas || !this.gl || !this.shaderProgram) {
            return;
        }

        const gl = this.gl;
        const program = this.shaderProgram;

        // Update canvas size and viewport
        if (this.canvas.width !== window.innerWidth || this.canvas.height !== window.innerHeight) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }

        gl.useProgram(program);

        // Clear background
        gl.clearColor(this.settings.bgRed, this.settings.bgGreen, this.settings.bgBlue, this.settings.bgAlpha);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Get audio values
        let volume = this.getVolume() / 100.0;
        if (Number.isNaN(volume)) volume = 0;

        // Rotate model based on volume
        const rotationAxis = vec3.fromValues(0.5, 0.5, 0.5);
        mat4.rotate(this.modelMatrix, this.modelMatrix, volume * this.settings.spinSpeed, rotationAxis);

        // Scale based on frequency bands
        const scaleVec = vec3.fromValues(this.getHigh(), this.getMid(), this.getLow());
        for (let i = 0; i < 3; i++) {
            scaleVec[i] = Math.max(scaleVec[i] * this.settings.cubeVolumeScale, 0.1);
        }
        const scaleMatrix = mat4.create();
        mat4.scale(scaleMatrix, scaleMatrix, scaleVec);

        // Combine model and scale matrices
        const sendMatrix = mat4.create();
        mat4.multiply(sendMatrix, this.modelMatrix, scaleMatrix);
        gl.uniformMatrix4fv(program.modelMatrix, false, sendMatrix);

        // Update time-based uniforms
        this.soundValue += volume * this.settings.volumeMultiplier;
        gl.uniform1f(program.time, this.soundValue);
        gl.uniform2f(program.resolution, this.canvas.width, this.canvas.height);

        // Normalize audio values for shader (0-1 range)
        const low = (this.getLow() / 255.0) * this.settings.pulseIntensity;
        const mid = (this.getMid() / 255.0) * this.settings.pulseIntensity;
        const high = (this.getHigh() / 255.0) * this.settings.pulseIntensity;

        gl.uniform3f(
            program.colorInfluence,
            this.settings.redSpeed * low * 100,
            this.settings.greenSpeed * mid * 100,
            this.settings.blueSpeed * high * 100,
        );
        gl.uniform1f(program.colorSeparation, this.settings.colorSeparation);
        gl.uniform3f(program.audioReact, low, mid, high);

        // Draw
        gl.bindBuffer(gl.ARRAY_BUFFER, this.txBuffer);
        gl.vertexAttribPointer(program.aTxCoords, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vxBuffer);
        gl.vertexAttribPointer(program.position, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ixBuffer);
        gl.drawElements(gl.TRIANGLES, this.cubeGeometry.indices.length, gl.UNSIGNED_SHORT, 0);
    }

    clean(): void {
        if (!this.canvas || !this.gl) {
            return;
        }

        const gl = this.gl;

        if (this.vxBuffer !== null) {
            gl.deleteBuffer(this.vxBuffer);
        }
        if (this.ixBuffer !== null) {
            gl.deleteBuffer(this.ixBuffer);
        }
        if (this.txBuffer !== null) {
            gl.deleteBuffer(this.txBuffer);
        }
        if (this.shaderProgram !== null) {
            const shaders = gl.getAttachedShaders(this.shaderProgram);
            if (shaders !== null && shaders.length > 0) {
                for (const shader of shaders) {
                    gl.detachShader(this.shaderProgram, shader);
                    gl.deleteShader(shader);
                }
            }
            gl.deleteProgram(this.shaderProgram);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        this.canvas.remove();

        this.canvas = null;
        this.gl = null;
        this.shaderProgram = null;
        this.vxBuffer = null;
        this.ixBuffer = null;
        this.txBuffer = null;
    }
}
