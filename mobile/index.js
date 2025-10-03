import { registerRootComponent } from 'expo';
import { LogBox } from 'react-native';

// Suppress warnings FIRST
LogBox.ignoreAllLogs(true);

// Simple console logging (no external services during boot)
console.log('=== ALUGAE v1.0.9 STARTING (JSC Engine) ===');

import App from './App';

// Register the app
registerRootComponent(App);