import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export class WebhookEndpointManager {
  /**
   * Configura webhook endpoint para produção automaticamente
   */
  static async setupProductionWebhook(): Promise<{
    webhookSecret: string;
    webhookId: string;
  }> {
    try {
      console.log("🔧 Configurando webhook Stripe para produção...");

      // Determinar URL base do ambiente
      const baseUrl = process.env.REPL_SLUG ? 
        `https://${process.env.REPL_SLUG}.${process.env.REPLIT_DEV_DOMAIN || 'replit.app'}` :
        'https://alugae.mobi';

      const webhookUrl = `${baseUrl}/api/webhooks/stripe`;
      
      console.log("🔗 URL do webhook:", webhookUrl);

      // Listar endpoints existentes
      const endpoints = await stripe.webhookEndpoints.list();
      
      // Verificar se já existe endpoint para esta URL
      const existingEndpoint = endpoints.data.find(ep => ep.url === webhookUrl);
      
      if (existingEndpoint) {
        console.log("✅ Webhook endpoint já existe:", existingEndpoint.id);
        
        // Verificar se está ativo
        if (!existingEndpoint.enabled_events.includes('payment_intent.succeeded')) {
          console.log("🔄 Atualizando eventos do webhook...");
          
          const updatedEndpoint = await stripe.webhookEndpoints.update(existingEndpoint.id, {
            enabled_events: [
              'payment_intent.succeeded',
              'payment_intent.payment_failed',
              'invoice.payment_succeeded',
              'customer.subscription.created',
              'customer.subscription.updated',
              'customer.subscription.deleted',
            ]
          });
          
          console.log("✅ Webhook atualizado:", updatedEndpoint.id);
        }
        
        return {
          webhookSecret: existingEndpoint.secret!,
          webhookId: existingEndpoint.id
        };
      }

      // Criar novo endpoint
      console.log("🆕 Criando novo webhook endpoint...");
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
        description: 'alugae.mobi - Webhook para repasses automáticos PIX',
        api_version: '2023-10-16'
      });

      console.log("✅ Webhook endpoint criado com sucesso!");
      console.log("🆔 ID:", endpoint.id);
      console.log("🔑 Secret:", endpoint.secret!.substring(0, 20) + "...");

      return {
        webhookSecret: endpoint.secret!,
        webhookId: endpoint.id
      };

    } catch (error: any) {
      console.error("❌ Erro ao configurar webhook:", error.message);
      
      // Se for erro de permissão, orientar o usuário
      if (error.type === 'invalid_request_error' && error.code === 'webhooks_not_allowed') {
        throw new Error("Conta Stripe não permite webhooks. Ative webhooks no dashboard do Stripe.");
      }
      
      throw error;
    }
  }

  /**
   * Remove webhooks não utilizados
   */
  static async cleanupOldWebhooks(): Promise<number> {
    try {
      const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
      let removedCount = 0;

      // URLs válidas para manter
      const validUrls = [
        'https://alugae.mobi/api/webhooks/stripe',
        `https://${process.env.REPL_SLUG}.${process.env.REPLIT_DEV_DOMAIN || 'replit.app'}/api/webhooks/stripe`
      ].filter(Boolean);

      for (const endpoint of endpoints.data) {
        if (!validUrls.includes(endpoint.url)) {
          console.log("🗑️ Removendo webhook obsoleto:", endpoint.url);
          await stripe.webhookEndpoints.del(endpoint.id);
          removedCount++;
        }
      }

      if (removedCount > 0) {
        console.log(`✅ ${removedCount} webhooks obsoletos removidos`);
      }

      return removedCount;

    } catch (error) {
      console.error("❌ Erro ao limpar webhooks:", error);
      return 0;
    }
  }

  /**
   * Verifica saúde dos webhooks configurados
   */
  static async checkWebhookHealth(): Promise<{
    healthy: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      const endpoints = await stripe.webhookEndpoints.list();
      
      if (endpoints.data.length === 0) {
        issues.push("Nenhum webhook configurado");
        recommendations.push("Configure webhooks para automação de repasses");
        return { healthy: false, issues, recommendations };
      }

      // Verificar eventos necessários
      const requiredEvents = [
        'payment_intent.succeeded',
        'payment_intent.payment_failed'
      ];

      let hasValidWebhook = false;
      
      for (const endpoint of endpoints.data) {
        const hasRequiredEvents = requiredEvents.every(event => 
          endpoint.enabled_events.includes(event)
        );
        
        if (hasRequiredEvents) {
          hasValidWebhook = true;
          break;
        }
      }

      if (!hasValidWebhook) {
        issues.push("Webhooks não têm eventos necessários configurados");
        recommendations.push("Configure eventos: payment_intent.succeeded, payment_intent.payment_failed");
      }

      return {
        healthy: issues.length === 0,
        issues,
        recommendations
      };

    } catch (error) {
      issues.push("Erro ao verificar webhooks");
      return { healthy: false, issues, recommendations };
    }
  }
}