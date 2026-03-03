import { SettingsUserInterface } from '@/src/userInterface/settings/settingsUserInterface';

document.body.style.backgroundColor = 'black';
const settingsUserInterface = new SettingsUserInterface(true);
settingsUserInterface.buildScene();
