import { registerRootComponent } from 'expo';
import { LogBox, View, Text, StyleSheet, Platform } from 'react-native';

console.log('=== ALUGAE MOBILE APP INITIALIZATION ===');
console.log(`Platform: ${Platform.OS} ${Platform.Version}`);
console.log(`Version: 1.0.10`);
console.log(`Timestamp: ${new Date().toISOString()}`);

try {
  console.log('[1/5] Suppressing warnings...');
  LogBox.ignoreAllLogs(true);
  
  console.log('[2/5] Initializing logger service...');
  const loggerService = require('./services/loggerService').default;
  loggerService.info('App boot sequence started', { 
    stage: 'index.js',
    platform: Platform.OS,
    version: '1.0.10'
  });

  console.log('[3/5] Loading App component...');
  const App = require('./App').default;
  
  if (!App) {
    throw new Error('App component is undefined');
  }

  console.log('[4/5] App component loaded successfully');
  loggerService.info('App component loaded', { stage: 'pre-registration' });

  console.log('[5/5] Registering root component...');
  registerRootComponent(App);
  
  console.log('✅ App registered successfully!');
  loggerService.info('App registration completed', { stage: 'registered' });

} catch (error) {
  console.error('❌ FATAL ERROR during app initialization:');
  console.error('Error name:', error?.name);
  console.error('Error message:', error?.message);
  console.error('Error stack:', error?.stack);
  
  // Fallback: register a minimal error component
  const ErrorFallback = () => (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>Erro ao Iniciar</Text>
      <Text style={styles.text}>Ocorreu um erro fatal ao iniciar o aplicativo.</Text>
      <Text style={styles.errorDetails}>{error?.message || error?.toString()}</Text>
      <Text style={styles.hint}>
        Tente fechar e abrir o app novamente.{'\n'}
        Se o problema persistir, reinstale o aplicativo.
      </Text>
    </View>
  );

  const styles = StyleSheet.create({
    container: { 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: '#20B2AA',
      padding: 20
    },
    icon: {
      fontSize: 64,
      marginBottom: 20
    },
    title: {
      color: 'white',
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 10,
      textAlign: 'center'
    },
    text: { 
      color: 'white', 
      fontSize: 16, 
      textAlign: 'center', 
      marginBottom: 15
    },
    errorDetails: { 
      color: '#FFE5E5', 
      fontSize: 12, 
      textAlign: 'center', 
      padding: 10, 
      backgroundColor: 'rgba(0,0,0,0.2)',
      borderRadius: 8,
      marginBottom: 15,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
    },
    hint: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: 14,
      textAlign: 'center',
      fontStyle: 'italic'
    }
  });

  console.log('Registering error fallback component...');
  registerRootComponent(ErrorFallback);
}