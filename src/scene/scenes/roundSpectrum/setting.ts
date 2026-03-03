import type { ISceneSetting } from '@/src/scene/sceneSetting';

export class RoundSpectrumSetting implements ISceneSetting {
    // Color Settings
    public colorStrength: number = 1.2; // Base color intensity (increased for fewer bars)
    public colorOffset: number = Math.PI; // Color phase offset
    public colorWidth: number = 0.6; // Color transition speed (adjusted for 50 bars)
    public colorBoost: number = 0.4; // Color intensity boost (enhancement)
    public colorAnimationSpeed: number = 0.03; // Time-based color animation speed (slower for smoother)

    // Spectrum Settings
    public spectrumJumps: number = 1; // How many frequency bins to jump
    public musicColorInfluenceReducer: number = 100; // How much audio affects color change
    public musicHeightPower: number = 0.01; // How much audio affects bar height
    public heightMultiplier: number = 0.5; // Additional height multiplier (enhancement)
    public maxBars: number = 50; // Maximum number of bars to draw (performance)
    public barSkip: number = 1; // Skip every N bars (performance optimization)

    // Geometry Settings
    public innerRadiusDivisor: number = 10; // Inner radius (canvas size / this value)
    public staticWidth: number = 1.0; // Base bar width
    public circleMax: number = Math.PI * 2; // Maximum circle angle (full 360 degrees)

    // Visual Enhancements
    public enableRotation: boolean = false; // Enable spinning effect
    public rotationSpeed: number = 0.01; // Rotation speed (radians per frame)
    public enableGlow: boolean = true; // Enable glow effect on bars
    public glowIntensity: number = 15; // Glow blur intensity
    public glowThreshold: number = 50; // Minimum audio value to show glow
    public enableTrails: boolean = false; // Enable motion trails
    public trailOpacity: number = 0.1; // Trail fade opacity
    public showCenterCircle: boolean = true; // Show center circle
    public centerCircleOpacity: number = 0.1; // Center circle opacity
}
