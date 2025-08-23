import Stripe from "stripe";
import { storage } from "../storage.js";
import { AutoPayoutService } from "./autoPayoutService.js";

// Configuração Stripe para produção
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export class StripeProductionService {
  private autoPayoutService: AutoPayoutService;

  constructor() {
    this.autoPayoutService = new AutoPayoutService();
  }

  /**
   * Configura webhook endpoint para produção
   */
  async setupWebhookEndpoint(): Promise<{ webhookSecret: string; webhookId: string }> {
    try {
      console.log("🔧 Configurando webhook Stripe para produção...");

      // Listar endpoints existentes
      const endpoints = await stripe.webhookEndpoints.list();
      
      // Verificar se já existe endpoint para o domínio atual
      const domain = process.env.REPL_SLUG ? 
        `https://${process.env.REPL_SLUG}.${process.env.REPLIT_DEV_DOMAIN || 'replit.app'}` :
        'https://alugae.mobi';

      const webhookUrl = `${domain}/api/webhooks/stripe`;
      
      const existingEndpoint = endpoints.data.find(ep => ep.url === webhookUrl);
      
      if (existingEndpoint) {
        console.log("✅ Webhook endpoint já existe:", existingEndpoint.id);
        return {
          webhookSecret: existingEndpoint.secret!,
          webhookId: existingEndpoint.id
        };
      }

      // Criar novo endpoint
      const endpoint = await stripe.webhookEndpoints.create({
        url: webhookUrl,
        enabled_events: [
          'payment_intent.succeeded',
          'payment_intent.payment_failed',
          'invoice.payment_succeeded',
          'customer.subscription.created',
          'customer.subscription.updated',
          'customer.subscription.deleted',
        ],
        description: 'alugae.mobi - Webhook para repasses automáticos PIX'
      });

      console.log("✅ Webhook endpoint criado:", endpoint.id);
      console.log("🔗 URL:", endpoint.url);

      return {
        webhookSecret: endpoint.secret!,
        webhookId: endpoint.id
      };

    } catch (error) {
      console.error("❌ Erro ao configurar webhook:", error);
      throw error;
    }
  }

  /**
   * Verifica e valida configuração Stripe para produção
   */
  async validateProductionSetup(): Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      console.log("🔍 Validando configuração Stripe para produção...");

      // 1. Verificar chaves de API
      if (!process.env.STRIPE_SECRET_KEY) {
        issues.push("STRIPE_SECRET_KEY não configurada");
      } else if (process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
        issues.push("Usando chave de teste. Configure chave de produção (sk_live_...)");
      }

      if (!process.env.VITE_STRIPE_PUBLIC_KEY) {
        issues.push("VITE_STRIPE_PUBLIC_KEY não configurada");
      } else if (process.env.VITE_STRIPE_PUBLIC_KEY.startsWith('pk_test_')) {
        issues.push("Usando chave pública de teste. Configure chave de produção (pk_live_...)");
      }

      // 2. Testar conexão com API Stripe
      try {
        const account = await stripe.accounts.retrieve();
        console.log("✅ Conexão com Stripe OK:", account.business_profile?.name || account.id);
        
        if (!account.charges_enabled) {
          issues.push("Conta Stripe não habilitada para processar pagamentos");
        }
        
        if (!account.payouts_enabled) {
          issues.push("Conta Stripe não habilitada para processar repasses");
        }

      } catch (error) {
        issues.push("Falha ao conectar com API Stripe");
      }

      // 3. Verificar webhook endpoints
      try {
        const endpoints = await stripe.webhookEndpoints.list();
        if (endpoints.data.length === 0) {
          recommendations.push("Configure webhooks para automação de repasses");
        }
      } catch (error) {
        recommendations.push("Verificar configuração de webhooks manualmente");
      }

      // 4. Verificar usuários com PIX cadastrado
      const usersWithPix = await storage.getUsersWithPix();
      if (usersWithPix.length === 0) {
        recommendations.push("Incentive proprietários a cadastrar PIX para receber repasses");
      } else {
        console.log(`✅ ${usersWithPix.length} proprietários com PIX cadastrado`);
      }

      return {
        isValid: issues.length === 0,
        issues,
        recommendations
      };

    } catch (error) {
      console.error("❌ Erro na validação:", error);
      return {
        isValid: false,
        issues: ["Erro interno na validação"],
        recommendations: []
      };
    }
  }

  /**
   * Processa webhook de pagamento bem-sucedido
   */
  async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    console.log("💳 Processando pagamento bem-sucedido:", paymentIntent.id);

    try {
      // Buscar booking pelo payment intent
      const booking = await storage.getBookingByPaymentIntent(paymentIntent.id);
      
      if (!booking) {
        console.log("❌ Booking não encontrado para payment intent:", paymentIntent.id);
        return;
      }

      console.log("📋 Booking encontrado:", booking.id);

      // Atualizar status do pagamento
      await storage.updateBookingPaymentStatus(booking.id, 'paid');

      // Disparar processo de repasse automático
      console.log("🚀 Disparando repasse automático...");
      setTimeout(async () => {
        await this.autoPayoutService.triggerPayoutAfterPayment(booking.id);
      }, 1000); // 1 segundo de delay para garantir que todas as operações foram concluídas

    } catch (error) {
      console.error("❌ Erro ao processar pagamento bem-sucedido:", error);
    }
  }

  /**
   * Monitora status de repasses pendentes
   */
  async monitorPendingPayouts(): Promise<{
    pending: number;
    inReview: number;
    completed: number;
    failed: number;
  }> {
    try {
      const stats = await storage.getPayoutStatistics();
      console.log("📊 Estatísticas de repasses:", stats);
      return stats;
    } catch (error) {
      console.error("❌ Erro ao monitorar repasses:", error);
      return { pending: 0, inReview: 0, completed: 0, failed: 0 };
    }
  }

  /**
   * Configura produto padrão no Stripe para assinaturas
   */
  async setupDefaultProducts(): Promise<void> {
    console.log("📦 Configurando produtos padrão no Stripe...");

    try {
      // Verificar se produtos já existem
      const products = await stripe.products.list({ limit: 100 });
      
      const existingPlans = {
        basic: products.data.find(p => p.metadata.plan_type === 'basic'),
        plus: products.data.find(p => p.metadata.plan_type === 'plus'),
        premium: products.data.find(p => p.metadata.plan_type === 'premium')
      };

      // Criar planos se não existirem
      const plansToCreate = [
        {
          type: 'basic',
          name: 'Plano Básico',
          description: 'Para proprietários iniciantes',
          monthlyPrice: 1990, // R$ 19.90
          annualPrice: 19900, // R$ 199.00 (2 meses grátis)
          features: ['Até 2 veículos', 'Suporte básico']
        },
        {
          type: 'plus',
          name: 'Plano Plus',
          description: 'Para proprietários ativos',
          monthlyPrice: 4990, // R$ 49.90
          annualPrice: 49900, // R$ 499.00 (2 meses grátis)
          features: ['Até 10 veículos', 'Destaques premium', 'Suporte prioritário']
        },
        {
          type: 'premium',
          name: 'Plano Premium',
          description: 'Para proprietários profissionais',
          monthlyPrice: 9990, // R$ 99.90
          annualPrice: 99900, // R$ 999.00 (2 meses grátis)
          features: ['Veículos ilimitados', 'Máximo destaque', 'Suporte 24/7', 'Relatórios avançados']
        }
      ];

      for (const plan of plansToCreate) {
        if (!existingPlans[plan.type as keyof typeof existingPlans]) {
          // Criar produto
          const product = await stripe.products.create({
            name: plan.name,
            description: plan.description,
            metadata: {
              plan_type: plan.type,
              features: plan.features.join(', ')
            }
          });

          // Criar preços mensais e anuais
          await stripe.prices.create({
            product: product.id,
            currency: 'brl',
            unit_amount: plan.monthlyPrice,
            recurring: { interval: 'month' },
            metadata: { billing_period: 'monthly' }
          });

          await stripe.prices.create({
            product: product.id,
            currency: 'brl',
            unit_amount: plan.annualPrice,
            recurring: { interval: 'year' },
            metadata: { billing_period: 'annual' }
          });

          console.log(`✅ Produto criado: ${plan.name}`);
        } else {
          console.log(`✅ Produto já existe: ${plan.name}`);
        }
      }

    } catch (error) {
      console.error("❌ Erro ao configurar produtos:", error);
    }
  }

  // ✅ NOVOS HANDLERS: Webhook event processors for recurring subscriptions
  
  async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    console.log('🎯 Processing subscription.created:', subscription.id);
    // This is already handled in the confirm endpoint, so just log
  }

  async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    try {
      console.log('🔄 Processing subscription.updated:', subscription.id, 'status:', subscription.status);
      
      const { storage } = await import('../storage.js');
      
      // Find user subscription by Stripe ID
      const userSubscriptions = await storage.getUserSubscriptions();
      const userSubscription = userSubscriptions.find((sub: any) => sub.stripeSubscriptionId === subscription.id);
      
      if (!userSubscription) {
        console.error('❌ User subscription not found for Stripe subscription:', subscription.id);
        return;
      }

      // Update subscription status based on Stripe status
      let newStatus = 'active';
      if (subscription.status === 'past_due') {
        newStatus = 'past_due';
      } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
        newStatus = 'cancelled';
      }

      await storage.updateUserSubscription(userSubscription.id, {
        status: newStatus,
        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      });

      console.log('✅ Updated user subscription status to:', newStatus);
      
    } catch (error) {
      console.error('❌ Error handling subscription updated:', error);
    }
  }

  async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    try {
      console.log('❌ Processing subscription.deleted:', subscription.id);
      
      const { storage } = await import('../storage.js');
      
      // Find user subscription by Stripe ID
      const userSubscriptions = await storage.getUserSubscriptions();
      const userSubscription = userSubscriptions.find((sub: any) => sub.stripeSubscriptionId === subscription.id);
      
      if (!userSubscription) {
        console.error('❌ User subscription not found for Stripe subscription:', subscription.id);
        return;
      }

      // Cancel user subscription
      await storage.updateUserSubscription(userSubscription.id, {
        status: 'cancelled',
        cancelledAt: new Date(),
      });

      // Update user to free plan
      await storage.updateUser(userSubscription.userId, {
        subscriptionPlan: 'free',
        subscriptionStatus: 'cancelled',
        maxVehicleListings: 1,
        highlightsAvailable: 0
      });

      console.log('✅ User subscription cancelled and downgraded to free plan');
      
    } catch (error) {
      console.error('❌ Error handling subscription deleted:', error);
    }
  }

  async handleInvoicePaymentSucceeded(invoice: any): Promise<void> {
    try {
      console.log('💰 Processing invoice.payment_succeeded:', invoice.id);
      
      if (!invoice.subscription) {
        console.log('ℹ️ Invoice not related to subscription, skipping');
        return;
      }

      const { storage } = await import('../storage.js');
      
      // Find user subscription by Stripe ID
      const userSubscriptions = await storage.getUserSubscriptions();
      const userSubscription = userSubscriptions.find((sub: any) => sub.stripeSubscriptionId === invoice.subscription as string);
      
      if (!userSubscription) {
        console.error('❌ User subscription not found for invoice:', invoice.id);
        return;
      }

      // Update subscription period based on Stripe subscription
      const stripeSubscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
      
      const startDate = new Date((stripeSubscription as any).current_period_start * 1000);
      const endDate = new Date((stripeSubscription as any).current_period_end * 1000);

      await storage.updateUserSubscription(userSubscription.id, {
        status: 'active',
        currentPeriodStart: startDate,
        currentPeriodEnd: endDate,
        paidAmount: ((invoice.amount_paid || 0) / 100).toString(),
      });

      console.log('✅ Subscription renewed successfully:', {
        subscriptionId: invoice.subscription,
        amount: invoice.amount_paid,
        period: `${startDate.toISOString()} to ${endDate.toISOString()}`
      });
      
    } catch (error) {
      console.error('❌ Error handling invoice payment succeeded:', error);
    }
  }

  async handleInvoicePaymentFailed(invoice: any): Promise<void> {
    try {
      console.log('❌ Processing invoice.payment_failed:', invoice.id);
      
      if (!invoice.subscription) {
        console.log('ℹ️ Invoice not related to subscription, skipping');
        return;
      }

      const { storage } = await import('../storage.js');
      
      // Find user subscription by Stripe ID
      const userSubscriptions = await storage.getUserSubscriptions();
      const userSubscription = userSubscriptions.find((sub: any) => sub.stripeSubscriptionId === invoice.subscription as string);
      
      if (!userSubscription) {
        console.error('❌ User subscription not found for invoice:', invoice.id);
        return;
      }

      // Update subscription to past_due status
      await storage.updateUserSubscription(userSubscription.id, {
        status: 'past_due',
      });

      console.log('⚠️ Subscription marked as past_due:', invoice.subscription);
      
    } catch (error) {
      console.error('❌ Error handling invoice payment failed:', error);
    }
  }
}

export const stripeProductionService = new StripeProductionService();