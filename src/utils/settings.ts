function keyGenerator(name: string): string {
    return `audio-visualizer-settings-${name}`;
}

export function loadSettings<T>(settingsName: string): T | null {
    const settingsJson = localStorage.getItem(keyGenerator(settingsName));
    if (settingsJson === null) {
        return null;
    }
    return JSON.parse(settingsJson) as T;
}
export function saveSettings<T>(settingsName: string, settings: T): void {
    localStorage.setItem(keyGenerator(settingsName), JSON.stringify(settings));
}
export function checkClassType<T>(object: any, constructor: { new(...args: any[]): T }): object is T {
    return object instanceof constructor;
}
