import { SettingsUserInterface } from '@/src/userInterface/settings/settingsUserInterface';
import { captureSource } from '@/src/utils/eventMessage';

document.body.style.backgroundColor = 'black';
const sourceParam = new URLSearchParams(location.search).get('source');
const initialSource = sourceParam === captureSource.microphone ? captureSource.microphone : captureSource.tab;
const settingsUserInterface = new SettingsUserInterface(true, initialSource);
settingsUserInterface.buildScene();

// Forward messages targeted at settings as local CustomEvents (e.g. preset cycle notifications)
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'butterchurn-preset-cycled') {
        window.dispatchEvent(new CustomEvent('butterchurn-preset-cycled', { detail: message.preset }));
    }
});
