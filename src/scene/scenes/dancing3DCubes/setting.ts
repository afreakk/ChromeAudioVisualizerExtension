import { ISceneSetting } from '@/src/scene/sceneSetting';

export class Dancing3DCubesSetting implements ISceneSetting {
    // Movement & Animation
    public danceSpeed: number = 0.006;              // How fast cubes move based on audio
    public directionChangeSpeed: number = 0.158;     // How quickly direction changes
    public colorChangeSpeed: number = 0.0101;        // Speed of color transitions
    
    // Cube Properties
    public cubeCount: number = 15;                   // Number of dancing cubes
    public width: number = 0.04;                     // Cube width scaling
    public height: number = 0.04;                    // Cube height scaling
    public cubeAlphaModifier: number = 0.1;         // Cube transparency
    
    // Colors
    public colorStrength: number = 1.01;             // Color intensity
    public textureSinusIntensity: number = 0.05;     // Color wave intensity
    
    // Space Boundaries (wrapping boundaries)
    public spaceHeight: number = 100;                // Vertical space limit
    public spaceWidth: number = 100;                 // Horizontal space limit
    public spaceZBegin: number = 100;                // Near Z boundary
    public spaceZEnd: number = 500;                  // Far Z boundary
    public spaceZoffset: number = 0;                 // Z offset (unused in original)
    
    // Background
    public bgRed: number = 0.8;
    public bgGreen: number = 0.3;
    public bgBlue: number = 0.4;
    public bgAlpha: number = 0.4;
}

