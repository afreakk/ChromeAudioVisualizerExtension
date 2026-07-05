import type { IScene } from '@/src/scene/scene';
import type { ISceneSetting } from '@/src/scene/sceneSetting';
import {
    type IAudioDataDto,
    messageAction,
    messageTarget,
    StartStreamEvent,
    streamType,
} from '@/src/utils/eventMessage';

export class SceneManager {
    private scene: IScene | null = null;
    private buildingScene = false;
    private bufferedAudioData: IAudioDataDto | null = null;

    updateAudioData(data: IAudioDataDto) {
        // Return if there is no scene
        if (!this.scene) {
            return;
        }
        // Buffer audio data during scene transitions so the first render uses fresh data
        if (this.buildingScene) {
            this.bufferedAudioData = data;
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
        const newScene = scene;
        this.buildingScene = true;
        try {
            // Clean up the current scene first to free WebGL context
            // before building the new one (avoids hitting browser context limit)
            if (this.scene) {
                this.scene.clean();
                this.scene = null;
            }
            newScene.build();
            // Set the new scene
            this.scene = newScene;
            // Apply settings only if non-empty (avoid overwriting defaults with {})
            if (settings && Object.keys(settings).length > 0) {
                this.scene.updateSettings(settings);
            }
        } catch (_error) {
            console.error('Failed to build scene:', _error);
        } finally {
            const animationWindowCreated = new StartStreamEvent(
                messageTarget.offscreen,
                messageAction.startStream,
                this.scene ? this.scene.streamType : streamType.normal,
            );
            try {
                chrome.runtime.sendMessage(animationWindowCreated.toMessage());
            } catch (_e) {
                // Receiving end (offscreen) may not exist yet
            }
            this.buildingScene = false;
            // Apply buffered audio data so the first render uses fresh data
            if (this.bufferedAudioData && this.scene) {
                this.scene.updateAudioData(this.bufferedAudioData);
                this.bufferedAudioData = null;
            }
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
