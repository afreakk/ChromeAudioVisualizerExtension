import * as mat4 from 'gl-matrix/mat4';
import * as vec3 from 'gl-matrix/vec3';
import type { IScene } from '@/src/scene/scene';
import { createFullscreenWebGLCanvas } from '@/src/utils/canvas';
import { NormalAudioDataDto, streamType } from '@/src/utils/eventMessage';
import { initShaderProgram } from '@/src/utils/openGl/openGl';
import { Dancing3DCubesSetting } from './setting';

interface Cube {
    x: number;
    y: number;
    z: number;
    pos: vec3;
    modelViewMatrix: mat4;
    normalMatrix: mat4;
    update(
        v: number,
        speed: number,
        width: number,
        height: number,
        directionChangeSpeed: number,
        spaceHeight: number,
        spaceWidth: number,
        spaceZBegin: number,
        spaceZEnd: number,
        spaceZoffset: number,
    ): void;
    draw(
        colorStr: number,
        colorChangeSpeed: number,
        program: ShaderProgram,
        indiceLen: number,
        v: number,
        textureSinusIntensity: number,
        gl: WebGLRenderingContext,
    ): void;
}

interface ShaderProgram extends WebGLProgram {
    position: number;
    vertexNormal: number;
    projectionMatrix: WebGLUniformLocation | null;
    modelViewMatrix: WebGLUniformLocation | null;
    normalMatrix: WebGLUniformLocation | null;
    colorInfluence: WebGLUniformLocation | null;
    worldPos: WebGLUniformLocation | null;
    cubeAlpha: WebGLUniformLocation | null;
    time: WebGLUniformLocation | null;
}

interface CubeGeometry {
    vertices: number[];
    indices: number[];
    normals: number[];
}

class DancingCube3D implements Cube {
    x: number;
    y: number;
    z: number;
    pos: vec3;
    modelViewMatrix: mat4;
    normalMatrix: mat4;
    private scratchScale: vec3;
    private scratchScaleMatrix: mat4;

    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.pos = vec3.create();
        this.modelViewMatrix = mat4.create();
        this.normalMatrix = mat4.create();
        this.scratchScale = vec3.create();
        this.scratchScaleMatrix = mat4.create();
    }

    update(
        v: number,
        speed: number,
        width: number,
        height: number,
        directionChangeSpeed: number,
        spaceHeight: number,
        spaceWidth: number,
        spaceZBegin: number,
        spaceZEnd: number,
        _spaceZoffset: number,
    ): void {
        this.x += Math.sin(v * directionChangeSpeed) * v * speed;
        this.y += Math.cos(v * directionChangeSpeed) * v * speed;
        this.z += Math.sin(v * directionChangeSpeed) * v * speed;

        // Wrap around spatial boundaries
        if (this.x > spaceWidth) {
            this.x = -spaceWidth;
        }
        if (this.x < -spaceWidth) {
            this.x = spaceWidth;
        }

        if (this.z > -spaceZBegin) {
            this.z = -spaceZEnd;
        }
        if (this.z < -spaceZEnd) {
            this.z = -spaceZBegin;
        }

        if (this.y > spaceHeight) {
            this.y = -spaceHeight;
        }
        if (this.y < -spaceHeight) {
            this.y = spaceHeight;
        }

        this.pos[0] = this.x;
        this.pos[1] = this.y;
        this.pos[2] = this.z;
        mat4.fromTranslation(this.modelViewMatrix, this.pos);
        vec3.set(this.scratchScale, width * v, height * v, width * v);
        mat4.identity(this.scratchScaleMatrix);
        mat4.scale(this.scratchScaleMatrix, this.scratchScaleMatrix, this.scratchScale);
        mat4.multiply(this.modelViewMatrix, this.modelViewMatrix, this.scratchScaleMatrix);
        mat4.invert(this.normalMatrix, this.modelViewMatrix);
        mat4.transpose(this.normalMatrix, this.normalMatrix);
    }

    draw(
        colorStr: number,
        colorChangeSpeed: number,
        program: ShaderProgram,
        indiceLen: number,
        v: number,
        textureSinusIntensity: number,
        gl: WebGLRenderingContext,
    ): void {
        gl.uniformMatrix4fv(program.normalMatrix, false, this.normalMatrix);
        gl.uniformMatrix4fv(program.modelViewMatrix, false, this.modelViewMatrix);
        gl.uniform3f(
            program.colorInfluence,
            Math.sin(v * colorChangeSpeed) * colorStr,
            Math.cos(v * colorChangeSpeed) * colorStr,
            Math.cos(v * colorChangeSpeed + 0.35) * colorStr,
        );
        gl.uniform4f(program.worldPos, this.x, this.y, this.z, v * textureSinusIntensity);
        gl.drawElements(gl.TRIANGLES, indiceLen, gl.UNSIGNED_SHORT, 0);
    }
}

export class Dancing3DCubes implements IScene {
    private canvas: HTMLCanvasElement | null = null;
    private gl: WebGLRenderingContext | null = null;
    private vxBuffer: WebGLBuffer | null = null;
    private nrmBuffer: WebGLBuffer | null = null;
    private ixBuffer: WebGLBuffer | null = null;
    private shaderProgram: ShaderProgram | null = null;
    private projectionMatrix: mat4 | null = null;
    private cubes: DancingCube3D[] = [];
    private audioData: NormalAudioDataDto;
    private cubeGeometry: CubeGeometry;
    private settings: Dancing3DCubesSetting;
    private time: number = 0;

    constructor() {
        this.audioData = new NormalAudioDataDto([]);
        this.cubeGeometry = this.getCube();
        this.settings = new Dancing3DCubesSetting();
    }

    streamType = streamType.normal;

    private getCube(): CubeGeometry {
        return {
            vertices: [
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
            ],
            indices: [
                0,
                1,
                2,
                0,
                2,
                3, // front
                4,
                5,
                6,
                4,
                6,
                7, // back
                8,
                9,
                10,
                8,
                10,
                11, // top
                12,
                13,
                14,
                12,
                14,
                15, // bottom
                16,
                17,
                18,
                16,
                18,
                19, // right
                20,
                21,
                22,
                20,
                22,
                23, // left
            ],
            normals: [
                // Front
                0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,

                // Back
                0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,

                // Top
                0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,

                // Bottom
                0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,

                // Right
                1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,

                // Left
                -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
            ],
        };
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
            attribute vec4 position;
            attribute vec3 vertexNormal;
            uniform mat4 projectionMatrix;
            uniform vec4 worldPos;
            uniform mat4 modelViewMatrix;
            uniform mat4 normalMatrix;
            varying highp vec3 vLighting;
            varying vec4 vPos;
            void main() {
                vPos = vec4((position.xyz*worldPos.xyz), worldPos.w);
                gl_Position = projectionMatrix*modelViewMatrix*position;

                highp vec3 ambientLight = vec3(0.5, 0.5, 0.5);
                highp vec3 directionalLightColor = vec3(1, 1, 1);
                highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));
                highp vec4 transformedNormal = normalMatrix * vec4(vertexNormal, 1.0);
                highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
                vLighting = ambientLight + (directionalLightColor * directional);
            }
        `;

        const fs = `
            precision mediump float;
            uniform vec3 colorInfluence;
            uniform float cubeAlpha;
            uniform float time;
            varying highp vec3 vLighting;
            varying vec4 vPos;
            void main( void ) {
                // Enhanced color calculation with time-based animation
                float xWave = sin(vPos.x * 0.01 * vPos.w + time * 0.5);
                float yWave = cos(vPos.y * 0.01 * vPos.w + time * 0.3);
                float zWave = sin(vPos.z * 0.01 * vPos.w + 0.34 + time * 0.7);
                
                // More vibrant colors with better mixing
                vec3 clr = vec3(
                    colorInfluence.r * (xWave * 0.5 + 0.5),
                    colorInfluence.g * (yWave * 0.5 + 0.5),
                    colorInfluence.b * (zWave * 0.5 + 0.5)
                );
                
                // Add subtle glow effect based on position
                float glow = 1.0 + sin(vPos.w * 0.1) * 0.2;
                clr *= glow;
                
                gl_FragColor = vec4( vLighting * clr, vPos.w * cubeAlpha );
            }
        `;

        this.shaderProgram = initShaderProgram(gl, vs, fs) as ShaderProgram | null;
        if (!this.shaderProgram) {
            return;
        }

        // Set up uniform and attribute locations
        this.shaderProgram.position = gl.getAttribLocation(this.shaderProgram, 'position');
        this.shaderProgram.vertexNormal = gl.getAttribLocation(this.shaderProgram, 'vertexNormal');
        this.shaderProgram.projectionMatrix = gl.getUniformLocation(this.shaderProgram, 'projectionMatrix');
        this.shaderProgram.modelViewMatrix = gl.getUniformLocation(this.shaderProgram, 'modelViewMatrix');
        this.shaderProgram.normalMatrix = gl.getUniformLocation(this.shaderProgram, 'normalMatrix');
        this.shaderProgram.colorInfluence = gl.getUniformLocation(this.shaderProgram, 'colorInfluence');
        this.shaderProgram.worldPos = gl.getUniformLocation(this.shaderProgram, 'worldPos');
        this.shaderProgram.cubeAlpha = gl.getUniformLocation(this.shaderProgram, 'cubeAlpha');
        this.shaderProgram.time = gl.getUniformLocation(this.shaderProgram, 'time');

        this.initBuffers();
        this.initUniforms();

        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
    }

    private initUniforms(): void {
        if (!this.gl || !this.canvas) return;
        this.projectionMatrix = mat4.create();
        mat4.perspective(
            this.projectionMatrix,
            (45 * Math.PI) / 180,
            this.canvas.clientWidth / this.canvas.clientHeight,
            1,
            1000,
        );
    }

    private initBuffers(): void {
        if (!this.gl) return;
        const gl = this.gl;

        this.vxBuffer = gl.createBuffer();
        this.nrmBuffer = gl.createBuffer();
        this.ixBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vxBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.cubeGeometry.vertices), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.nrmBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.cubeGeometry.normals), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ixBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.cubeGeometry.indices), gl.STATIC_DRAW);
    }

    updateSettings(settings: Dancing3DCubesSetting): void {
        this.settings = settings;
    }

    updateAudioData(data: NormalAudioDataDto): void {
        this.audioData = data;
    }

    render(): void {
        if (!this.canvas || !this.gl || !this.shaderProgram || !this.projectionMatrix) {
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

        // Update projection matrix if canvas size changed
        mat4.perspective(
            this.projectionMatrix,
            (45 * Math.PI) / 180,
            this.canvas.clientWidth / this.canvas.clientHeight,
            1,
            1000,
        );

        gl.useProgram(program);
        gl.uniform1f(program.cubeAlpha, this.settings.cubeAlphaModifier);
        gl.clearColor(this.settings.bgRed, this.settings.bgGreen, this.settings.bgBlue, this.settings.bgAlpha);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.enableVertexAttribArray(program.position);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vxBuffer);
        gl.vertexAttribPointer(program.position, 3, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(program.vertexNormal);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.nrmBuffer);
        gl.vertexAttribPointer(program.vertexNormal, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ixBuffer);

        gl.uniformMatrix4fv(program.projectionMatrix, false, this.projectionMatrix);

        // Update time for animation
        this.time += 0.016; // ~60fps
        if (this.time > 1000) this.time = 0; // Prevent overflow
        gl.uniform1f(program.time, this.time);

        // Initialize cubes if needed
        while (this.cubes.length < this.settings.cubeCount) {
            this.cubes.push(
                new DancingCube3D(
                    Math.random() * this.settings.spaceWidth * 2 - this.settings.spaceWidth,
                    Math.random() * this.settings.spaceHeight * 2 - this.settings.spaceHeight,
                    (Math.random() * (this.settings.spaceZEnd - this.settings.spaceZBegin) +
                        this.settings.spaceZBegin) *
                        -1,
                ),
            );
        }

        // Update and draw cubes
        for (let i = 0; i < this.settings.cubeCount; i++) {
            const sum = i < this.audioData.timeByteArray.length ? this.audioData.timeByteArray[i] : 0;

            this.cubes[i].update(
                sum,
                this.settings.danceSpeed,
                this.settings.width,
                this.settings.height,
                this.settings.directionChangeSpeed,
                this.settings.spaceHeight,
                this.settings.spaceWidth,
                this.settings.spaceZBegin,
                this.settings.spaceZEnd,
                this.settings.spaceZoffset,
            );
            this.cubes[i].draw(
                this.settings.colorStrength,
                this.settings.colorChangeSpeed,
                program,
                this.cubeGeometry.indices.length,
                sum,
                this.settings.textureSinusIntensity,
                gl,
            );
        }
    }

    clean(): void {
        if (!this.canvas || !this.gl) {
            return;
        }

        const gl = this.gl;

        if (this.vxBuffer !== null) {
            gl.deleteBuffer(this.vxBuffer);
        }
        if (this.nrmBuffer !== null) {
            gl.deleteBuffer(this.nrmBuffer);
        }
        if (this.ixBuffer !== null) {
            gl.deleteBuffer(this.ixBuffer);
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
        this.nrmBuffer = null;
        this.ixBuffer = null;
        this.projectionMatrix = null;
    }
}
