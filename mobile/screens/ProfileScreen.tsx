import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  ddi: string;
  profileImage?: string;
  role: string;
}

interface ProfileOption {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  hasSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
}

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      // Simulate loading user data - replace with real API call
      setTimeout(() => {
        setUser({
          id: 1,
          name: 'Usuário Teste',
          email: 'usuario@teste.com',
          phone: '11999999999',
          ddi: '+55',
          role: 'user',
          profileImage: undefined,
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement logout
            Alert.alert('Em Desenvolvimento', 'Funcionalidade de logout será implementada em breve');
          }
        }
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert('Em Desenvolvimento', 'Edição de perfil será implementada em breve');
  };

  const handleChangePassword = () => {
    Alert.alert('Em Desenvolvimento', 'Alteração de senha será implementada em breve');
  };

  const handleMyVehicles = () => {
    Alert.alert('Em Desenvolvimento', 'Gerenciamento de veículos será implementado em breve');
  };

  const handlePaymentMethods = () => {
    Alert.alert('Em Desenvolvimento', 'Métodos de pagamento serão implementados em breve');
  };

  const handleSupport = () => {
    Alert.alert('Em Desenvolvimento', 'Suporte será implementado em breve');
  };

  const handlePrivacyPolicy = () => {
    Alert.alert('Em Desenvolvimento', 'Política de privacidade será implementada em breve');
  };

  const handleTermsOfService = () => {
    Alert.alert('Em Desenvolvimento', 'Termos de serviço serão implementados em breve');
  };

  const handleAccountDeletion = () => {
    Alert.alert(
      'Exclusão de Conta',
      'Deseja solicitar a exclusão permanente da sua conta e dados?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Solicitar Exclusão',
          style: 'destructive',
          onPress: () => {
            // For mobile, we'll show instructions to send email
            Alert.alert(
              'Enviar Solicitação',
              'Para solicitar a exclusão da sua conta, envie um email para:\n\nprivacidade@alugae.mobi\n\nIncluindo seu nome, email cadastrado e CPF.',
              [{ text: 'Entendi', style: 'default' }]
            );
          }
        }
      ]
    );
  };

  const profileOptions: ProfileOption[] = [
    {
      icon: 'person-outline',
      title: 'Editar Perfil',
      subtitle: 'Nome, foto, informações pessoais',
      onPress: handleEditProfile,
    },
    {
      icon: 'lock-closed-outline',
      title: 'Alterar Senha',
      subtitle: 'Mantenha sua conta segura',
      onPress: handleChangePassword,
    },
    {
      icon: 'car-sport-outline',
      title: 'Meus Veículos',
      subtitle: 'Gerenciar veículos cadastrados',
      onPress: handleMyVehicles,
    },
    {
      icon: 'card-outline',
      title: 'Métodos de Pagamento',
      subtitle: 'Cartões e formas de pagamento',
      onPress: handlePaymentMethods,
    },
    {
      icon: 'notifications-outline',
      title: 'Notificações',
      subtitle: 'Receber alertas sobre reservas',
      onPress: () => {},
      hasSwitch: true,
      switchValue: notificationsEnabled,
      onSwitchChange: setNotificationsEnabled,
    },
    {
      icon: 'location-outline',
      title: 'Localização',
      subtitle: 'Permitir acesso à localização',
      onPress: () => {},
      hasSwitch: true,
      switchValue: locationEnabled,
      onSwitchChange: setLocationEnabled,
    },
    {
      icon: 'help-circle-outline',
      title: 'Suporte',
      subtitle: 'Central de ajuda e contato',
      onPress: handleSupport,
    },
    {
      icon: 'shield-outline',
      title: 'Política de Privacidade',
      onPress: handlePrivacyPolicy,
    },
    {
      icon: 'document-text-outline',
      title: 'Termos de Serviço',
      onPress: handleTermsOfService,
    },
    {
      icon: 'trash-outline',
      title: 'Exclusão de Conta',
      subtitle: 'Solicitar exclusão permanente dos dados',
      onPress: handleAccountDeletion,
    },
  ];

  const renderProfileOption = (option: ProfileOption, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.optionItem}
      onPress={option.onPress}
      disabled={option.hasSwitch}
    >
      <View style={styles.optionLeft}>
        <View style={styles.optionIcon}>
          <Ionicons name={option.icon} size={24} color="#20B2AA" />
        </View>
        <View style={styles.optionText}>
          <Text style={styles.optionTitle}>{option.title}</Text>
          {option.subtitle && (
            <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
          )}
        </View>
      </View>
      <View style={styles.optionRight}>
        {option.hasSwitch ? (
          <Switch
            value={option.switchValue}
            onValueChange={option.onSwitchChange}
            trackColor={{ false: '#ccc', true: '#20B2AA' }}
            thumbColor="#fff"
          />
        ) : (
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#20B2AA" />
          <Text style={styles.loadingText}>Carregando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* User Profile Header */}
        {user && (
          <View style={styles.profileHeader}>
            <View style={styles.profileImageContainer}>
              {user.profileImage ? (
                <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
              ) : (
                <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                  <Ionicons name="person-outline" size={40} color="#666" />
                </View>
              )}
              <TouchableOpacity style={styles.editImageButton} onPress={handleEditProfile}>
                <Ionicons name="camera-outline" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.userPhone}>
                {user.ddi} {user.phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}
              </Text>
            </View>

            <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
              <Ionicons name="pencil-outline" size={16} color="#20B2AA" />
              <Text style={styles.editProfileText}>Editar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Profile Options */}
        <View style={styles.optionsContainer}>
          {profileOptions.map((option, index) => renderProfileOption(option, index))}
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>alugae</Text>
          <Text style={styles.appVersion}>Versão 1.0.0</Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FF6347" />
          <Text style={styles.logoutText}>Sair da Conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileImagePlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#20B2AA',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 15,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  userPhone: {
    fontSize: 16,
    color: '#666',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#20B2AA',
  },
  editProfileText: {
    color: '#20B2AA',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  optionsContainer: {
    backgroundColor: '#fff',
    marginTop: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  optionRight: {
    marginLeft: 10,
  },
  appInfo: {
    alignItems: 'center',
    padding: 20,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#20B2AA',
    marginBottom: 5,
  },
  appVersion: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  logoutText: {
    color: '#FF6347',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});