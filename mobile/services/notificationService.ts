import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from './authService';

const PUSH_TOKEN_KEY = 'push_token';
const NOTIFICATION_SETTINGS_KEY = 'notification_settings';

export interface NotificationSettings {
  bookingUpdates: boolean;
  messageAlerts: boolean;
  returnReminders: boolean;
  promotions: boolean;
  systemUpdates: boolean;
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  data?: any;
  channelId?: string;
  categoryId?: string;
  badge?: number;
}

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private pushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;

  // Initialize notification service
  async initialize(): Promise<void> {
    try {
      // Set up notification channels for Android
      if (Platform.OS === 'android') {
        await this.setupNotificationChannels();
      }

      // Register for push notifications
      await this.registerForPushNotifications();

      // Set up notification listeners
      this.setupNotificationListeners();

      // Load stored notification settings
      await this.loadNotificationSettings();

      // Send token to backend
      if (this.pushToken) {
        await this.sendTokenToBackend(this.pushToken);
      }
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  }

  // Setup notification channels (Android)
  private async setupNotificationChannels(): Promise<void> {
    try {
      // Booking updates channel
      await Notifications.setNotificationChannelAsync('booking-updates', {
        name: 'Atualizações de Reserva',
        description: 'Notificações sobre suas reservas',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: true,
      });

      // Message alerts channel
      await Notifications.setNotificationChannelAsync('message-alerts', {
        name: 'Alertas de Mensagem',
        description: 'Novas mensagens no chat',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: true,
      });

      // Return reminders channel
      await Notifications.setNotificationChannelAsync('return-reminders', {
        name: 'Lembretes de Devolução',
        description: 'Lembretes para devolver veículos',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: true,
      });

      // Promotions channel
      await Notifications.setNotificationChannelAsync('promotions', {
        name: 'Promoções',
        description: 'Ofertas e promoções especiais',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: true,
      });

      // System updates channel
      await Notifications.setNotificationChannelAsync('system-updates', {
        name: 'Atualizações do Sistema',
        description: 'Informações importantes do sistema',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: true,
      });
    } catch (error) {
      console.error('Error setting up notification channels:', error);
    }
  }

  // Register for push notifications
  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return null;
      }

      // Check if we already have permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permission if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permission not granted');
        return null;
      }

      // Get the push token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // Replace with your actual project ID
      });

      this.pushToken = token.data;
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, this.pushToken);

      return this.pushToken;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  // Setup notification listeners
  private setupNotificationListeners(): void {
    // Listener for notifications received while app is running
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        // Handle notification received while app is active
        this.handleNotificationReceived(notification);
      }
    );

    // Listener for user tapping on notifications
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification response:', response);
        // Handle notification tap
        this.handleNotificationResponse(response);
      }
    );
  }

  // Handle notification received while app is active
  private handleNotificationReceived(notification: Notifications.Notification): void {
    const { title, body, data } = notification.request.content;
    
    // You can customize behavior based on notification type
    if (data?.type === 'message') {
      // Handle message notification
      console.log('New message notification:', { title, body, data });
    } else if (data?.type === 'booking') {
      // Handle booking notification
      console.log('Booking notification:', { title, body, data });
    }
  }

  // Handle notification tap
  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const { data } = response.notification.request.content;
    
    // Navigate based on notification type
    if (data?.type === 'message' && data?.chatId) {
      // Navigate to chat screen
      console.log('Navigate to chat:', data.chatId);
    } else if (data?.type === 'booking' && data?.bookingId) {
      // Navigate to booking details
      console.log('Navigate to booking:', data.bookingId);
    } else if (data?.type === 'vehicle' && data?.vehicleId) {
      // Navigate to vehicle details
      console.log('Navigate to vehicle:', data.vehicleId);
    }
  }

  // Send push token to backend
  async sendTokenToBackend(token: string): Promise<void> {
    try {
      const authToken = authService.getToken();
      if (!authToken) {
        console.warn('User not authenticated, cannot send push token');
        return;
      }

      const response = await fetch('https://alugae.mobi/api/notifications/register-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          platform: Platform.OS,
          deviceInfo: {
            model: Device.modelName,
            osVersion: Device.osVersion,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao registrar token de push');
      }

      console.log('Push token registered successfully');
    } catch (error) {
      console.error('Error sending token to backend:', error);
    }
  }

  // Remove push token from backend
  async removeTokenFromBackend(): Promise<void> {
    try {
      const authToken = authService.getToken();
      if (!authToken || !this.pushToken) {
        return;
      }

      const response = await fetch('https://alugae.mobi/api/notifications/remove-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: this.pushToken,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao remover token de push');
      }

      console.log('Push token removed successfully');
    } catch (error) {
      console.error('Error removing token from backend:', error);
    }
  }

  // Schedule local notification
  async scheduleLocalNotification(
    title: string,
    body: string,
    data: any = {},
    triggerDate?: Date,
    channelId: string = 'default'
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: triggerDate 
          ? { date: triggerDate }
          : null, // null means immediate
        ...(Platform.OS === 'android' && { channelId }),
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      throw error;
    }
  }

  // Cancel local notification
  async cancelLocalNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  // Cancel all local notifications
  async cancelAllLocalNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  // Get notification settings
  async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      const settings = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (settings) {
        return JSON.parse(settings);
      }

      // Default settings
      const defaultSettings: NotificationSettings = {
        bookingUpdates: true,
        messageAlerts: true,
        returnReminders: true,
        promotions: false,
        systemUpdates: true,
      };

      await this.saveNotificationSettings(defaultSettings);
      return defaultSettings;
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return {
        bookingUpdates: true,
        messageAlerts: true,
        returnReminders: true,
        promotions: false,
        systemUpdates: true,
      };
    }
  }

  // Save notification settings
  async saveNotificationSettings(settings: NotificationSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
      
      // Send settings to backend
      const authToken = authService.getToken();
      if (authToken) {
        await fetch('https://alugae.mobi/api/notifications/settings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(settings),
        });
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }

  // Load notification settings
  private async loadNotificationSettings(): Promise<void> {
    try {
      await this.getNotificationSettings();
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }

  // Get badge count
  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  // Set badge count
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  // Clear badge count
  async clearBadgeCount(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Error clearing badge count:', error);
    }
  }

  // Cleanup listeners
  cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  // Get push token
  getPushToken(): string | null {
    return this.pushToken;
  }
}

export default new NotificationService();