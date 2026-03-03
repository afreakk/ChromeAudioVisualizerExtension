import type { IScene } from '@/src/scene/scene';
import type { DancingHorizonSetting } from '@/src/scene/scenes/dancingHorizon/setting';
import { createFullscreenWebGLCanvas } from '@/src/utils/canvas';
import { NormalAudioDataDto, streamType } from '@/src/utils/eventMessage';
import { hexToRGBNormalized } from '@/src/utils/openGl/colorConverter';
import { bindAudioDataToTexture, initShaderProgram, initTexture } from '@/src/utils/openGl/openGl';

export class DancingHorizon implements IScene {
    private canvas: HTMLCanvasElement | null = null;
    private gl: WebGLRenderingContext | null = null;
    private audioTexture: WebGLTexture | null = null;
    private audioTextureUniformLocation: WebGLUniformLocation | null = null;
    private resolutionUniformLocation: WebGLUniformLocation | null = null;
    private horizonColorNightUniformLocation: WebGLUniformLocation | null = null;
    private horizonColorDayUniformLocation: WebGLUniformLocation | null = null;
    private skyColorNightUniformLocation: WebGLUniformLocation | null = null;
    private skyColorDayUniformLocation: WebGLUniformLocation | null = null;
    private oceanColorNightUniformLocation: WebGLUniformLocation | null = null;
    private oceanColorDayUniformLocation: WebGLUniformLocation | null = null;
    private moonColorUniformLocation: WebGLUniformLocation | null = null;
    private sunColorUniformLocation: WebGLUniformLocation | null = null;
    private timeGainUniformLocation: WebGLUniformLocation | null = null;
    private noiseGainUniformLocation: WebGLUniformLocation | null = null;
    private cloudGainUniformLocation: WebGLUniformLocation | null = null;
    private cloudDensityUniformLocation: WebGLUniformLocation | null = null;
    private timeUniformLocation: WebGLUniformLocation | null = null;
    private vertexBuffer: WebGLBuffer | null = null;
    private shaderProgram: WebGLProgram | null = null;
    private audioData: NormalAudioDataDto;
    constructor() {
        this.audioData = new NormalAudioDataDto([]);
    }
    streamType = streamType.normal;
    build(): void {
        const { canvas, gl } = createFullscreenWebGLCanvas();
        this.canvas = canvas;
        this.gl = gl;
        if (!this.gl) {
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
                uniform vec3 horizonColorNight;
                uniform vec3 horizonColorDay;
                uniform vec3 skyColorNight;
                uniform vec3 skyColorDay;
                uniform vec3 oceanColorNight;
                uniform vec3 oceanColorDay;
                uniform vec3 moonColor;
                uniform vec3 sunColor;
                uniform float timeGain;
                uniform float noiseGain;
                uniform float cloudGain;
                uniform float cloudDensity;
                uniform sampler2D audioTexture;

                float rand(vec2 co) {
                    return fract(fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453));
                }

                float interpolate(float a, float b, float x) {
                    return mix(a, b, smoothstep(0.0, 1.0, x));
                }

                float valueNoise(vec2 p) {
                    vec2 i = floor(p);
                    vec2 f = fract(p);

                    float a = rand(i);
                    float b = rand(i + vec2(1.0, 0.0));
                    float c = rand(i + vec2(0.0, 1.0));
                    float d = rand(i + vec2(1.0, 1.0));

                    // Interpolate along x
                    float ab = interpolate(a, b, f.x);
                    float cd = interpolate(c, d, f.x);

                    // Interpolate along y
                    return interpolate(ab, cd, f.y);
                }

                float fbm(vec2 position) {
                    float total = 0.0;
                    float persistence = 0.5;
                    float frequency = 1.0;
                    float amplitude = 1.0;

                    for (int i = 0; i < 4; i++) {
                        total += valueNoise(position * frequency) * amplitude;
                        frequency *= 2.0;
                        amplitude *= persistence;
                    }

                    return clamp(total, 0.0, 1.0);
                }
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
                    float timeGainer = time * timeGain; 

                    float dayNigthCycle = smoothstep(-1.0, 1.0, sin(timeGainer));
                    
                    // Coords
                    vec2 uv = fragCoord/resolution.xy;
                    float pixelSize = 256.0; // Increase for more pixelation
                    //uv = floor(uv * pixelSize) / pixelSize;
                    vec2 centeredCoords = uv * 2.0 - 1.0;
                    
                    // Colors
                    float dayNightValue = smoothstep(0.4, 0.6, dayNigthCycle);
                    float starValue = starIntensity(uv);
                    vec3 nightSkyColor = mix(skyColorNight, vec3(1.0), starValue * smoothstep(horizonLine, horizonLine + 0.1, uv.y));
                    vec3 colorOceanNigth = mix(oceanColorNight, vec3(1.0), starValue * 0.15);

                    vec3 colorMoon = moonColor;
                    vec3 colorSun = sunColor;
                    vec3 skyColor = mix(nightSkyColor, skyColorDay, dayNigthCycle);
                    vec3 oceanColor  = mix(colorOceanNigth, oceanColorDay, dayNigthCycle);
                    vec3 horizonColor = mix(horizonColorNight, horizonColorDay, dayNightValue);   
                    
                    // Audio animation
                    float audioValue = texture2D(audioTexture, vec2(uv.x, 0.0)).x;
                   


                    float wave = waveEffect(centeredCoords * vec2(90.0, 67.0), dayNigthCycle);
                    float reflectWave = waveEffect(centeredCoords * vec2(40.0), dayNigthCycle * 2.0);
                    
                    // Moon
                    float moonSize = 0.15;
                    vec2 moonPos = vec2(-cos(timeGainer + PI), sin(timeGainer + PI));
                    float diminishMoonGain = 1.0 - smoothstep(0.4, 1.0, moonPos.y) * 0.3;
                    float moonReflectSize = moonSize * diminishMoonGain;
                    moonPos.y += horizonLine - 0.5;
                    vec2 moonReflectPos = moonPos;
                    moonReflectPos.y = -(0.5 - horizonLine) * 4.0 - moonPos.y;
                    moonReflectPos.y *= diminishMoonGain;


                    skyColor = circle(skyColor, colorMoon, moonPos, centeredCoords, moonSize, audioValue * 0.05,  wave * 0.012);
                    oceanColor = mix(oceanColor, circle(oceanColor, colorMoon, moonReflectPos, centeredCoords, moonReflectSize, audioValue * 0.05,  reflectWave * 0.012), 0.2);


                    // Sun
                    float sunSize = 0.2;
                    vec2 sunPos = vec2(-cos(timeGainer) * 1.0, sin(timeGainer));
                    float diminishSunGain = 1.0 - smoothstep(0.4, 1.0, sunPos.y) * 0.3;
                    float sunReflectSize = sunSize * diminishSunGain;
                    sunPos.y -= (0.5 - horizonLine) * 2.0;
                    vec2 sunReflectPos = sunPos;
                    sunReflectPos.y = -(0.5 - horizonLine) * 4.0 - sunPos.y;
                    sunReflectPos.y *= diminishSunGain;

                    skyColor = circle(skyColor, colorSun, sunPos, centeredCoords, sunSize, audioValue * 0.05,  wave * 0.012);
                    oceanColor = mix(oceanColor, circle(oceanColor, colorSun, sunReflectPos, centeredCoords, sunReflectSize , audioValue * 0.05,  reflectWave * 0.012), 0.2);
                    
                    // Illumination
                    skyColor += illumination(colorSun, sunPos, centeredCoords, 0.25, dayNigthCycle);
                    oceanColor += illumination(colorSun, sunReflectPos, centeredCoords, 0.25, dayNigthCycle);
                    skyColor += illumination(colorMoon, moonPos, centeredCoords, 0.15, 1.0 - dayNigthCycle);
                    oceanColor += illumination(colorMoon, moonReflectPos, centeredCoords, 0.15, 1.0 - dayNigthCycle);


                    // Clouds
                    vec2 pos = fragCoord/resolution.xy;
                    pos.x += time * 0.03;
                    pos.y = pos.y * 2.0 + time * 0.01;
                    float n = fbm(pos * cloudDensity); 
                    skyColor = mix(skyColor, vec3(1.0), n * cloudGain);
                    oceanColor = mix(oceanColor, vec3(1.0), n * cloudGain * 0.33);
                    
                    // Horizon
                    float audioGain = audioValue * 0.2;
                    float horizonCurve = sin(uv.x * PI) * 0.015;
                    float horizonAudio = audioGain + horizonCurve ;
                    float horizonReflectAudio = -audioGain + horizonCurve;
                    vec3 skyBlend = mix(horizonColor, skyColor, smoothstep(horizonLine + horizonCurve, horizonLine*1.01 + horizonCurve, uv.y));
                    vec3 oceanBlend = mix(oceanColor, horizonColor, smoothstep(horizonLine*0.99 + horizonCurve, horizonLine + horizonCurve, uv.y));
                    vec3 color = mix(oceanBlend, skyBlend, smoothstep(horizonLine*0.99 + horizonReflectAudio, horizonLine*1.01 + horizonAudio, uv.y));   

                   
                    // Audio flicker
                    color = mix(color, horizonColor, audioValue * sin(uv.y * 2.0 + timeGainer * 10.0) * noiseGain * 0.5);

                    gl_FragColor = vec4(color, 1.0);
                }
            `;

        // Vertex data for a square
        const vertices = new Float32Array([-1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, -1.0]);
        this.vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

        this.audioTexture = initTexture(this.gl);

        this.shaderProgram = initShaderProgram(this.gl, vs, fs);
        if (!this.shaderProgram) {
            console.error('DancingHorizon: Unable to initialize the shader program');
            return;
        }

        this.gl.useProgram(this.shaderProgram);

        this.audioTextureUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'audioTexture');
        const position = this.gl.getAttribLocation(this.shaderProgram, 'vertexPosition');
        this.gl.vertexAttribPointer(position, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(position);
        this.resolutionUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'resolution');
        this.timeUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'time');
        this.horizonColorNightUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'horizonColorNight');
        this.horizonColorDayUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'horizonColorDay');
        this.skyColorNightUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'skyColorNight');
        this.skyColorDayUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'skyColorDay');
        this.oceanColorNightUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'oceanColorNight');
        this.oceanColorDayUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'oceanColorDay');
        this.moonColorUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'moonColor');
        this.sunColorUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'sunColor');
        this.timeGainUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'timeGain');
        this.noiseGainUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'noiseGain');
        this.cloudGainUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'cloudGain');
        this.cloudDensityUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'cloudDensity');
    }
    updateSettings(settings: DancingHorizonSetting): void {
        if (!this.gl) {
            return;
        }
        this.gl.useProgram(this.shaderProgram);

        this.gl.uniform1f(this.noiseGainUniformLocation, settings.noiseGain);
        this.gl.uniform1f(this.timeGainUniformLocation, settings.timeGain);
        this.gl.uniform1f(this.cloudGainUniformLocation, settings.cloudGain);
        this.gl.uniform1f(this.cloudDensityUniformLocation, settings.cloudDensity);

        // Colors
        const horizonColorNight = hexToRGBNormalized(settings.horizonColorNight);
        this.gl.uniform3fv(this.horizonColorNightUniformLocation, horizonColorNight);
        const horizonColorDay = hexToRGBNormalized(settings.horizonColorDay);
        this.gl.uniform3fv(this.horizonColorDayUniformLocation, horizonColorDay);
        const skyColorNight = hexToRGBNormalized(settings.skyColorNight);
        this.gl.uniform3fv(this.skyColorNightUniformLocation, skyColorNight);
        const skyColorDay = hexToRGBNormalized(settings.skyColorDay);
        this.gl.uniform3fv(this.skyColorDayUniformLocation, skyColorDay);
        const oceanColorNight = hexToRGBNormalized(settings.oceanColorNight);
        this.gl.uniform3fv(this.oceanColorNightUniformLocation, oceanColorNight);
        const oceanColorDay = hexToRGBNormalized(settings.oceanColorDay);
        this.gl.uniform3fv(this.oceanColorDayUniformLocation, oceanColorDay);
        const moonColor = hexToRGBNormalized(settings.moonColor);
        this.gl.uniform3fv(this.moonColorUniformLocation, moonColor);
        const sunColor = hexToRGBNormalized(settings.sunColor);
        this.gl.uniform3fv(this.sunColorUniformLocation, sunColor);
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
        // Update canvas size and viewport
        if (this.canvas.width !== window.innerWidth || this.canvas.height !== window.innerHeight) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
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
        this.canvas = null;
        this.gl = null;
        this.shaderProgram = null;
        this.vertexBuffer = null;
        this.audioTexture = null;
        this.audioTextureUniformLocation = null;
        this.resolutionUniformLocation = null;
        this.horizonColorNightUniformLocation = null;
        this.horizonColorDayUniformLocation = null;
        this.skyColorNightUniformLocation = null;
        this.skyColorDayUniformLocation = null;
        this.oceanColorNightUniformLocation = null;
        this.oceanColorDayUniformLocation = null;
        this.moonColorUniformLocation = null;
        this.sunColorUniformLocation = null;
        this.timeGainUniformLocation = null;
        this.noiseGainUniformLocation = null;
        this.cloudGainUniformLocation = null;
        this.cloudDensityUniformLocation = null;
        this.timeUniformLocation = null;
    }
}
