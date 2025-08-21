// import * as LocalAuthentication from 'expo-local-authentication';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// Temporary service until dependencies are resolved
class BiometricService {
  private isEnabled = false;

  async isBiometricAvailable(): Promise<boolean> {
    try {
      // const hasHardware = await LocalAuthentication.hasHardwareAsync();
      // const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      // return hasHardware && isEnrolled;
      return false; // Placeholder
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  }

  async authenticateWithBiometrics(): Promise<boolean> {
    try {
      if (!(await this.isBiometricAvailable())) {
        return false;
      }

      // const result = await LocalAuthentication.authenticateAsync({
      //   promptMessage: 'Autentique-se para acessar o app',
      //   fallbackLabel: 'Usar senha',
      //   cancelLabel: 'Cancelar',
      // });

      // return result.success;
      return false; // Placeholder
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  }

  async enableBiometricAuth(): Promise<boolean> {
    try {
      if (!(await this.isBiometricAvailable())) {
        return false;
      }

      const isAuthenticated = await this.authenticateWithBiometrics();
      if (isAuthenticated) {
        // await AsyncStorage.setItem('biometric_enabled', 'true');
        this.isEnabled = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error enabling biometric auth:', error);
      return false;
    }
  }

  async disableBiometricAuth(): Promise<void> {
    try {
      // await AsyncStorage.removeItem('biometric_enabled');
      this.isEnabled = false;
    } catch (error) {
      console.error('Error disabling biometric auth:', error);
    }
  }

  async isBiometricEnabled(): Promise<boolean> {
    try {
      // const enabled = await AsyncStorage.getItem('biometric_enabled');
      // return enabled === 'true';
      return this.isEnabled; // Placeholder
    } catch (error) {
      console.error('Error checking biometric enabled status:', error);
      return false;
    }
  }
}

export default new BiometricService();