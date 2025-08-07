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

      // 3. Aguardar período de segurança (ex: 2 horas após pagamento)
      const SECURITY_DELAY_HOURS = 2;
      const paymentTime = booking.paymentConfirmedAt || booking.updatedAt;
      const securityDelay = SECURITY_DELAY_HOURS * 60 * 60 * 1000;
      
      if (paymentTime && Date.now() - new Date(paymentTime).getTime() < securityDelay) {
        console.log("⏰ Ainda dentro do período de segurança, aguardando...");
        // Agendar para depois
        setTimeout(() => this.triggerPayoutAfterPayment(bookingId), securityDelay);
        return;
      }

      // 4. Buscar proprietário
      const owner = await storage.getUser(booking.vehicle.ownerId);
      if (!owner?.pix) {
        console.error("❌ Proprietário sem PIX cadastrado:", booking.vehicle.ownerId);
        return;
      }

      // 5. Calcular valores
      const adminSettings = await storage.getAdminSettings();
      const serviceFeePercent = parseFloat(adminSettings?.serviceFeePercentage || "10");
      const insuranceFeePercent = parseFloat(adminSettings?.insuranceFeePercentage || "15");
      
      const totalPrice = parseFloat(booking.totalPrice);
      const serviceFee = Math.round((totalPrice * serviceFeePercent) / 100 * 100) / 100;
      const insuranceFee = booking.hasInsurance ? Math.round((totalPrice * insuranceFeePercent) / 100 * 100) / 100 : 0;
      const netAmount = Math.round((totalPrice - serviceFee - insuranceFee) * 100) / 100;

      // 6. Processar repasse com anti-fraude
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