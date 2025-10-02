import { registerRootComponent } from 'expo';
import { LogBox } from 'react-native';

// Initialize logger BEFORE anything else to capture early crashes
import loggerService from './services/loggerService';

// Log app boot
console.log('=== ALUGAE MOBILE APP STARTING ===');
loggerService.info('App boot sequence started', { stage: 'index.js' });

import App from './App';

// Ignore warnings for stability
LogBox.ignoreAllLogs(true);

// Log successful boot
loggerService.info('App boot sequence completed', { stage: 'pre-registration' });

// Register the app
registerRootComponent(App);