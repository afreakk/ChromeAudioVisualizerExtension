import { messageAction } from './eventMessage';

const STORAGE_PREFIX = 'audio-visualizer-settings-';

function keyGenerator(name: string): string {
    return `${STORAGE_PREFIX}${name}`;
}

export { STORAGE_PREFIX };

const settingsCache: Record<string, string> = {};

const isSandboxed = window.parent !== window;

/** Bulk-populate the in-memory cache (used by sandbox on init). */
export function populateSettingsCache(entries: Record<string, string>): void {
    for (const [key, value] of Object.entries(entries)) {
        settingsCache[key] = value;
    }
}

export function loadSettings<T>(settingsName: string): T | null {
    const cached = settingsCache[settingsName];
    if (cached !== undefined) {
        return JSON.parse(cached) as T;
    }
    if (isSandboxed) {
        return null;
    }
    const stored = localStorage.getItem(keyGenerator(settingsName));
    if (stored !== null) {
        settingsCache[settingsName] = stored;
        return JSON.parse(stored) as T;
    }
    return null;
}
export function updateCacheEntry(key: string, value: string | null): void {
    if (value === null) {
        delete settingsCache[key];
    } else {
        settingsCache[key] = value;
    }
}

export function saveSettings<T>(settingsName: string, settings: T): void {
    const json = JSON.stringify(settings);
    settingsCache[settingsName] = json;
    if (!isSandboxed) {
        localStorage.setItem(keyGenerator(settingsName), json);
    } else {
        // In sandbox: relay save to animation window (parent) which has localStorage
        window.parent.postMessage({ action: messageAction.saveSettings, key: settingsName, value: json }, '*');
    }
}
