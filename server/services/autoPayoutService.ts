import { storage } from "../storage.js";
import { PixPayoutService } from "./pixPayoutService.js";

export class AutoPayoutService {
  private pixService: PixPayoutService;

  constructor() {
    this.pixService = new PixPayoutService();
  }

  /**
   * Trigger automático após confirmação de pagamento
   */
  async triggerPayoutAfterPayment(bookingId: number): Promise<void> {
    console.log("🚀 Trigger automático de repasse para booking:", bookingId);

    try {
      // 1. Buscar dados da reserva
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        console.error("❌ Booking não encontrado:", bookingId);
        return;
      }

      // 2. Verificar se pagamento está confirmado
      if (booking.paymentStatus !== 'paid') {
        console.log("⏳ Pagamento ainda não confirmado, aguardando:", booking.paymentStatus);
        return;
      }

      // 3. Verificar se existe vistoria aprovada
      const inspection = await storage.getInspectionByBooking(bookingId);
      if (!inspection) {
        console.log("⏳ Aguardando vistoria do veículo para booking:", bookingId);
        return;
      }

      if (inspection.approvalDecision !== true) {
        if (inspection.approvalDecision === false) {
          console.log("❌ Vistoria reprovada, processando estorno para booking:", bookingId);
          await this.processRefundForRejectedInspection(booking, inspection);
        } else {
          console.log("⏳ Vistoria ainda pendente de decisão para booking:", bookingId);
        }
        return;
      }

      console.log("✅ Vistoria aprovada, prosseguindo com repasse para booking:", bookingId);

      // 4. Aguardar período de segurança após aprovação da vistoria
      const SECURITY_DELAY_HOURS = 1; // Reduzido para 1 hora após vistoria aprovada
      const inspectionTime = inspection.decidedAt || inspection.updatedAt;
      const securityDelay = SECURITY_DELAY_HOURS * 60 * 60 * 1000;
      
      if (inspectionTime && Date.now() - new Date(inspectionTime).getTime() < securityDelay) {
        console.log("⏰ Ainda dentro do período de segurança pós-vistoria, aguardando...");
        // Agendar para depois
        setTimeout(() => this.triggerPayoutAfterPayment(bookingId), securityDelay);
        return;
      }

      // 5. Buscar proprietário
      const owner = await storage.getUser(booking.vehicle.ownerId);
      if (!owner?.pix) {
        console.error("❌ Proprietário sem PIX cadastrado:", booking.vehicle.ownerId);
        return;
      }

      // 6. Calcular valores
      const adminSettings = await storage.getAdminSettings();
      const serviceFeePercent = parseFloat(adminSettings?.serviceFeePercentage || "10");
      const insuranceFeePercent = parseFloat(adminSettings?.insuranceFeePercentage || "15");
      
      const totalPrice = parseFloat(booking.totalPrice);
      const serviceFee = Math.round((totalPrice * serviceFeePercent) / 100 * 100) / 100;
      const insuranceFee = booking.insuranceFee ? parseFloat(booking.insuranceFee) : 0;
      const netAmount = Math.round((totalPrice - serviceFee - insuranceFee) * 100) / 100;

      // 7. Processar repasse com anti-fraude
      const result = await this.pixService.processPayoutWithFraudCheck({
        bookingId: booking.id,
        ownerId: owner.id,
        renterId: booking.renterId,
        totalAmount: totalPrice,
        serviceFee,
        insuranceFee,
        netAmount,
        ownerPix: owner.pix
      });

      if (result.success) {
        console.log("✅ Repasse automático processado:", result.message);
      } else {
        console.error("❌ Falha no repasse automático:", result.message);
      }

    } catch (error) {
      console.error("❌ Erro no trigger automático de repasse:", error);
    }
  }

  /**
   * Processar estorno quando vistoria é rejeitada
   */
  private async processRefundForRejectedInspection(booking: any, inspection: any): Promise<void> {
    try {
      console.log("🔄 Processando estorno para vistoria rejeitada - Booking:", booking.id);
      
      // Verificar se já foi processado
      if (booking.refundProcessed) {
        console.log("ℹ️ Estorno já processado para booking:", booking.id);
        return;
      }

      // Buscar dados do locatário
      const renter = await storage.getUser(booking.renterId);
      if (!renter?.pix) {
        console.error("❌ Locatário sem PIX cadastrado para estorno:", booking.renterId);
        
        // Marcar para estorno manual
        await storage.updateBooking(booking.id, {
          status: 'refund_pending'
        });
        return;
      }

      // Calcular valor total a estornar (sem descontar taxas)
      const refundAmount = parseFloat(booking.totalPrice);
      
      // Tentar processar estorno via PIX
      const refundResult = await this.pixService.processRefund({
        bookingId: booking.id,
        renterId: booking.renterId,
        amount: refundAmount,
        renterPix: renter.pix,
        reason: `Estorno por vistoria rejeitada: ${inspection.rejectionReason}`
      });

      if (refundResult.success) {
        // Atualizar status da reserva
        await storage.updateBooking(booking.id, {
          status: 'refunded'
        });

        console.log("✅ Estorno processado com sucesso para booking:", booking.id);
      } else {
        console.error("❌ Falha no estorno automático:", refundResult.message);
        
        // Marcar para estorno manual
        await storage.updateBooking(booking.id, {
          status: 'refund_pending'
        });
      }

    } catch (error) {
      console.error("❌ Erro no processamento de estorno:", error);
      
      // Marcar para estorno manual em caso de erro
      await storage.updateBooking(booking.id, {
        status: 'refund_pending'
      });
    }
  }

  /**
   * Job em background para processar repasses pendentes
   */
  async processPendingPayouts(): Promise<void> {
    try {
      // Buscar bookings pagos sem repasse processado
      const pendingBookings = await storage.getPendingPayoutBookings();
      
      for (const booking of pendingBookings) {
        await this.triggerPayoutAfterPayment(booking.id);
        
        // Delay entre processamentos para evitar sobrecarga
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

    } catch (error) {
      console.error("❌ Erro no job de repasses pendentes:", error);
    }
  }

  /**
   * Webhook handler para pagamentos Stripe
   */
  async handleStripeWebhook(event: any): Promise<void> {
    try {
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const bookingId = parseInt(paymentIntent.metadata.bookingId);
        
        if (bookingId) {
          console.log("💳 Webhook Stripe recebido - pagamento confirmado:", bookingId);
          
          // Aguardar um pouco antes de processar
          setTimeout(() => this.triggerPayoutAfterPayment(bookingId), 30000);
        }
      }
    } catch (error) {
      console.error("❌ Erro no webhook Stripe:", error);
    }
  }
}

// Instância singleton
export const autoPayoutService = new AutoPayoutService();

// Job automático a cada 30 minutos
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    autoPayoutService.processPendingPayouts();
  }, 30 * 60 * 1000);
}