import { Resend } from 'resend';

interface EmailNotificationData {
  title: string;
  body: string;
  data?: any;
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
}

export default new EmailService();