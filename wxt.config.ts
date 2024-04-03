import { defineConfig } from 'wxt';

export default defineConfig({
    manifest: {
        permissions: ["tabCapture", "offscreen", "tabs", "activeTab"],
        action: {
            default_icon: "wxt.svg"
        }
    },
});
