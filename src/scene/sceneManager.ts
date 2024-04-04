import { Scene } from '@/src/scene/scene';
import { AudioDataDto } from "@/src/utils/eventMessage";

export class SceneManager {
    private scene: Scene | null = null;
    private buildingScene = false;

    constructor(scene: Scene) {
        this.setScene(scene);
    }
    updateAudioData(data: AudioDataDto) {
        // Return if there is no scene 
        if (!this.scene) {
            return;
        }
        // Return if the scene is still being built
        if (this.buildingScene) {
            return;
        }
        this.scene.updateAudioData(data);
    }

    setScene(scene: Scene) {
        let newScene = scene;
        this.buildingScene = true;
        try {
            newScene.build();
            // Clean up the current scene if there is one
            if (this.scene) {
                this.scene.clean();
            }
            // Set the new scene
            this.scene = newScene;
        }
        catch (error) {
            console.error("Error building scene:", error);
        }
        finally {
            this.buildingScene = false;
        }
    }

    renderScene() {
        if (!this.scene) {
            // Return if there is no scene 
            return;
        }
        // Return if the scene is still being built
        if (this.buildingScene) {
            return;
        }
        this.scene.render();
    }
}

