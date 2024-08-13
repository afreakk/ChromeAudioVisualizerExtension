function keyGenerator(name: string): string {
    return `audio-visualizer-settings-${name}`;
}

let x = {};
export function loadSettings<T>(settingsName: string): T | null {
    const settingsJson = x[settingsName];
    if (settingsJson === undefined) {
        return null;
    }
    return JSON.parse(settingsJson) as T;
}
export function saveSettings<T>(settingsName: string, settings: T): void {
    x[settingsName] = JSON.stringify(settings);
    // localStorage.setItem(keyGenerator(settingsName), JSON.stringify(settings));
}
export function checkClassType<T>(
    object: any,
    constructor: { new (...args: any[]): T }
): object is T {
    return object instanceof constructor;
}
