const STORAGE_PREFIX = 'audio-visualizer-settings-';

function keyGenerator(name: string): string {
    return `${STORAGE_PREFIX}${name}`;
}

export { STORAGE_PREFIX };

// In-memory mirror of persisted settings. All settings consumers are now
// same-origin extension pages with direct localStorage access; cross-window
// freshness is kept by `storage`-event listeners that call updateCacheEntry().
const settingsCache: Record<string, string> = {};

function parseSettingValue<T>(settingsName: string, raw: string): T | null {
    try {
        return JSON.parse(raw) as T;
    } catch (error) {
        delete settingsCache[settingsName];
        localStorage.removeItem(keyGenerator(settingsName));
        console.warn(`Failed to parse stored setting "${settingsName}"; falling back to default`, error);
        return null;
    }
}

export function loadSettings<T>(settingsName: string): T | null {
    const cached = settingsCache[settingsName];
    if (cached !== undefined) {
        return parseSettingValue<T>(settingsName, cached);
    }
    const stored = localStorage.getItem(keyGenerator(settingsName));
    if (stored !== null) {
        settingsCache[settingsName] = stored;
        return parseSettingValue<T>(settingsName, stored);
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
    localStorage.setItem(keyGenerator(settingsName), json);
}
