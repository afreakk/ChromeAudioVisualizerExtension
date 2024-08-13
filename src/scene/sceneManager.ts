import { IScene } from '@/src/scene/scene';
import { ISceneSetting } from '@/src/scene/sceneSetting';
import {
    IAudioDataDto,
    StartStreamEvent,
    messageAction,
    messageTarget,
    streamType,
} from '@/src/utils/eventMessage';

export class SceneManager {
    private scene: IScene | null = null;
    private buildingScene = false;

    updateAudioData(data: IAudioDataDto) {
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
    updateSettings(settings: ISceneSetting) {
        // Return if there is no scene
        if (!this.scene) {
            return;
        }
        // Return if the scene is still being built
        if (this.buildingScene) {
            return;
        }
        this.scene.updateSettings(settings);
    }

    setScene(scene: IScene, settings: ISceneSetting) {
        // Return if the scene is already set
        if (this.scene instanceof scene.constructor) {
            return;
        }

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
        } catch (error) {
            console.error('Error building scene:', error);
        } finally {
            const animationWindowCreated = new StartStreamEvent(
                messageTarget.offscreen,
                messageAction.startStream,
                this.scene ? this.scene.streamType : streamType.normal
            );
            window.sandboxEventMessageHolder.source.postMessage(
                animationWindowCreated.toMessage(),
                window.sandboxEventMessageHolder.origin
            );
            this.buildingScene = false;
            this.updateSettings(settings);
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
