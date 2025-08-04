import { storage } from "../storage";
import { notificationService, NotificationData } from "./notificationService";

export interface ReleaseResult {
  releasedCount: number;
  notifiedCount: number;
  notifications: Array<{
    userId: number;
    vehicleId: number;
    userName: string;
    vehicleName: string;
    message: string;
  }>;
}

export class VehicleReleaseService {
  async releaseExpiredVehicles(): Promise<ReleaseResult> {
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log(`🚗 Checking for expired vehicle blocks as of ${today}`);

      // Get all vehicle availability blocks
      const allBlocks = await storage.getVehicleAvailability(0); // Get all blocks
      
      // Filter expired blocks
      const expiredBlocks = allBlocks.filter(block => 
        !block.isAvailable && 
        block.endDate < today &&
        block.reason?.includes('Reservado - Booking')
      );

      console.log(`Found ${expiredBlocks.length} expired blocks to release`);

      const notifications: ReleaseResult['notifications'] = [];
      let releasedCount = 0;

      // Process each expired block
      for (const block of expiredBlocks) {
        try {
          // Remove the expired block
          await storage.removeVehicleAvailability(block.id);
          releasedCount++;

          // Get waiting queue for this vehicle
          const waitingQueue = await storage.getWaitingQueue(block.vehicleId);

          // Notify users in the waiting queue
          for (const queueEntry of waitingQueue) {
            if (this.datesOverlap(
              queueEntry.desiredStartDate,
              queueEntry.desiredEndDate,
              block.startDate,
              block.endDate
            )) {
              const notification = {
                userId: queueEntry.userId,
                vehicleId: block.vehicleId,
                userName: queueEntry.user?.name || "Usuário",
                vehicleName: queueEntry.vehicle ? `${queueEntry.vehicle.brand} ${queueEntry.vehicle.model}` : "Veículo",
                message: `Boa notícia! O veículo ${queueEntry.vehicle?.brand || ''} ${queueEntry.vehicle?.model || 'solicitado'} está disponível para suas datas desejadas (${queueEntry.desiredStartDate} - ${queueEntry.desiredEndDate}). Reserve agora!`
              };

              notifications.push(notification);

              // Send enhanced notifications via notification service
              const notificationData: NotificationData = {
                userId: queueEntry.userId,
                vehicleId: block.vehicleId,
                userName: queueEntry.user?.name || "Usuário",
                vehicleName: queueEntry.vehicle ? `${queueEntry.vehicle.brand} ${queueEntry.vehicle.model}` : "Veículo",
                userEmail: queueEntry.user?.email,
                userPhone: queueEntry.user?.phone || undefined,
                message: notification.message,
                desiredStartDate: queueEntry.desiredStartDate,
                desiredEndDate: queueEntry.desiredEndDate
              };

              // Send notifications asynchronously
              notificationService.sendVehicleAvailabilityNotification(notificationData)
                .catch(error => console.error(`Failed to send notification to user ${queueEntry.userId}:`, error));
            }
          }
        } catch (error) {
          console.error(`Error processing block ${block.id}:`, error);
        }
      }

      const result: ReleaseResult = {
        releasedCount,
        notifiedCount: notifications.length,
        notifications
      };

      console.log(`✅ Release complete: ${releasedCount} vehicles released, ${notifications.length} users notified`);
      return result;

    } catch (error) {
      console.error("Error in vehicle release service:", error);
      throw error;
    }
  }

  private datesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    return start1 <= end2 && end1 >= start2;
  }
}

export const vehicleReleaseService = new VehicleReleaseService();