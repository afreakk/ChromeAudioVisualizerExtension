import { SettingsUserInterface } from '@/src/userInterface/settings/settingsUserInterface';
import { captureSource, messageTarget } from '@/src/utils/eventMessage';
import { STORAGE_PREFIX, updateCacheEntry } from '@/src/utils/settings';

document.body.style.backgroundColor = 'black';
const sourceParam = new URLSearchParams(location.search).get('source');
const initialSource = sourceParam === captureSource.microphone ? captureSource.microphone : captureSource.tab;
const settingsUserInterface = new SettingsUserInterface(true, initialSource);
settingsUserInterface.buildScene();

// Forward messages targeted at settings as local CustomEvents (e.g. preset cycle notifications).
// Guard on target so the 60fps audio broadcast (target 'animation') early-returns cheaply.
chrome.runtime.onMessage.addListener((message) => {
    if (message?.target !== messageTarget.settings) return;
    if (message.action === 'butterchurn-preset-cycled') {
        window.dispatchEvent(new CustomEvent('butterchurn-preset-cycled', { detail: message.preset }));
    }
});

// This popup keeps its own in-memory settingsCache. When the animation window (or
// any other extension page) writes to the shared extension-origin localStorage, a
// `storage` event fires here — refresh the cache and rebuild the scene selector so
// custom presets / settings stay in sync live. Replaces the old iframe relay.
window.addEventListener('storage', (e) => {
    if (!e.key?.startsWith(STORAGE_PREFIX)) return;
    const settingsName = e.key.slice(STORAGE_PREFIX.length);
    updateCacheEntry(settingsName, e.newValue);
    if (settingsName === 'customPresets') {
        settingsUserInterface.onPresetsChanged();
    }
});
