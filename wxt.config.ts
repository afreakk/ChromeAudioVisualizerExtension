import { defineConfig } from 'wxt';

export default defineConfig({
    webExt: {
        startUrls: ['https://hearthis.at/popular/'],
        chromiumArgs: ['--remote-debugging-port=9333'],
    },
    manifest: {
        permissions: ['tabCapture', 'offscreen', 'storage'],
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
