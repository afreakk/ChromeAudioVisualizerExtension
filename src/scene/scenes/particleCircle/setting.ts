import type { ISceneSetting } from '@/src/scene/sceneSetting';

export class ParticleCircleSetting implements ISceneSetting {
    // Color Settings
    public colorStrength: number = 0.75; // Base color intensity
    public colorOffset: number = Math.PI; // Color phase offset
    public colorWidth: number = 0.1; // Color transition speed
    public colorBoost: number = 0.3; // Color intensity boost (enhancement)
    public colorAnimationSpeed: number = 0.05; // Time-based color animation speed (enhancement)

    // Spectrum Settings
    public spectrumJumps: number = 1; // How many frequency bins to jump
    public musicColorInfluenceReducer: number = 33000; // How much audio affects color change
    public musicScale: number = 1.01; // Audio scale multiplier for particle position

    // Geometry Settings
    public innerRadiusDivisor: number = 1000; // Inner radius (canvas size / this value)
    public particleWidth: number = 0.06; // Base particle size multiplier
    public circleMax: number = Math.PI * 2; // Maximum circle angle (full 360 degrees)
    public sizeMultiplier: number = 0.5; // Additional size multiplier (enhancement)

    // Performance
    public maxParticles: number = 256; // Maximum number of particles to draw

    // Visual Enhancements
    public enableRotation: boolean = false; // Enable spinning effect
    public rotationSpeed: number = 0.01; // Rotation speed (radians per frame)
    public enableGlow: boolean = true; // Enable glow effect on particles
    public glowIntensity: number = 10; // Glow blur intensity
    public glowThreshold: number = 2; // Minimum size to show glow
    public enableStroke: boolean = false; // Enable particle outline
    public strokeWidth: number = 1; // Stroke width
    public enableTrails: boolean = false; // Enable motion trails
    public trailOpacity: number = 0.1; // Trail fade opacity
    public showCenterCircle: boolean = true; // Show center circle
    public centerCircleOpacity: number = 0.1; // Center circle opacity
    public maxParticleSize: number = 20; // Maximum particle size for glow calculation
}
