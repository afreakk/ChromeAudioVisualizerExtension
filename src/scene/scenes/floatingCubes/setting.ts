import { ISceneSetting } from '@/src/scene/sceneSetting';

export class FloatingCubesSetting implements ISceneSetting {
    // Cubes
    public cubeCount: number = 100;
    public cubeSize: number = 25;
    public borderWidth: number = 2;

    // Movement
    public danceSpeed: number = 0.05;
    public directionChangeSpeed: number = 0.05;

    // Colors
    public colorSpeed: number = 0.05;
    public colorStrength: number = 0.75;
    public borderColor: string = '#1a1a1a';

    // Background
    public backgroundColor: string = '#000000';
    public trailOpacity: number = 0.95;

    // Effects
    public audioSensitivity: number = 1.0;
    public glowIntensity: number = 0.3;
}
