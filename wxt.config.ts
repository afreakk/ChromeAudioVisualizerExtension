import { defineConfig } from 'wxt';

export default defineConfig({
    webExt: {
        startUrls: ['https://hearthis.at/popular/'],
        chromiumArgs: ['--remote-debugging-port=9333'],
    },
    manifest: {
        permissions: ['tabCapture', 'offscreen'],
        action: {
            default_icon: 'icon/icon256.png',
        },
        // Shortcut for the toolbar action (fires action.onClicked). Users can rebind it at
        // chrome://extensions/shortcuts. On macOS plain Ctrl becomes ⌘, and ⌘Q quits the browser.
        commands: {
            _execute_action: {
                suggested_key: { default: 'Ctrl+Q', mac: 'MacCtrl+Q' },
            },
        },
    },
    vite: () => ({
        server: {
            cors: true,
        },
    }),
});
