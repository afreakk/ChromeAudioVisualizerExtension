import { SettingsUserInterface } from '@/src/userInterface/settings/settingsUserInterface';

document.body.style.backgroundColor = 'black';
const settingsUserInterface = new SettingsUserInterface(true);
settingsUserInterface.buildScene();

// Forward messages targeted at settings as local CustomEvents (e.g. preset cycle notifications)
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'butterchurn-preset-cycled') {
        window.dispatchEvent(new CustomEvent('butterchurn-preset-cycled', { detail: message.preset }));
    }
});
