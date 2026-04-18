import { sceneNames } from '@/src/scene/sceneNames';
import type { ISceneSetting } from '@/src/scene/sceneSetting';
import { loadSettings, saveSettings } from './settings';

const CUSTOM_PREFIX = 'custom:';
const PRESETS_KEY = 'customPresets';

export type PresetMap = Record<string, { baseScene: string; settings: ISceneSetting }>;

export function isCustomPreset(key: string): boolean {
    return key.startsWith(CUSTOM_PREFIX);
}

export function customPresetName(key: string): string {
    return key.slice(CUSTOM_PREFIX.length);
}

export function customPresetKey(name: string): string {
    return `${CUSTOM_PREFIX}${name}`;
}

export function loadAllPresets(): PresetMap {
    const raw = loadSettings<PresetMap>(PRESETS_KEY) ?? {};
    const validScenes = new Set(Object.values(sceneNames) as string[]);
    const cleaned: PresetMap = {};
    let dropped = 0;

    for (const [name, preset] of Object.entries(raw)) {
        if (
            !preset ||
            typeof preset !== 'object' ||
            typeof preset.baseScene !== 'string' ||
            !preset.settings
        ) {
            dropped++;
            continue;
        }

        if (!validScenes.has(preset.baseScene)) {
            console.warn(`Preset "${name}" references missing scene "${preset.baseScene}"; dropping`);
            dropped++;
            continue;
        }

        cleaned[name] = preset;
    }

    if (dropped > 0) {
        saveSettings(PRESETS_KEY, cleaned);
    }

    return cleaned;
}

export function savePreset(name: string, baseScene: string, settings: ISceneSetting): void {
    const presets = loadAllPresets();
    presets[name] = { baseScene, settings: JSON.parse(JSON.stringify(settings)) };
    saveSettings(PRESETS_KEY, presets);
}

export function deletePreset(name: string): void {
    const presets = loadAllPresets();
    delete presets[name];
    saveSettings(PRESETS_KEY, presets);
}
