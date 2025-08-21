import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import biometricService from '../services/biometricService';

export default function BiometricSetupScreen() {
  const navigation = useNavigation();
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      setIsLoading(true);
      const available = await biometricService.isBiometricAvailable();
      const enabled = await biometricService.isBiometricEnabled();
      
      setIsBiometricAvailable(available);
      setIsBiometricEnabled(enabled);
    } catch (error) {
      console.error('Error checking biometric availability:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBiometric = async (value: boolean) => {
    try {
      if (value) {
        // Enable biometric authentication
        const success = await biometricService.enableBiometricAuth();
        if (success) {
          setIsBiometricEnabled(true);
          Alert.alert(
            'Sucesso',
            'Autenticação biométrica ativada com sucesso!'
          );
        } else {
          Alert.alert(
            'Erro',
            'Não foi possível ativar a autenticação biométrica. Verifique se você tem impressões digitais ou Face ID configurados no seu dispositivo.'
          );
        }
      } else {
        // Disable biometric authentication
        Alert.alert(
          'Desativar Autenticação Biométrica',
          'Tem certeza que deseja desativar a autenticação biométrica?',
          [
            {
              text: 'Cancelar',
              style: 'cancel',
            },
            {
              text: 'Desativar',
              style: 'destructive',
              onPress: async () => {
                await biometricService.disableBiometricAuth();
                setIsBiometricEnabled(false);
                Alert.alert(
                  'Sucesso',
                  'Autenticação biométrica desativada.'
                );
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error toggling biometric auth:', error);
      Alert.alert(
        'Erro',
        'Ocorreu um erro ao configurar a autenticação biométrica.'
      );
    }
  };

  const testBiometricAuth = async () => {
    try {
      const success = await biometricService.authenticateWithBiometrics();
      if (success) {
        Alert.alert('Sucesso', 'Autenticação biométrica realizada com sucesso!');
      } else {
        Alert.alert('Falha', 'Falha na autenticação biométrica.');
      }
    } catch (error) {
      console.error('Error testing biometric auth:', error);
      Alert.alert('Erro', 'Erro ao testar autenticação biométrica.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Verificando disponibilidade...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Autenticação Biométrica</Text>
          <Text style={styles.subtitle}>
            Configure a autenticação por impressão digital ou Face ID para maior segurança
          </Text>
        </View>

        {!isBiometricAvailable ? (
          <View style={styles.unavailableContainer}>
            <Text style={styles.unavailableTitle}>Não Disponível</Text>
            <Text style={styles.unavailableText}>
              A autenticação biométrica não está disponível neste dispositivo ou não foi configurada.
            </Text>
            <Text style={styles.unavailableSubtext}>
              Para usar esta funcionalidade, configure a impressão digital ou Face ID nas configurações do seu dispositivo.
            </Text>
          </View>
        ) : (
          <View style={styles.settingsContainer}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Ativar Autenticação Biométrica</Text>
                <Text style={styles.settingDescription}>
                  Use sua impressão digital ou Face ID para fazer login no app
                </Text>
              </View>
              <Switch
                value={isBiometricEnabled}
                onValueChange={handleToggleBiometric}
                trackColor={{ false: '#ccc', true: '#20B2AA' }}
                thumbColor={isBiometricEnabled ? '#fff' : '#f4f3f4'}
              />
            </View>

            {isBiometricEnabled && (
              <TouchableOpacity
                style={styles.testButton}
                onPress={testBiometricAuth}
              >
                <Text style={styles.testButtonText}>Testar Autenticação</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Sobre a Autenticação Biométrica</Text>
          <Text style={styles.infoText}>
            • Seus dados biométricos ficam seguros no seu dispositivo{'\n'}
            • A autenticação é processada localmente{'\n'}
            • Você ainda pode usar sua senha como alternativa{'\n'}
            • Melhora a segurança e conveniência do app
          </Text>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  unavailableContainer: {
    backgroundColor: '#f8f8f8',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
  },
  unavailableTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  unavailableText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 10,
  },
  unavailableSubtext: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
  },
  settingsContainer: {
    marginBottom: 30,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  testButton: {
    backgroundColor: '#20B2AA',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 15,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: '#f8f8f8',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  backButton: {
    backgroundColor: '#eee',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});