function keyGenerator(name: string): string {
    return `audio-visualizer-settings-${name}`;
}

const settingsCache: Record<string, string> = {};
export function loadSettings<T>(settingsName: string): T | null {
    const cached = settingsCache[settingsName];
    if (cached !== undefined) {
        return JSON.parse(cached) as T;
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
    localStorage.setItem(keyGenerator(settingsName), json);
}
