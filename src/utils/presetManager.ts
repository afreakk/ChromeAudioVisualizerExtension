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
    return loadSettings<PresetMap>(PRESETS_KEY) ?? {};
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
