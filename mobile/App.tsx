import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, LogBox } from 'react-native';

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
  'Require cycle:',
  'Remote debugger',
]);

// Screens
import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import BookingsScreen from './screens/BookingsScreen';
import ProfileScreen from './screens/ProfileScreen';
import VehicleDetailScreen from './screens/VehicleDetailScreen';
import LoginScreen from './screens/LoginScreen';
import ChatScreen from './screens/ChatScreen';
import BiometricSetupScreen from './screens/BiometricSetupScreen';

// Services
import authService from './services/authService';
import notificationService from './services/notificationService';
import chatService from './services/chatService';

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
      initialRouteName={isAuthenticated ? "Main" : "Login"}
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
    try {
      // Initialize services with comprehensive error handling and fallbacks
      let authInitialized = false;
      try {
        await authService.initialize();
        authInitialized = true;
      } catch (authError) {
        console.warn('Auth service initialization failed:', authError);
        // Continue without auth, user can login later
      }

      try {
        await notificationService.initialize();
      } catch (notifError) {
        console.warn('Notification service initialization failed:', notifError);
        // Continue without notifications
      }

      // Skip chat service initialization to prevent crashes
      // This service requires network connection and can fail on startup
      // try {
      //   if (chatService && typeof (chatService as any).connect === 'function') {
      //     await (chatService as any).connect();
      //   }
      // } catch (chatError) {
      //   console.warn('Chat service initialization failed:', chatError);
      // }

      // Check authentication status only if auth was initialized
      if (authInitialized) {
        try {
          const authenticated = authService.isAuthenticated();
          setIsAuthenticated(authenticated);
        } catch (authCheckError) {
          console.warn('Auth check failed:', authCheckError);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Critical error initializing app:', error);
      // Don't set error state, just continue with basic functionality
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
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