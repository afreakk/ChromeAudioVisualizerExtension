function keyGenerator(name: string): string {
    return `audio-visualizer-settings-${name}`;
}

export function loadSettings<T>(settingsName: string): T {
    const settingsJson = localStorage.getItem(keyGenerator(settingsName));
    if (settingsJson === null) {
        throw new Error(`Settings not found: ${settingsName}`);
    }
    return JSON.parse(settingsJson) as T;
}
export function saveSettings<T>(settingsName: string, settings: T): void {
    localStorage.setItem(keyGenerator(settingsName), JSON.stringify(settings));
}
