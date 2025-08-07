import { db } from "../db.js";
import { payouts, users, bookings, vehicles } from "../../shared/schema.js";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

export interface PayoutRequest {
  bookingId: number;
  ownerId: number;
  renterId: number;
  totalAmount: number;
  serviceFee: number;
  insuranceFee: number;
  netAmount: number;
  ownerPix: string;
}

export interface FraudCheckResult {
  isApproved: boolean;
  riskScore: number;
  flags: string[];
  requiresManualReview: boolean;
}

export class PixPayoutService {
  private readonly MAX_DAILY_PAYOUT = 5000; // R$ 5.000 por dia
  private readonly MAX_SINGLE_PAYOUT = 2000; // R$ 2.000 por transação
  private readonly MIN_ACCOUNT_AGE_DAYS = 30; // 30 dias de conta ativa
  private readonly MAX_RISK_SCORE = 70; // Pontuação máxima de risco

  /**
   * Processa repasse PIX com validações anti-fraude
   */
  async processPayoutWithFraudCheck(request: PayoutRequest): Promise<{
    success: boolean;
    payoutId?: number;
    message: string;
    requiresManualReview?: boolean;
  }> {
    console.log("🔍 Iniciando processamento de repasse com validações anti-fraude:", {
      bookingId: request.bookingId,
      ownerId: request.ownerId,
      netAmount: request.netAmount
    });

    try {
      // 1. Validações básicas
      const basicValidation = await this.validateBasicRequirements(request);
      if (!basicValidation.isValid) {
        return { success: false, message: basicValidation.reason! };
      }

      // 2. Análise anti-fraude
      const fraudCheck = await this.performFraudAnalysis(request);
      console.log("🛡️ Resultado análise anti-fraude:", fraudCheck);

      // 3. Se requer revisão manual
      if (fraudCheck.requiresManualReview) {
        const payoutId = await this.createPendingPayout(request, 'manual_review', fraudCheck);
        await this.notifyAdminForReview(payoutId, fraudCheck);
        
        return {
          success: true,
          payoutId,
          message: "Repasse em análise. Será processado em até 24h após verificação manual.",
          requiresManualReview: true
        };
      }

      // 4. Se aprovado automaticamente
      if (fraudCheck.isApproved) {
        return await this.executeAutomaticPayout(request, fraudCheck);
      }

      // 5. Se rejeitado
      const payoutId = await this.createPendingPayout(request, 'rejected', fraudCheck);
      return {
        success: false,
        message: `Repasse negado por questões de segurança: ${fraudCheck.flags.join(', ')}`
      };

    } catch (error) {
      console.error("❌ Erro no processamento de repasse:", error);
      return { 
        success: false, 
        message: "Erro interno. Tente novamente em alguns minutos." 
      };
    }
  }

  /**
   * Validações básicas obrigatórias
   */
  private async validateBasicRequirements(request: PayoutRequest): Promise<{
    isValid: boolean;
    reason?: string;
  }> {
    // Verificar se booking existe e está pago
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, request.bookingId));

    if (!booking) {
      return { isValid: false, reason: "Reserva não encontrada" };
    }

    if (booking.status !== 'confirmed' || booking.paymentStatus !== 'paid') {
      return { isValid: false, reason: "Reserva deve estar confirmada e paga" };
    }

    // Verificar se já existe repasse para esta reserva
    const [existingPayout] = await db
      .select()
      .from(payouts)
      .where(eq(payouts.bookingId, request.bookingId));

    if (existingPayout) {
      return { isValid: false, reason: "Repasse já processado para esta reserva" };
    }

    // Validar chave PIX
    if (!this.isValidPixKey(request.ownerPix)) {
      return { isValid: false, reason: "Chave PIX inválida" };
    }

    // Verificar valores
    if (request.netAmount <= 0 || request.netAmount > this.MAX_SINGLE_PAYOUT) {
      return { 
        isValid: false, 
        reason: `Valor inválido. Limite: R$ ${this.MAX_SINGLE_PAYOUT}` 
      };
    }

    return { isValid: true };
  }

  /**
   * Análise anti-fraude completa
   */
  private async performFraudAnalysis(request: PayoutRequest): Promise<FraudCheckResult> {
    let riskScore = 0;
    const flags: string[] = [];

    // 1. Verificar idade da conta
    const accountAgeRisk = await this.checkAccountAge(request.ownerId);
    riskScore += accountAgeRisk.score;
    if (accountAgeRisk.flag) flags.push(accountAgeRisk.flag);

    // 2. Verificar padrão de transações
    const transactionPatternRisk = await this.checkTransactionPattern(request.ownerId);
    riskScore += transactionPatternRisk.score;
    if (transactionPatternRisk.flag) flags.push(transactionPatternRisk.flag);

    // 3. Verificar limites diários
    const dailyLimitRisk = await this.checkDailyLimits(request.ownerId, request.netAmount);
    riskScore += dailyLimitRisk.score;
    if (dailyLimitRisk.flag) flags.push(dailyLimitRisk.flag);

    // 4. Verificar veículo e propriedade
    const vehicleRisk = await this.checkVehicleOwnership(request.bookingId, request.ownerId);
    riskScore += vehicleRisk.score;
    if (vehicleRisk.flag) flags.push(vehicleRisk.flag);

    // 5. Verificar mudanças recentes na conta
    const accountChangesRisk = await this.checkRecentAccountChanges(request.ownerId);
    riskScore += accountChangesRisk.score;
    if (accountChangesRisk.flag) flags.push(accountChangesRisk.flag);

    // 6. Verificar se o locatário é confiável
    const renterRisk = await this.checkRenterReliability(request.renterId);
    riskScore += renterRisk.score;
    if (renterRisk.flag) flags.push(renterRisk.flag);

    // Decisão final
    const isApproved = riskScore <= 30 && flags.length === 0;
    const requiresManualReview = riskScore > 30 && riskScore <= this.MAX_RISK_SCORE;

    return {
      isApproved,
      riskScore,
      flags,
      requiresManualReview: !isApproved && requiresManualReview
    };
  }

  /**
   * Verificar idade da conta do proprietário
   */
  private async checkAccountAge(ownerId: number): Promise<{ score: number; flag?: string }> {
    const [owner] = await db
      .select()
      .from(users)
      .where(eq(users.id, ownerId));

    if (!owner?.createdAt) {
      return { score: 50, flag: "Data de criação da conta não disponível" };
    }

    const accountAgeDays = Math.floor(
      (Date.now() - new Date(owner.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (accountAgeDays < 7) {
      return { score: 40, flag: "Conta muito recente (menos de 7 dias)" };
    }

    if (accountAgeDays < this.MIN_ACCOUNT_AGE_DAYS) {
      return { score: 25, flag: "Conta recente (menos de 30 dias)" };
    }

    return { score: 0 };
  }

  /**
   * Verificar padrão de transações suspeitas
   */
  private async checkTransactionPattern(ownerId: number): Promise<{ score: number; flag?: string }> {
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const recentPayouts = await db
      .select()
      .from(payouts)
      .where(
        and(
          eq(payouts.ownerId, ownerId),
          gte(payouts.createdAt, last30Days)
        )
      )
      .orderBy(desc(payouts.createdAt));

    // Muitos repasses em pouco tempo
    if (recentPayouts.length > 20) {
      return { score: 35, flag: "Volume muito alto de transações (>20 em 30 dias)" };
    }

    // Padrão de valores muito similares (possível automação)
    const amounts = recentPayouts.map((p: any) => parseFloat(p.netAmount));
    const uniqueAmounts = new Set(amounts);
    
    if (amounts.length > 5 && uniqueAmounts.size === 1) {
      return { score: 30, flag: "Padrão suspeito: todos os valores idênticos" };
    }

    // Muitas falhas recentes
    const failedCount = recentPayouts.filter((p: any) => p.status === 'failed').length;
    if (failedCount > 3) {
      return { score: 20, flag: "Muitas falhas recentes de repasse" };
    }

    return { score: 0 };
  }

  /**
   * Verificar limites diários
   */
  private async checkDailyLimits(ownerId: number, currentAmount: number): Promise<{ score: number; flag?: string }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayPayouts = await db
      .select()
      .from(payouts)
      .where(
        and(
          eq(payouts.ownerId, ownerId),
          gte(payouts.createdAt, today),
          lte(payouts.createdAt, tomorrow),
          eq(payouts.status, 'completed')
        )
      );

    const todayTotal = todayPayouts.reduce((sum: number, p: any) => sum + parseFloat(p.netAmount), 0);
    const newTotal = todayTotal + currentAmount;

    if (newTotal > this.MAX_DAILY_PAYOUT) {
      return { 
        score: 50, 
        flag: `Limite diário excedido: R$ ${newTotal.toFixed(2)} > R$ ${this.MAX_DAILY_PAYOUT}` 
      };
    }

    if (newTotal > this.MAX_DAILY_PAYOUT * 0.8) {
      return { score: 15, flag: "Próximo ao limite diário" };
    }

    return { score: 0 };
  }

  /**
   * Verificar propriedade do veículo
   */
  private async checkVehicleOwnership(bookingId: number, ownerId: number): Promise<{ score: number; flag?: string }> {
    const result = await db
      .select({
        vehicleOwnerId: vehicles.ownerId,
        bookingStatus: bookings.status
      })
      .from(bookings)
      .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .where(eq(bookings.id, bookingId));

    const [booking] = result;

    if (!booking) {
      return { score: 50, flag: "Reserva não encontrada" };
    }

    if (booking.vehicleOwnerId !== ownerId) {
      return { score: 100, flag: "Proprietário do veículo não confere" };
    }

    return { score: 0 };
  }

  /**
   * Verificar mudanças recentes na conta
   */
  private async checkRecentAccountChanges(ownerId: number): Promise<{ score: number; flag?: string }> {
    const [owner] = await db
      .select()
      .from(users)
      .where(eq(users.id, ownerId));

    if (!owner) {
      return { score: 50, flag: "Usuário não encontrado" };
    }

    // Verificar se PIX foi alterado recentemente (simulação)
    // Em produção, teríamos um log de mudanças
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    if (owner.updatedAt && new Date(owner.updatedAt) > lastWeek) {
      return { score: 20, flag: "Dados da conta alterados recentemente" };
    }

    return { score: 0 };
  }

  /**
   * Verificar confiabilidade do locatário
   */
  private async checkRenterReliability(renterId: number): Promise<{ score: number; flag?: string }> {
    const [renter] = await db
      .select()
      .from(users)
      .where(eq(users.id, renterId));

    if (!renter) {
      return { score: 30, flag: "Locatário não encontrado" };
    }

    // Conta muito nova
    const accountAge = renter.createdAt ? 
      (Date.now() - new Date(renter.createdAt).getTime()) / (1000 * 60 * 60 * 24) : 0;

    if (accountAge < 3) {
      return { score: 25, flag: "Locatário com conta muito recente" };
    }

    return { score: 0 };
  }

  /**
   * Executa repasse automático aprovado
   */
  private async executeAutomaticPayout(request: PayoutRequest, fraudCheck: FraudCheckResult): Promise<{
    success: boolean;
    payoutId?: number;
    message: string;
  }> {
    try {
      // 1. Criar registro de repasse
      const payoutId = await this.createPendingPayout(request, 'processing', fraudCheck);

      // 2. Tentar transferência PIX
      const transferResult = await this.executePIXTransfer(request);

      if (transferResult.success) {
        // 3. Atualizar status para completed
        await db
          .update(payouts)
          .set({
            status: 'completed',
            reference: transferResult.reference,
            processedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(payouts.id, payoutId));

        // 4. Notificar proprietário
        await this.notifyOwnerPayoutSuccess(request.ownerId, request.netAmount);

        return {
          success: true,
          payoutId,
          message: `Repasse de R$ ${request.netAmount.toFixed(2)} processado com sucesso!`
        };

      } else {
        // 3. Marcar como falha
        await db
          .update(payouts)
          .set({
            status: 'failed',
            failureReason: transferResult.error,
            updatedAt: new Date()
          })
          .where(eq(payouts.id, payoutId));

        return {
          success: false,
          message: `Falha no repasse: ${transferResult.error}`
        };
      }

    } catch (error) {
      console.error("❌ Erro na execução do repasse:", error);
      return {
        success: false,
        message: "Erro interno na execução do repasse"
      };
    }
  }

  /**
   * Criar registro de repasse pendente
   */
  private async createPendingPayout(
    request: PayoutRequest, 
    status: string, 
    fraudCheck: FraudCheckResult
  ): Promise<number> {
    const [payout] = await db
      .insert(payouts)
      .values({
        bookingId: request.bookingId,
        ownerId: request.ownerId,
        renterId: request.renterId,
        totalBookingAmount: request.totalAmount.toString(),
        serviceFee: request.serviceFee.toString(),
        insuranceFee: request.insuranceFee.toString(),
        couponDiscount: '0.00',
        netAmount: request.netAmount.toString(),
        ownerPix: request.ownerPix,
        status,
        method: 'pix',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning({ id: payouts.id });

    return payout.id;
  }

  /**
   * Executar transferência PIX (integração com Stripe ou similar)
   */
  private async executePIXTransfer(request: PayoutRequest): Promise<{
    success: boolean;
    reference?: string;
    error?: string;
  }> {
    try {
      // Em produção, integraria com API PIX real
      // Por enquanto, simular sucesso para chaves PIX válidas
      console.log("💰 Executando transferência PIX:", {
        destination: request.ownerPix,
        amount: request.netAmount
      });

      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simular falha em 5% dos casos para testes
      if (Math.random() < 0.05) {
        return {
          success: false,
          error: "Chave PIX temporariamente indisponível"
        };
      }

      return {
        success: true,
        reference: `PIX_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

    } catch (error) {
      return {
        success: false,
        error: "Falha na comunicação com sistema bancário"
      };
    }
  }

  /**
   * Validar formato de chave PIX
   */
  private isValidPixKey(pixKey: string): boolean {
    if (!pixKey || pixKey.trim().length === 0) return false;

    // CPF/CNPJ (apenas números)
    if (/^\d{11}$|^\d{14}$/.test(pixKey)) return true;

    // E-mail
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pixKey)) return true;

    // Telefone (+5511999999999 ou 11999999999)
    if (/^(\+55)?\d{10,11}$/.test(pixKey)) return true;

    // Chave aleatória (UUID)
    if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(pixKey)) return true;

    return false;
  }

  /**
   * Notificar admin para revisão manual
   */
  private async notifyAdminForReview(payoutId: number, fraudCheck: FraudCheckResult): Promise<void> {
    console.log("🔔 Notificação para admin - Revisão manual necessária:", {
      payoutId,
      riskScore: fraudCheck.riskScore,
      flags: fraudCheck.flags
    });

    // Implementar notificação real (email, Slack, etc.)
  }

  /**
   * Notificar proprietário sobre sucesso
   */
  private async notifyOwnerPayoutSuccess(ownerId: number, amount: number): Promise<void> {
    console.log("✅ Notificar proprietário sobre repasse:", {
      ownerId,
      amount
    });

    // Implementar notificação real (email, SMS, push)
  }

  /**
   * Processar estorno para locatário
   */
  async processRefund(request: {
    bookingId: number;
    renterId: number;
    amount: number;
    renterPix: string;
    reason: string;
  }): Promise<{
    success: boolean;
    refundId?: number;
    message: string;
  }> {
    try {
      console.log("🔄 Processando estorno PIX:", {
        bookingId: request.bookingId,
        amount: request.amount,
        reason: request.reason
      });

      // 1. Validar chave PIX do locatário
      if (!this.isValidPixKey(request.renterPix)) {
        return {
          success: false,
          message: "Chave PIX do locatário inválida"
        };
      }

      // 2. Criar registro de estorno
      const refundId = await this.createRefundRecord(request);

      // 3. Executar transferência PIX de estorno
      const transferResult = await this.executeRefundTransfer(request);

      if (transferResult.success) {
        // 4. Atualizar status para completed
        await db
          .update(payouts)
          .set({
            status: 'completed',
            reference: transferResult.reference,
            processedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(payouts.id, refundId));

        return {
          success: true,
          refundId,
          message: `Estorno de R$ ${request.amount.toFixed(2)} processado com sucesso!`
        };

      } else {
        // 4. Marcar como falha
        await db
          .update(payouts)
          .set({
            status: 'failed',
            failureReason: transferResult.error,
            updatedAt: new Date()
          })
          .where(eq(payouts.id, refundId));

        return {
          success: false,
          message: `Falha no estorno: ${transferResult.error}`
        };
      }

    } catch (error) {
      console.error("❌ Erro no processamento de estorno:", error);
      return {
        success: false,
        message: "Erro interno no processamento do estorno"
      };
    }
  }

  /**
   * Criar registro de estorno
   */
  private async createRefundRecord(request: {
    bookingId: number;
    renterId: number;
    amount: number;
    renterPix: string;
    reason: string;
  }): Promise<number> {
    const [refund] = await db
      .insert(payouts)
      .values({
        bookingId: request.bookingId,
        ownerId: 0, // Sistema
        renterId: request.renterId,
        totalBookingAmount: request.amount.toString(),
        serviceFee: '0.00',
        insuranceFee: '0.00',
        couponDiscount: '0.00',
        netAmount: request.amount.toString(),
        ownerPix: request.renterPix, // Usar o PIX do locatário
        status: 'processing',
        method: 'pix_refund',
        failureReason: request.reason,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning({ id: payouts.id });

    return refund.id;
  }

  /**
   * Executar transferência PIX de estorno
   */
  private async executeRefundTransfer(request: {
    bookingId: number;
    renterId: number;
    amount: number;
    renterPix: string;
    reason: string;
  }): Promise<{
    success: boolean;
    reference?: string;
    error?: string;
  }> {
    try {
      console.log("💰 Executando estorno PIX:", {
        destination: request.renterPix,
        amount: request.amount,
        reason: request.reason
      });

      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simular falha em 2% dos casos (menor que pagamentos)
      if (Math.random() < 0.02) {
        return {
          success: false,
          error: "Falha temporária no sistema bancário para estorno"
        };
      }

      return {
        success: true,
        reference: `REFUND_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

    } catch (error) {
      return {
        success: false,
        error: "Falha na comunicação com sistema bancário para estorno"
      };
    }
  }

  /**
   * Reprocessar repasses com falha (job em background)
   */
  async retryFailedPayouts(): Promise<void> {
    const failedPayouts = await db
      .select()
      .from(payouts)
      .where(eq(payouts.status, 'failed'))
      .limit(10);

    for (const payout of failedPayouts) {
      console.log("🔄 Reprocessando repasse:", payout.id);
      
      // Tentar novamente após 1 hora de falha
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (new Date(payout.updatedAt!) < oneHourAgo) {
        // Lógica de retry
      }
    }
  }
}