import { registerRootComponent } from 'expo';
import { AppRegistry, LogBox } from 'react-native';

import App from './App';

// Ignore specific warnings that can cause crashes
LogBox.ignoreLogs([
  'Warning: TNodeChildrenRenderer:',
  'Warning: MemoizedTNodeRenderer:',
  'Warning: TRenderEngineProvider:',
  'RCTBridge required dispatch_sync to load',
  'Setting a timer for a long period',
  'VirtualizedLists should never be nested',
  'componentWillReceiveProps has been renamed',
  'componentWillMount has been renamed',
]);

// Disable warnings in production
if (__DEV__) {
  console.disableYellowBox = true;
}

// Handle global errors gracefully
const originalHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error, isFatal) => {
  if (__DEV__) {
    console.warn('Global error caught:', error);
  }
  
  // Prevent app crashes from non-critical errors
  if (!isFatal) {
    return;
  }
  
  originalHandler(error, isFatal);
});

// Register the app with proper error handling
try {
  registerRootComponent(App);
} catch (error) {
  console.error('Failed to register root component:', error);
  // Fallback registration
  AppRegistry.registerComponent('main', () => App);
}