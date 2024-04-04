import { Scene } from '@/src/scene/scene';
import { AudioDataDto } from '@/src/utils/eventMessage';
import { bindAudioDataToTexture, initTexture, initShaderProgram } from '@/src/utils/openGl/openGl';

export class DancingHorizon implements Scene {
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

                float waveEffect(vec2 uv, float time)
                {
                    float wave = sin(uv.x + time) * 0.5 + 0.5;
                    return wave * cos(uv.y + time) * 0.5 + 0.5;
                }
                float hash(float n) {
                    return fract(sin(n) * 43758.5453123);
                }
                float starIntensity(vec2 st) {
                    float intensity = 0.0;
                    float pixelSize = 1920.0; 
                    vec2 uv = floor(st * pixelSize) / pixelSize;
                    float seed = hash(uv.x * 4321.0 + uv.y * 6789.0);
                    
                    if (seed > 0.999) {
                        intensity = smoothstep(0.0, 1.0, hash(seed));
                    }
                    return intensity;
                }
                vec3 circle(vec3 backColor, vec3 circleColor, vec2 pos, vec2 uvCoords, float size, float audioValue, float waveValue) {
                    float maxDist = size + audioValue;
                    float dist = distance(uvCoords, pos + waveValue);
                    
                    if (dist < maxDist)
                    {
                        return mix(backColor, circleColor, 1.0 - smoothstep(maxDist - size / 3.0, maxDist, dist));
                    }
                    return backColor;
                }
                vec3 illumination(vec3 color, vec2 pos, vec2 uvCoords, float gain, float dayNightValue) {
                 return (1.0 - smoothstep(0.0, 2.0, distance(uvCoords, pos))) * smoothstep(0.45, 0.55, dayNightValue) * color * gain;
                }

                const float PI = 3.141592653589793;

                float horizonLine = 0.4;
                void main()
                {
                    vec2 fragCoord = gl_FragCoord.xy;
                    // Day/nigth cycle
                    float timeGain = time * 0.1 + PI; 

                    float dayNigthCycle = smoothstep(-1.0, 1.0, sin(timeGain));
                    
                    // Coords
                    vec2 uv = fragCoord/resolution.xy;
                    float pixelSize = 256.0; // Increase for more pixelation
                    //uv = floor(uv * pixelSize) / pixelSize;
                    vec2 centeredCoords = uv * 2.0 - 1.0;
                    
                    // Colors
                    float starValue = starIntensity(uv) * smoothstep(0.6, 0.4, dayNigthCycle);
                    vec3 horizonColor = mix(vec3(0.9, 0.5, 1.0), vec3(1.0, 1.0, 0.0), smoothstep(0.4, 0.6, dayNigthCycle));   
                    vec3 nightSkyColor = mix(vec3(0.051, 0.067, 0.090) * 1.0, vec3(1.0), starValue * smoothstep(horizonLine, horizonLine + 0.1, uv.y));
                    vec3 daySkyColor = vec3(0.255, 0.412, 0.882);
                    vec3 oceanColor = mix(vec3(0.02, 0.05, 0.1) * (2.0 + dayNigthCycle * 3.0), vec3(1.0), starValue * 0.15);
                    vec3 moonColor = vec3(1.0, 0.98, 0.85);
                    vec3 sunColor = vec3(1.0, 0.95, 0.45);   
                    vec3 skyColor = mix(nightSkyColor, daySkyColor, dayNigthCycle);
                    
                    // Audio animation
                    float audioValue = texture2D(audioTexture, vec2(uv.x, 0.0)).x;
                   


                    float wave = waveEffect(centeredCoords * vec2(90.0, 67.0), dayNigthCycle);
                    float reflectWave = waveEffect(centeredCoords * vec2(40.0), dayNigthCycle * 2.0);
                    
                    // Moon
                    float moonSize = 0.15;
                    vec2 moonPos = vec2(-cos(timeGain + PI), sin(timeGain + PI));
                    float diminishMoonGain = 1.0 - smoothstep(0.4, 1.0, moonPos.y) * 0.3;
                    float moonReflectSize = moonSize * diminishMoonGain;
                    moonPos.y += horizonLine - 0.5;
                    vec2 moonReflectPos = moonPos;
                    moonReflectPos.y = -(0.5 - horizonLine) * 4.0 - moonPos.y;
                    moonReflectPos.y *= diminishMoonGain;


                    skyColor = circle(skyColor, moonColor, moonPos, centeredCoords, moonSize, audioValue * 0.05,  wave * 0.012);
                    oceanColor = mix(oceanColor, circle(oceanColor, moonColor, moonReflectPos, centeredCoords, moonReflectSize, audioValue * 0.05,  reflectWave * 0.012), 0.2);


                    // Sun
                    float sunSize = 0.2;
                    vec2 sunPos = vec2(-cos(timeGain) * 1.0, sin(timeGain));
                    float diminishSunGain = 1.0 - smoothstep(0.4, 1.0, sunPos.y) * 0.3;
                    float sunReflectSize = sunSize * diminishSunGain;
                    sunPos.y -= (0.5 - horizonLine) * 2.0;
                    vec2 sunReflectPos = sunPos;
                    sunReflectPos.y = -(0.5 - horizonLine) * 4.0 - sunPos.y;
                    sunReflectPos.y *= diminishSunGain;

                    skyColor = circle(skyColor, sunColor, sunPos, centeredCoords, sunSize, audioValue * 0.05,  wave * 0.012);
                    oceanColor = mix(oceanColor, circle(oceanColor, sunColor, sunReflectPos, centeredCoords, sunReflectSize , audioValue * 0.05,  reflectWave * 0.012), 0.2);
                    
                    // Illumination
                    skyColor += illumination(sunColor, sunPos, centeredCoords, 0.25, dayNigthCycle);
                    oceanColor += illumination(sunColor, sunReflectPos, centeredCoords, 0.25, dayNigthCycle);
                    skyColor += illumination(moonColor, moonPos, centeredCoords, 0.1, 1.0 - dayNigthCycle);
                    oceanColor += illumination(moonColor, moonReflectPos, centeredCoords, 0.1, 1.0 - dayNigthCycle);
                    
                    // Horizon
                    float audioGain = audioValue * 0.2;
                    float horizonCurve = sin(uv.x * PI) * 0.015;
                    float horizonAudio = audioGain + horizonCurve ;
                    float horizonReflectAudio = -audioGain + horizonCurve;
                    vec3 skyBlend = mix(horizonColor, skyColor, smoothstep(horizonLine + horizonCurve, horizonLine*1.01 + horizonCurve, uv.y));
                    vec3 oceanBlend = mix(oceanColor, horizonColor, smoothstep(horizonLine*0.99 + horizonCurve, horizonLine + horizonCurve, uv.y));
                    vec3 color = mix(oceanBlend, skyBlend, smoothstep(horizonLine*0.99 + horizonReflectAudio, horizonLine*1.01 + horizonAudio, uv.y));   

                   
                    // Audio flicker
                    color += audioValue * 0.06 * sin(uv.y * 20.0 + timeGain * 5.9) * horizonColor;


                  gl_FragColor = vec4(color, 1.0);
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
            alert('Unable to initialize the shader program');
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
    updateParams(params: any): void {
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
