import { ISceneSetting } from '@/src/scene/sceneSetting';

export class SeventiesSceneSetting implements ISceneSetting {
    // Circle Spawning
    public spawnThreshold: number = 50000.0;          // Volume threshold to spawn new circles (lowered for more responsiveness)
    public crowdSuppression: number = 0.001;          // How existing circles suppress new spawns
    public circleResolution: number = 15;              // Number of circles per spawn (layered effect)
    public targetSize: number = 50;                   // Target size for circles before fading
    
    // Movement & Animation
    public fadeSpeed: number = 0.5;                   // How fast circles fade out
    public speedMusicScale: number = 10;               // Base speed multiplier
    public speedReducer: number = 3000;                // Speed reduction factor (balanced for visibility)
    public expansionSpeed: number = 1.5;               // How fast circles expand (moderate responsiveness)
    public hueRotationSpeed: number = 1.5;             // How fast colors rotate (moderate responsiveness)
    public volumeSensitivity: number = 1.0;           // Volume sensitivity multiplier (1.0 = normal)
    
    // Visual Appearance
    public circleScale: number = 15;                   // Overall circle scale (unused in original, kept for compatibility)
    public lineWidth: number = 4;                      // Stroke width of circles
    public saturation: number = 100;                   // Color saturation (0-100)
    public lightness: number = 50;                     // Color lightness (0-100)
    public enableFill: boolean = false;                 // Enable filled circles (enhancement)
    public fillOpacity: number = 0.2;                  // Fill opacity multiplier (enhancement)
    
    // Circle Creation
    public initialRadiusStep: number = 2;              // Initial radius step between layered circles
    public targetSizeVariation: number = 10;           // Variation in target size (enhancement)
    public hueStep: number = 10;                       // Hue step between layered circles
    public hueVariation: number = 20;                  // Random hue variation (enhancement)
    public spreadAmount: number = 0;                   // Random spread of circle positions (enhancement)
    public opacitySteps: number = 20;                  // Steps for opacity calculation
    
    // Effects
    public enableTrails: boolean = false;              // Enable motion trails (enhancement)
    public trailOpacity: number = 0.1;                // Trail fade opacity (enhancement)
}

