import { defineConfig } from 'wxt';

export default defineConfig({
    runner: {
        startUrls: ['https://soundcloud.com/ferzrrn/sets/synthwave'],
    },
    manifest: {
        permissions: ['tabCapture', 'offscreen'],
        action: {
            default_icon: 'icon/icon256.png',
        },
    },
});
