import { defineConfig } from 'wxt';

export default defineConfig({
    webExt: {
        startUrls: ['https://hearthis.at/popular/'],
        chromiumArgs: ['--remote-debugging-port=9333'],
    },
    manifest: {
        permissions: ['tabCapture', 'offscreen'],
        // butterchurn 3.x compiles Milkdrop equations to WASM (eel-wasm), which needs
        // 'wasm-unsafe-eval'. WXT 0.20.x already defaults extension pages to this; we
        // pin it explicitly so the visualizer can render scenes directly in the
        // animation window (no sandboxed iframe). The prod build emits no `sandbox`
        // key once the sandbox entrypoint is gone.
        content_security_policy: {
            extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'",
        },
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
