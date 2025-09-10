import { registerRootComponent } from 'expo';
import { LogBox } from 'react-native';

import App from './App';

// Ignore warnings for stability
LogBox.ignoreAllLogs(true);

// Register the app
registerRootComponent(App);