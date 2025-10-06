import { registerRootComponent } from 'expo';
import { LogBox, View, Text, StyleSheet } from 'react-native';

try {
  // Suppress warnings FIRST
  LogBox.ignoreAllLogs(true);

  // Initialize logger BEFORE anything else to capture early crashes
  const loggerService = require('./services/loggerService').default;
  console.log('=== ALUGAE v1.0.10 STARTING (JSC, Stable Arch) ===');
  loggerService.info('App boot sequence started', { stage: 'index.js' });

  const App = require('./App').default;

  loggerService.info('App boot sequence completed', { stage: 'pre-registration' });

  // Register the app
  registerRootComponent(App);
} catch (error) {
  console.error('FATAL: Failed to initialize app', error);
  
  // Fallback: register a minimal error component
  const ErrorFallback = () => (
    <View style={styles.container}>
      <Text style={styles.text}>Ocorreu um erro fatal ao iniciar o aplicativo.</Text>
      <Text style={styles.errorDetails}>{error?.toString()}</Text>
    </View>
  );

  const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#20B2AA' },
    text: { color: 'white', fontSize: 16, textAlign: 'center', padding: 20, fontWeight: 'bold' },
    errorDetails: { color: '#FFE5E5', fontSize: 12, textAlign: 'center', padding: 10, marginTop: 10 }
  });

  registerRootComponent(ErrorFallback);
}