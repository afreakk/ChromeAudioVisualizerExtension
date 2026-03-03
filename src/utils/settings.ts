function keyGenerator(name: string): string {
    return `audio-visualizer-settings-${name}`;
}

const settingsCache: Record<string, string> = {};

function isLocalStorageAvailable(): boolean {
    try {
        localStorage; // Access check — throws in sandboxed iframes
        return true;
    } catch {
        return false;
    }
}

export function loadSettings<T>(settingsName: string): T | null {
    const cached = settingsCache[settingsName];
    if (cached !== undefined) {
        return JSON.parse(cached) as T;
    }
    if (!isLocalStorageAvailable()) {
        return null;
    }
    const stored = localStorage.getItem(keyGenerator(settingsName));
    if (stored !== null) {
        settingsCache[settingsName] = stored;
        return JSON.parse(stored) as T;
    }
    return null;
}
export function saveSettings<T>(settingsName: string, settings: T): void {
    const json = JSON.stringify(settings);
    settingsCache[settingsName] = json;
    if (isLocalStorageAvailable()) {
        localStorage.setItem(keyGenerator(settingsName), json);
    }
}
