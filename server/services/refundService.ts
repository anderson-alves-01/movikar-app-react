import Stripe from 'stripe';
import { storage } from '../storage';
import pixService from './pixService';

interface RefundRequest {
  bookingId: number;
  amount?: number; // If not provided, refund full amount
  reason: string;
  requestedBy: 'renter' | 'owner' | 'system' | 'admin';
  requestedById: number;
  autoApprove?: boolean;
}

interface RefundResult {
  success: boolean;
  refundId?: string;
  amount?: number;
  estimatedArrival?: Date;
  error?: string;
}

class RefundService {
  private stripe: Stripe;

  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
  }

  // Process automatic refund
  async processAutomaticRefund(request: RefundRequest): Promise<RefundResult> {
    try {
      console.log('🔄 Processing automatic refund:', request);

      // Get booking details
      const booking = await storage.getBookingById(request.bookingId);
      if (!booking) {
        return { success: false, error: 'Booking not found' };
      }

      // Check if refund is eligible
      const eligibility = await this.checkRefundEligibility(booking);
      if (!eligibility.eligible) {
        return { success: false, error: eligibility.reason };
      }

      // Determine refund amount
      const refundAmount = request.amount || booking.totalAmount;

      // Process refund based on payment method
      let refundResult: RefundResult;
      
      if (booking.paymentMethod === 'pix') {
        refundResult = await this.processPixRefund(booking, refundAmount, request.reason);
      } else {
        refundResult = await this.processStripeRefund(booking, refundAmount, request.reason);
      }

      if (refundResult.success) {
        // Create refund record
        await this.createRefundRecord({
          bookingId: request.bookingId,
          amount: refundAmount,
          reason: request.reason,
          status: 'processed',
          requestedBy: request.requestedBy,
          requestedById: request.requestedById,
          processedAt: new Date(),
          refundId: refundResult.refundId,
        });

        // Update booking status
        await storage.updateBookingStatus(request.bookingId, 'refunded');

        // Send notifications
        await this.sendRefundNotifications(booking, refundResult);
      }

      return refundResult;
    } catch (error) {
      console.error('Error processing automatic refund:', error);
      return { success: false, error: error.message };
    }
  }

  // Check refund eligibility
  private async checkRefundEligibility(booking: any): Promise<{ eligible: boolean; reason?: string }> {
    // Check booking status
    if (!['confirmed', 'cancelled', 'owner_cancelled'].includes(booking.status)) {
      return { eligible: false, reason: 'Booking status does not allow refund' };
    }

    // Check if already refunded
    if (booking.status === 'refunded') {
      return { eligible: false, reason: 'Booking already refunded' };
    }

    // Check cancellation timing (allow refund up to 24h before start)
    const now = new Date();
    const startDate = new Date(booking.startDate);
    const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (booking.status === 'cancelled' && hoursUntilStart < 24) {
      // Partial refund for late cancellation
      return { eligible: true };
    }

    return { eligible: true };
  }

  // Process Stripe refund
  private async processStripeRefund(booking: any, amount: number, reason: string): Promise<RefundResult> {
    try {
      if (!booking.paymentIntentId) {
        return { success: false, error: 'No payment intent found for refund' };
      }

      const refund = await this.stripe.refunds.create({
        payment_intent: booking.paymentIntentId,
        amount: Math.round(amount * 100), // Convert to cents
        reason: 'requested_by_customer',
        metadata: {
          booking_id: booking.id.toString(),
          reason: reason,
        },
      });

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount / 100,
        estimatedArrival: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5-10 business days
      };
    } catch (error) {
      console.error('Error processing Stripe refund:', error);
      return { success: false, error: error.message };
    }
  }

  // Process PIX refund
  private async processPixRefund(booking: any, amount: number, reason: string): Promise<RefundResult> {
    try {
      if (!booking.pixPaymentId) {
        return { success: false, error: 'No PIX payment found for refund' };
      }

      const refundResult = await pixService.refundPixPayment(
        booking.pixPaymentId,
        amount,
        reason
      );

      if (!refundResult.success) {
        return { success: false, error: refundResult.error };
      }

      return {
        success: true,
        refundId: refundResult.refundId,
        amount: amount,
        estimatedArrival: new Date(Date.now() + 30 * 60 * 1000), // PIX refunds are usually instant to 30 minutes
      };
    } catch (error) {
      console.error('Error processing PIX refund:', error);
      return { success: false, error: error.message };
    }
  }

  // Create refund record
  private async createRefundRecord(refundData: {
    bookingId: number;
    amount: number;
    reason: string;
    status: string;
    requestedBy: string;
    requestedById: number;
    processedAt: Date;
    refundId?: string;
  }): Promise<void> {
    try {
      await storage.createRefund({
        bookingId: refundData.bookingId,
        amount: refundData.amount,
        reason: refundData.reason,
        status: refundData.status,
        requestedBy: refundData.requestedBy,
        requestedById: refundData.requestedById,
        processedAt: refundData.processedAt,
        refundId: refundData.refundId,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Error creating refund record:', error);
    }
  }

  // Send refund notifications
  private async sendRefundNotifications(booking: any, refundResult: RefundResult): Promise<void> {
    try {
      // Get user details
      const renter = await storage.getUserById(booking.renterId);
      const owner = await storage.getUserById(booking.ownerId);

      if (!renter || !owner) return;

      // Send email to renter
      const renterEmailData = {
        to: renter.email,
        subject: 'Reembolso Processado - alugae.mobi',
        template: 'refund_processed',
        data: {
          userName: renter.name,
          bookingId: booking.id,
          amount: refundResult.amount,
          estimatedArrival: refundResult.estimatedArrival,
          refundId: refundResult.refundId,
        },
      };

      // Send email to owner
      const ownerEmailData = {
        to: owner.email,
        subject: 'Reembolso Processado para Reserva - alugae.mobi',
        template: 'refund_processed_owner',
        data: {
          ownerName: owner.name,
          renterName: renter.name,
          bookingId: booking.id,
          amount: refundResult.amount,
          refundId: refundResult.refundId,
        },
      };

      // Send notifications (implement email service integration)
      console.log('📧 Refund notification emails prepared:', {
        renter: renterEmailData,
        owner: ownerEmailData,
      });

      // TODO: Integrate with email service (SendGrid, SES, etc.)
    } catch (error) {
      console.error('Error sending refund notifications:', error);
    }
  }

  // Calculate refund amount based on cancellation policy
  calculateRefundAmount(booking: any, cancellationDate: Date = new Date()): {
    refundAmount: number;
    refundPercentage: number;
    deductions: Array<{ reason: string; amount: number }>;
  } {
    const totalAmount = booking.totalAmount;
    const startDate = new Date(booking.startDate);
    const hoursUntilStart = (startDate.getTime() - cancellationDate.getTime()) / (1000 * 60 * 60);
    
    let refundPercentage = 100;
    const deductions: Array<{ reason: string; amount: number }> = [];

    // Apply cancellation policy
    if (hoursUntilStart < 2) {
      // Less than 2 hours: no refund
      refundPercentage = 0;
      deductions.push({
        reason: 'Cancelamento com menos de 2 horas de antecedência',
        amount: totalAmount,
      });
    } else if (hoursUntilStart < 24) {
      // Less than 24 hours: 50% refund
      refundPercentage = 50;
      deductions.push({
        reason: 'Cancelamento com menos de 24 horas de antecedência',
        amount: totalAmount * 0.5,
      });
    } else if (hoursUntilStart < 48) {
      // Less than 48 hours: 75% refund
      refundPercentage = 75;
      deductions.push({
        reason: 'Cancelamento com menos de 48 horas de antecedência',
        amount: totalAmount * 0.25,
      });
    }
    // More than 48 hours: 100% refund (no deductions)

    // Apply service fee (non-refundable if within 24h)
    if (hoursUntilStart < 24 && booking.serviceFee > 0) {
      const serviceFeeDeduction = Math.min(booking.serviceFee, totalAmount * (refundPercentage / 100));
      refundPercentage = Math.max(0, refundPercentage - (serviceFeeDeduction / totalAmount * 100));
      deductions.push({
        reason: 'Taxa de serviço não reembolsável',
        amount: serviceFeeDeduction,
      });
    }

    const refundAmount = Math.max(0, totalAmount * (refundPercentage / 100));

    return {
      refundAmount,
      refundPercentage,
      deductions,
    };
  }

  // Get refund status
  async getRefundStatus(refundId: string): Promise<{
    status: 'pending' | 'processed' | 'failed' | 'cancelled';
    amount?: number;
    processedAt?: Date;
    estimatedArrival?: Date;
  } | null> {
    try {
      // Check if it's a Stripe refund
      if (refundId.startsWith('re_')) {
        const refund = await this.stripe.refunds.retrieve(refundId);
        return {
          status: refund.status === 'succeeded' ? 'processed' : 'pending',
          amount: refund.amount / 100,
          processedAt: refund.created ? new Date(refund.created * 1000) : undefined,
        };
      }

      // Check database for PIX or other refunds
      const refundRecord = await storage.getRefundByRefundId(refundId);
      if (refundRecord) {
        return {
          status: refundRecord.status as any,
          amount: refundRecord.amount,
          processedAt: refundRecord.processedAt,
          estimatedArrival: refundRecord.estimatedArrival,
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting refund status:', error);
      return null;
    }
  }
}

export default new RefundService();