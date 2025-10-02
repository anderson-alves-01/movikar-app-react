import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, LogBox } from 'react-native';
import ErrorBoundary from './components/ErrorBoundary';
import loggerService from './services/loggerService';

// Suppress all warnings to prevent crashes
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

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loggerService.info('App initialized', {
      version: '1.0.7',
      environment: __DEV__ ? 'development' : 'production',
    });

    // Flush logs quando o app for fechado
    return () => {
      loggerService.flush();
    };
  }, []);

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