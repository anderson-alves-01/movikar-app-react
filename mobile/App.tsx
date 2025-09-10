import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, LogBox, Platform } from 'react-native';

// Critical: Ignore ALL warnings that could cause crashes on iOS
LogBox.ignoreAllLogs(true);

// Type definitions for safety
type ScreenComponent = React.ComponentType<any>;
type ServiceComponent = {
  isAuthenticated?: () => boolean;
  initialize?: () => Promise<void>;
  getCurrentUser?: () => any;
  connect?: () => Promise<void>;
};

// Fallback Screen Component for iOS stability - define early
const FallbackScreen: React.FC<{ title?: string }> = ({ title = 'Loading...' }) => (
  <View style={styles.loadingContainer}>
    <Text style={styles.loadingText}>{title}</Text>
    <Text style={styles.errorMessage}>
      Em desenvolvimento. Funcionalidade será adicionada em breve.
    </Text>
  </View>
);

// Screens - Import with error boundaries
let HomeScreen: ScreenComponent = FallbackScreen;
let SearchScreen: ScreenComponent = FallbackScreen;
let BookingsScreen: ScreenComponent = FallbackScreen;
let ProfileScreen: ScreenComponent = FallbackScreen;
let VehicleDetailScreen: ScreenComponent = FallbackScreen;
let LoginScreen: ScreenComponent = FallbackScreen;
let ChatScreen: ScreenComponent = FallbackScreen;
let BiometricSetupScreen: ScreenComponent = FallbackScreen;

try {
  HomeScreen = require('./screens/HomeScreen').default;
  SearchScreen = require('./screens/SearchScreen').default;
  BookingsScreen = require('./screens/BookingsScreen').default;
  ProfileScreen = require('./screens/ProfileScreen').default;
  VehicleDetailScreen = require('./screens/VehicleDetailScreen').default;
  LoginScreen = require('./screens/LoginScreen').default;
  ChatScreen = require('./screens/ChatScreen').default;
  BiometricSetupScreen = require('./screens/BiometricSetupScreen').default;
} catch (error) {
  console.warn('Error loading screens:', error);
  // Fallback screens will be created below
}

// Services - Import with error handling
let authService: ServiceComponent = {
  isAuthenticated: () => false,
  initialize: () => Promise.resolve(),
  getCurrentUser: () => null
};

let notificationService: ServiceComponent = {
  initialize: () => Promise.resolve()
};

let chatService: ServiceComponent = {
  connect: () => Promise.resolve()
};

try {
  const auth = require('./services/authService').default;
  if (auth) authService = auth;
} catch (error) {
  console.warn('AuthService not available:', error);
}

try {
  const notification = require('./services/notificationService').default;
  if (notification) notificationService = notification;
} catch (error) {
  console.warn('NotificationService not available:', error);
}

try {
  const chat = require('./services/chatService').default;
  if (chat) chatService = chat;
} catch (error) {
  console.warn('ChatService not available:', error);
}

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Tab Navigator
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Bookings') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'home-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#20B2AA',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#20B2AA',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Início' }}
      />
      <Tab.Screen 
        name="Search" 
        component={SearchScreen} 
        options={{ title: 'Buscar' }}
      />
      <Tab.Screen 
        name="Bookings" 
        component={BookingsScreen} 
        options={{ title: 'Reservas' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}

// Main Stack Navigator
function AppNavigator({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <Stack.Navigator 
      initialRouteName="Main"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#20B2AA',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Main" 
        component={TabNavigator} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="VehicleDetail" 
        component={VehicleDetailScreen} 
        options={{ title: 'Detalhes do Veículo' }}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen} 
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Algo deu errado</Text>
          <Text style={styles.errorMessage}>
            Ocorreu um erro inesperado. Por favor, reinicie o aplicativo.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    // Ultra-safe initialization for iOS stability
    try {
      // Set a timeout to prevent infinite loading
      const initTimeout = setTimeout(() => {
        console.warn('Initialization timeout - continuing without services');
        setIsLoading(false);
        // Allow access even without authentication
        setIsAuthenticated(false);
      }, 3000);

      // Skip ALL async service initialization that could crash
      // Just check basic auth state synchronously for background functionality
      let authenticated = false;
      try {
        if (authService && typeof authService.isAuthenticated === 'function') {
          authenticated = authService.isAuthenticated();
        }
      } catch (error) {
        console.warn('Auth check failed:', error);
        authenticated = false;
      }

      // Clear timeout and set state
      clearTimeout(initTimeout);
      setIsAuthenticated(authenticated);
      setIsLoading(false);

      // Initialize services in background after app is running
      setTimeout(() => {
        initializeServicesInBackground();
      }, 1000);
    } catch (error) {
      console.warn('App initialization error:', error);
      // Always continue with basic functionality - allow navigation without auth
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  const initializeServicesInBackground = async () => {
    // Background initialization - never crash the app
    try {
      if (authService && typeof authService.initialize === 'function') {
        await authService.initialize();
      }
    } catch (error) {
      console.warn('Background auth init failed:', error);
    }

    try {
      if (notificationService && typeof notificationService.initialize === 'function') {
        await notificationService.initialize();
      }
    } catch (error) {
      console.warn('Background notification init failed:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Erro de Inicialização</Text>
        <Text style={styles.errorMessage}>
          Não foi possível inicializar o aplicativo. Tente novamente.
        </Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <NavigationContainer>
          <AppNavigator isAuthenticated={isAuthenticated} />
          <StatusBar style="light" backgroundColor="#20B2AA" />
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#20B2AA',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});