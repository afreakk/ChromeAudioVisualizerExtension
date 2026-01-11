import { defineConfig } from 'wxt';

export default defineConfig({
    runner: {
        startUrls: ['https://hearthis.at/morgenmuffel/joopsradio-rheinwelle-925-morningshow-etc19-yWh/'],
    },
    manifest: {
        permissions: ['tabCapture', 'offscreen'],
        action: {
            default_icon: 'icon/icon256.png',
        },
    },
});
