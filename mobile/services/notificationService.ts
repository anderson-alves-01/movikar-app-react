import * as Notifications from 'expo-notifications';
// import * as Device from 'expo-device'; // Package not available
import { Platform } from 'react-native';
import apiService from './apiService';

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: boolean;
  priority?: 'low' | 'normal' | 'high' | 'max';
}

export interface BookingNotification extends NotificationData {
  bookingId: number;
  type: 'booking_confirmed' | 'booking_cancelled' | 'payment_due' | 'rental_started' | 'rental_ended' | 'inspection_required';
}

export interface MessageNotification extends NotificationData {
  senderId: number;
  bookingId: number;
  messagePreview: string;
}

// Configure notification behavior with error handling
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (error) {
  console.warn('Could not set notification handler:', error);
}

class NotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;

  async initialize(): Promise<boolean> {
    try {
      console.log('🔔 Initializing notification service...');

      // Request permissions with error handling
      let finalStatus = 'undetermined';
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
      } catch (permError) {
        console.warn('Error requesting notification permissions:', permError);
        return false;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return false;
      }

      // Get push token with error handling
      try {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: 'alugae-mobile-app',
        });
        
        this.expoPushToken = token.data;
        console.log('✅ Expo push token obtained:', token.data);
      } catch (tokenError) {
        console.warn('Could not get push token (non-critical):', tokenError);
        // Continue initialization even without token
      }

      // Configure Android notification channels with error handling
      if (Platform.OS === 'android') {
        try {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#20B2AA',
          });

          // Booking notifications channel
          await Notifications.setNotificationChannelAsync('bookings', {
            name: 'Reservas',
            description: 'Notificações sobre suas reservas',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#20B2AA',
          });

          // Message notifications channel
          await Notifications.setNotificationChannelAsync('messages', {
            name: 'Mensagens',
            description: 'Novas mensagens de chat',
            importance: Notifications.AndroidImportance.DEFAULT,
            vibrationPattern: [0, 250],
            lightColor: '#20B2AA',
          });
          
          console.log('✅ Android notification channels configured');
        } catch (channelError) {
          console.warn('Could not configure notification channels:', channelError);
        }
      }

      // Set up notification listeners
      try {
        this.setupNotificationListeners();
        console.log('✅ Notification listeners set up');
      } catch (listenerError) {
        console.warn('Could not set up notification listeners:', listenerError);
      }

      // Register token with backend
      try {
        await this.registerTokenWithBackend();
      } catch (backendError) {
        console.warn('Could not register token with backend:', backendError);
      }

      console.log('✅ Notification service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Error initializing notification service:', error);
      return false;
    }
  }

  private setupNotificationListeners(): void {
    // Listener for notifications that are received while the app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      this.handleNotificationReceived(notification);
    });

    // Listener for notifications that are tapped/clicked
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      this.handleNotificationResponse(response);
    });
  }

  private async handleNotificationReceived(notification: Notifications.Notification): Promise<void> {
    const { data } = notification.request.content;
    
    // Handle different notification types
    if (data?.type === 'new_message') {
      // Update message badge, refresh chat, etc.
      console.log('New message notification received');
    } else if (data?.type === 'booking_update') {
      // Refresh booking data
      console.log('Booking update notification received');
    }
  }

  private async handleNotificationResponse(response: Notifications.NotificationResponse): Promise<void> {
    const { data } = response.notification.request.content;
    
    // Navigate to appropriate screen based on notification type
    if (data?.type === 'new_message' && data?.bookingId) {
      // Navigate to chat screen for specific booking
      console.log(`Navigate to chat for booking ${data.bookingId}`);
    } else if (data?.type === 'booking_update' && data?.bookingId) {
      // Navigate to booking details
      console.log(`Navigate to booking details for booking ${data.bookingId}`);
    }
  }

  async scheduleLocalNotification(notificationData: NotificationData, triggerSeconds?: number): Promise<string | null> {
    try {
      const notificationConfig: any = {
        content: {
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData.data || {},
          sound: notificationData.sound !== false,
          priority: this.convertPriority(notificationData.priority || 'normal'),
        },
      };
      
      if (triggerSeconds) {
        notificationConfig.trigger = { seconds: triggerSeconds };
      } else {
        notificationConfig.trigger = null;
      }

      const identifier = await Notifications.scheduleNotificationAsync(notificationConfig);
      return identifier;
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      return null;
    }
  }

  async scheduleBookingReminder(
    bookingId: number,
    reminderType: 'pickup' | 'return',
    scheduledTime: Date
  ): Promise<boolean> {
    try {
      const now = new Date();
      const triggerTime = new Date(scheduledTime.getTime() - (30 * 60 * 1000)); // 30 minutes before
      
      if (triggerTime <= now) {
        return false; // Can't schedule in the past
      }

      const title = reminderType === 'pickup' 
        ? 'Lembrete: Retirada do Veículo'
        : 'Lembrete: Devolução do Veículo';
      
      const body = reminderType === 'pickup'
        ? 'Sua reserva está chegando! Prepare-se para retirar o veículo.'
        : 'Não esqueça de devolver o veículo no horário combinado.';

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { 
            type: 'booking_reminder',
            bookingId,
            reminderType 
          },
          sound: true,
        },
        trigger: {
          date: triggerTime,
        } as any,
      });

      return true;
    } catch (error) {
      console.error('Error scheduling booking reminder:', error);
      return false;
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  async clearBadge(): Promise<void> {
    await this.setBadgeCount(0);
  }

  private async registerTokenWithBackend(): Promise<void> {
    try {
      if (!this.expoPushToken) {
        return;
      }

      await apiService.makeRequest('/notifications/register-token', {
        method: 'POST',
        body: JSON.stringify({
          expoPushToken: this.expoPushToken,
          platform: Platform.OS,
        })
      });

      console.log('Push token registered with backend');
    } catch (error) {
      console.error('Error registering token with backend:', error);
    }
  }

  private convertPriority(priority: string): Notifications.AndroidNotificationPriority {
    switch (priority) {
      case 'low':
        return Notifications.AndroidNotificationPriority.LOW;
      case 'high':
        return Notifications.AndroidNotificationPriority.HIGH;
      case 'max':
        return Notifications.AndroidNotificationPriority.MAX;
      default:
        return Notifications.AndroidNotificationPriority.DEFAULT;
    }
  }

  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

export default new NotificationService();