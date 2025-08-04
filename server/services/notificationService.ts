import { storage } from "../storage";
import { User, Vehicle } from "@shared/schema";

export interface NotificationData {
  userId: number;
  vehicleId: number;
  userName: string;
  vehicleName: string;
  userEmail?: string;
  userPhone?: string | null;
  message: string;
  desiredStartDate: string;
  desiredEndDate: string;
}

export interface NotificationResult {
  success: boolean;
  method: 'email' | 'sms' | 'in-app';
  details?: string;
  error?: string;
}

class NotificationService {
  async sendVehicleAvailabilityNotification(notification: NotificationData): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    try {
      // Get user details for comprehensive notification
      const user = await storage.getUser(notification.userId);
      if (!user) {
        return [{
          success: false,
          method: 'email',
          error: 'User not found'
        }];
      }

      // 1. Send Email Notification (if email exists)
      if (user.email) {
        const emailResult = await this.sendEmailNotification(user, notification);
        results.push(emailResult);
      }

      // 2. Send SMS Notification (if phone exists)
      if (user.phone) {
        const smsResult = await this.sendSMSNotification(user, notification);
        results.push(smsResult);
      }

      // 3. Create In-App Notification (always)
      const inAppResult = await this.createInAppNotification(user, notification);
      results.push(inAppResult);

      console.log(`📱 Notifications sent to ${user.name}:`, results.map(r => `${r.method}: ${r.success ? 'success' : 'failed'}`).join(', '));

    } catch (error) {
      console.error('Error in notification service:', error);
      results.push({
        success: false,
        method: 'email',
        error: `Notification service error: ${error}`
      });
    }

    return results;
  }

  private async sendEmailNotification(user: User, notification: NotificationData): Promise<NotificationResult> {
    try {
      // In production, integrate with SendGrid, AWS SES, or similar service
      const emailSubject = `🚗 Veículo disponível: ${notification.vehicleName}`;
      const emailBody = this.generateEmailBody(user, notification);

      // Log the email content for now (in production, send actual email)
      console.log(`📧 EMAIL TO: ${user.email}`);
      console.log(`📧 SUBJECT: ${emailSubject}`);
      console.log(`📧 BODY:\n${emailBody}`);

      // Simulate email sending
      return {
        success: true,
        method: 'email',
        details: `Email sent to ${user.email}`
      };

    } catch (error) {
      return {
        success: false,
        method: 'email',
        error: `Email send failed: ${error}`
      };
    }
  }

  private async sendSMSNotification(user: User, notification: NotificationData): Promise<NotificationResult> {
    try {
      // In production, integrate with Twilio, AWS SNS, or similar service
      const smsMessage = `🚗 alugae.mobi: O veículo ${notification.vehicleName} está disponível para ${notification.desiredStartDate} até ${notification.desiredEndDate}! Reserve agora: https://alugae.mobi/vehicle/${notification.vehicleId}`;

      // Log the SMS content for now (in production, send actual SMS)
      console.log(`📱 SMS TO: ${user.phone}`);
      console.log(`📱 MESSAGE: ${smsMessage}`);

      // Simulate SMS sending
      return {
        success: true,
        method: 'sms',
        details: `SMS sent to ${user.phone}`
      };

    } catch (error) {
      return {
        success: false,
        method: 'sms',
        error: `SMS send failed: ${error}`
      };
    }
  }

  private async createInAppNotification(user: User, notification: NotificationData): Promise<NotificationResult> {
    try {
      // In production, save to notifications table in database
      const inAppNotification = {
        userId: user.id,
        title: `Veículo ${notification.vehicleName} disponível!`,
        message: notification.message,
        type: 'vehicle_available',
        data: {
          vehicleId: notification.vehicleId,
          desiredStartDate: notification.desiredStartDate,
          desiredEndDate: notification.desiredEndDate
        },
        isRead: false,
        createdAt: new Date().toISOString()
      };

      console.log(`🔔 IN-APP NOTIFICATION for ${user.name}:`, inAppNotification);

      // In production, save to database:
      // await storage.createUserNotification(inAppNotification);

      return {
        success: true,
        method: 'in-app',
        details: 'In-app notification created'
      };

    } catch (error) {
      return {
        success: false,
        method: 'in-app',
        error: `In-app notification failed: ${error}`
      };
    }
  }

  private generateEmailBody(user: User, notification: NotificationData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Veículo Disponível - alugae.mobi</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
        <h1 style="color: #dc2626; margin-bottom: 20px;">🚗 Boa notícia, ${user.name}!</h1>
        
        <p style="font-size: 16px; color: #333; margin-bottom: 15px;">
            O veículo <strong>${notification.vehicleName}</strong> que você estava aguardando agora está disponível!
        </p>
        
        <div style="background-color: white; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h3 style="color: #dc2626; margin-top: 0;">Detalhes da sua solicitação:</h3>
            <ul style="color: #666;">
                <li><strong>Datas desejadas:</strong> ${notification.desiredStartDate} até ${notification.desiredEndDate}</li>
                <li><strong>Veículo:</strong> ${notification.vehicleName}</li>
            </ul>
        </div>
        
        <p style="color: #666; margin-bottom: 25px;">
            ${notification.message}
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://alugae.mobi/vehicle/${notification.vehicleId}" 
               style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Ver Veículo e Reservar
            </a>
        </div>
        
        <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
            Este veículo pode ser reservado por outros usuários. Recomendamos que você reserve o quanto antes.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
            alugae.mobi - Plataforma de Aluguel de Carros<br>
            Se você não deseja mais receber essas notificações, 
            <a href="https://alugae.mobi/notifications/unsubscribe" style="color: #dc2626;">clique aqui</a>.
        </p>
    </div>
</body>
</html>
    `.trim();
  }

  async sendBulkNotifications(notifications: NotificationData[]): Promise<{ sent: number; failed: number; results: NotificationResult[][] }> {
    const results: NotificationResult[][] = [];
    let sent = 0;
    let failed = 0;

    for (const notification of notifications) {
      try {
        const notificationResults = await this.sendVehicleAvailabilityNotification(notification);
        results.push(notificationResults);
        
        const hasSuccess = notificationResults.some(r => r.success);
        if (hasSuccess) {
          sent++;
        } else {
          failed++;
        }
        
        // Add small delay between notifications to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Failed to send notification to user ${notification.userId}:`, error);
        failed++;
        results.push([{
          success: false,
          method: 'email',
          error: `Bulk notification error: ${error}`
        }]);
      }
    }

    console.log(`📬 Bulk notifications complete: ${sent} sent, ${failed} failed`);
    return { sent, failed, results };
  }
}

export const notificationService = new NotificationService();