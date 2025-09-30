import { Resend } from 'resend';

interface EmailNotificationData {
  title: string;
  body: string;
  data?: any;
}

export interface BookingEmailData {
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear?: number;
  startDate: string;
  endDate: string;
  totalPrice: number;
  bookingId: string;
  ownerName?: string;
  renterName?: string;
  renterEmail?: string;
  ownerEmail?: string;
  vehiclePlate?: string;
}

class EmailService {
  private resend: Resend | null = null;
  private fromEmail: string;

  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@alugae.mobi';
    
    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
    } else {
      console.log('⚠️ RESEND_API_KEY não encontrada - serviço de email desabilitado');
    }
  }

  async sendNotificationEmail(
    userEmail: string,
    userName: string,
    notificationData: EmailNotificationData
  ): Promise<boolean> {
    if (!this.resend) {
      console.log('📧 Resend não configurado - email não enviado');
      return false;
    }

    try {
      const emailContent = this.generateEmailTemplate(userName, notificationData);
      
      await this.resend.emails.send({
        from: this.fromEmail,
        to: userEmail,
        subject: notificationData.title,
        html: emailContent,
        text: this.generateTextContent(notificationData),
      });

      console.log(`📧 Email enviado para ${userEmail}: ${notificationData.title}`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao enviar email para ${userEmail}:`, error);
      return false;
    }
  }

  async sendBulkNotificationEmails(
    recipients: Array<{ email: string; name: string }>,
    notificationData: EmailNotificationData
  ): Promise<{ successCount: number; errors: string[] }> {
    if (!this.resend) {
      console.log('📧 Resend não configurado - emails não enviados');
      return { successCount: 0, errors: ['Resend não configurado'] };
    }

    let successCount = 0;
    const errors: string[] = [];

    for (const recipient of recipients) {
      try {
        const success = await this.sendNotificationEmail(
          recipient.email,
          recipient.name,
          notificationData
        );
        if (success) {
          successCount++;
        } else {
          errors.push(`Falha ao enviar para ${recipient.email}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
        errors.push(`${recipient.email}: ${errorMsg}`);
      }

      // Pequeno delay entre envios para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return { successCount, errors };
  }

  private generateEmailTemplate(userName: string, notificationData: EmailNotificationData): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${notificationData.title}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            border-radius: 10px 10px 0 0;
            margin: -20px -20px 20px -20px;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 300;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .content {
            padding: 20px 0;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #555;
        }
        .message-title {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
            border-left: 4px solid #667eea;
            padding-left: 15px;
        }
        .message-body {
            font-size: 16px;
            line-height: 1.8;
            color: #666;
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #888;
            font-size: 14px;
        }
        .app-link {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 12px 25px;
            border-radius: 25px;
            margin-top: 20px;
            font-weight: bold;
            transition: transform 0.2s;
        }
        .app-link:hover {
            transform: translateY(-2px);
        }
        .notification-badge {
            background-color: #ff4757;
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 15px;
            display: inline-block;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🚗 alugae.mobi</div>
            <h1>Nova Notificação</h1>
        </div>
        
        <div class="content">
            <div class="notification-badge">📱 NOVA MENSAGEM</div>
            <div class="greeting">Olá, ${userName}!</div>
            
            <div class="message-title">${notificationData.title}</div>
            
            <div class="message-body">
                ${notificationData.body.replace(/\n/g, '<br>')}
            </div>
            
            <div style="text-align: center;">
                <a href="https://alugae.mobi" class="app-link">
                    📱 Abrir App alugae.mobi
                </a>
            </div>
        </div>
        
        <div class="footer">
            <p>Esta mensagem foi enviada pela equipe alugae.mobi</p>
            <p>📧 Para não receber mais emails, acesse suas configurações no app</p>
            <p style="margin-top: 15px; color: #bbb;">
                © ${new Date().getFullYear()} alugae.mobi - Plataforma de Aluguel de Carros
            </p>
        </div>
    </div>
</body>
</html>`;
  }

  private generateTextContent(notificationData: EmailNotificationData): string {
    return `
alugae.mobi - Nova Notificação

${notificationData.title}

${notificationData.body}

---
Acesse o app: https://alugae.mobi

Esta mensagem foi enviada pela equipe alugae.mobi.
Para não receber mais emails, acesse suas configurações no app.

© ${new Date().getFullYear()} alugae.mobi - Plataforma de Aluguel de Carros
`;
  }

  async sendBookingConfirmationToRenter(
    renterEmail: string,
    renterName: string,
    bookingData: BookingEmailData
  ): Promise<boolean> {
    const emailData: EmailNotificationData = {
      title: `Reserva Confirmada - ${bookingData.vehicleBrand} ${bookingData.vehicleModel}`,
      body: `Olá ${renterName}!\n\nSua reserva foi confirmada com sucesso!\n\nDetalhes da reserva:\n• Veículo: ${bookingData.vehicleBrand} ${bookingData.vehicleModel}${bookingData.vehicleYear ? ' ' + bookingData.vehicleYear : ''}\n• Período: ${bookingData.startDate} até ${bookingData.endDate}\n• Valor total: R$ ${bookingData.totalPrice.toFixed(2)}\n• ID da reserva: #${bookingData.bookingId}\n\nEm breve o proprietário entrará em contato para combinar os detalhes da retirada.`,
      data: bookingData
    };

    return this.sendNotificationEmail(renterEmail, renterName, emailData);
  }

  async sendBookingNotificationToOwner(
    ownerEmail: string,
    ownerName: string,
    bookingData: BookingEmailData
  ): Promise<boolean> {
    const emailData: EmailNotificationData = {
      title: `Nova Reserva - ${bookingData.vehicleBrand} ${bookingData.vehicleModel}`,
      body: `Olá ${ownerName}!\n\nVocê recebeu uma nova reserva!\n\nDetalhes da reserva:\n• Veículo: ${bookingData.vehicleBrand} ${bookingData.vehicleModel}${bookingData.vehicleYear ? ' ' + bookingData.vehicleYear : ''}\n• Locatário: ${bookingData.renterName || 'Nome não informado'}\n• Período: ${bookingData.startDate} até ${bookingData.endDate}\n• Valor total: R$ ${bookingData.totalPrice.toFixed(2)}\n• ID da reserva: #${bookingData.bookingId}\n\nAcesse o app para confirmar a reserva e combinar os detalhes com o locatário.`,
      data: bookingData
    };

    return this.sendNotificationEmail(ownerEmail, ownerName, emailData);
  }

  async sendSubscriptionConfirmationEmail(
    userEmail: string,
    userName: string,
    subscriptionData: {
      planName: string;
      paymentMethod: string;
      amount: number;
      endDate: string;
      vehicleCount?: number;
    }
  ): Promise<boolean> {
    const emailData: EmailNotificationData = {
      title: `🎉 Assinatura Ativada - Plano ${subscriptionData.planName}`,
      body: `Olá ${userName}!\n\nSua assinatura foi ativada com sucesso!\n\nDetalhes da assinatura:\n• Plano: ${subscriptionData.planName}\n• Pagamento: ${subscriptionData.paymentMethod === 'monthly' ? 'Mensal' : 'Anual'}\n• Valor pago: R$ ${subscriptionData.amount.toFixed(2)}\n• Válido até: ${subscriptionData.endDate}${subscriptionData.vehicleCount ? `\n• Veículos: ${subscriptionData.vehicleCount === -1 ? 'Ilimitados' : subscriptionData.vehicleCount}` : ''}\n\n🚗 Agora você pode aproveitar todos os benefícios do seu plano!\n\nAcesse o app para começar a listar seus veículos e gerenciar suas reservas.`,
      data: subscriptionData
    };

    return this.sendNotificationEmail(userEmail, userName, emailData);
  }

  async sendContactUnlockNotificationToOwner(
    ownerEmail: string,
    ownerName: string,
    unlockData: {
      renterName: string;
      vehicleBrand: string;
      vehicleModel: string;
      vehicleYear?: number;
    }
  ): Promise<boolean> {
    const emailData: EmailNotificationData = {
      title: `💬 Novo Interesse - ${unlockData.renterName} desbloqueou seu contato`,
      body: `Olá ${ownerName}!\n\nBoas notícias! ${unlockData.renterName} demonstrou interesse em seu veículo e desbloqueou suas informações de contato.\n\nDetalhes:\n• Veículo: ${unlockData.vehicleBrand} ${unlockData.vehicleModel}${unlockData.vehicleYear ? ' ' + unlockData.vehicleYear : ''}\n• Interessado: ${unlockData.renterName}\n• Data: ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}\n\n📞 ${unlockData.renterName} agora tem acesso ao seu telefone e email. Aguarde o contato ou entre em contato diretamente para discutir os detalhes do aluguel.\n\nAcesse o app para ver mais informações sobre este interessado.`,
      data: unlockData
    };

    return this.sendNotificationEmail(ownerEmail, ownerName, emailData);
  }

  async sendChatStartNotificationToOwner(
    ownerEmail: string,
    ownerName: string,
    chatData: {
      renterName: string;
      vehicleBrand: string;
      vehicleModel: string;
      vehicleYear?: number;
    }
  ): Promise<boolean> {
    const emailData: EmailNotificationData = {
      title: `💬 Nova Conversa - ${chatData.renterName} quer falar com você`,
      body: `Olá ${ownerName}!\n\n${chatData.renterName} iniciou uma conversa sobre seu veículo.\n\nDetalhes:\n• Veículo: ${chatData.vehicleBrand} ${chatData.vehicleModel}${chatData.vehicleYear ? ' ' + chatData.vehicleYear : ''}\n• Interessado: ${chatData.renterName}\n• Data: ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}\n\n💬 Responda rapidamente para aumentar suas chances de fechar o aluguel!\n\nAcesse o app para ver a mensagem e responder.`,
      data: chatData
    };

    return this.sendNotificationEmail(ownerEmail, ownerName, emailData);
  }

  async sendWaitingQueueNotificationToOwner(
    ownerEmail: string,
    ownerName: string,
    queueData: {
      renterName: string;
      vehicleBrand: string;
      vehicleModel: string;
      vehicleYear?: number;
      startDate: string;
      endDate: string;
    }
  ): Promise<boolean> {
    const emailData: EmailNotificationData = {
      title: `⏰ Lista de Espera - ${queueData.renterName} entrou na fila`,
      body: `Olá ${ownerName}!\n\n${queueData.renterName} entrou na lista de espera do seu veículo.\n\nDetalhes:\n• Veículo: ${queueData.vehicleBrand} ${queueData.vehicleModel}${queueData.vehicleYear ? ' ' + queueData.vehicleYear : ''}\n• Interessado: ${queueData.renterName}\n• Período desejado: ${queueData.startDate} até ${queueData.endDate}\n• Data de entrada na fila: ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}\n\n📋 Este cliente demonstrou grande interesse! Quando o período ficar disponível, ele será notificado automaticamente.\n\nAcesse o app para gerenciar sua lista de espera.`,
      data: queueData
    };

    return this.sendNotificationEmail(ownerEmail, ownerName, emailData);
  }
}

export default new EmailService();

export type SubscriptionEmailData = {
  planName: string;
  paymentMethod: string;
  amount: number;
  endDate: string;
  vehicleCount?: number;
};