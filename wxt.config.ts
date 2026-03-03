import { defineConfig } from 'wxt';

export default defineConfig({
    webExt: {
        startUrls: ['https://hearthis.at/popular/'],
    },
    manifest: {
        permissions: ['tabCapture', 'offscreen'],
        action: {
            default_icon: 'icon/icon256.png',
        },
    },
    vite: () => ({
        server: {
            cors: true,
        },
    }),
});
