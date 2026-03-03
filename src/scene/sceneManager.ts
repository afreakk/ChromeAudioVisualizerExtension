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
    private latencyStats = {
        count: 0,
        total: 0,
        min: Infinity,
        max: -Infinity,
    };

    updateAudioData(data: IAudioDataDto) {
        // Return if there is no scene
        if (!this.scene) {
            return;
        }
        // Return if the scene is still being built
        if (this.buildingScene) {
            return;
        }

        // Measure latency if timestamp is available
        if (data.timestamp !== undefined) {
            const now = Date.now(); // Use Date.now() for cross-context synchronization
            const latency = now - data.timestamp;

            // Update stats
            this.latencyStats.count++;
            this.latencyStats.total += latency;
            this.latencyStats.min = Math.min(this.latencyStats.min, latency);
            this.latencyStats.max = Math.max(this.latencyStats.max, latency);

            // Reset stats every 60 frames
            if (this.latencyStats.count % 60 === 0) {
                this.latencyStats = {
                    count: 0,
                    total: 0,
                    min: Infinity,
                    max: -Infinity,
                };
            }
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

        const newScene = scene;
        this.buildingScene = true;
        try {
            newScene.build();
            // Clean up the current scene if there is one
            if (this.scene) {
                this.scene.clean();
            }
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
            if (window.sandboxEventMessageHolder?.source) {
                window.sandboxEventMessageHolder.source.postMessage(animationWindowCreated.toMessage(), {
                    targetOrigin: window.sandboxEventMessageHolder.origin,
                });
            }
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
