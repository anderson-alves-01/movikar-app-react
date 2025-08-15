import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY environment variable must be set");
}

const resend = new Resend(process.env.RESEND_API_KEY);

interface RentNowEmailParams {
  ownerName: string;
  ownerEmail: string;
  renterName: string;
  renterEmail: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  startDate: string;
  endDate: string;
  totalPrice: string;
  bookingId: string;
}

export async function sendRentNowNotification(params: RentNowEmailParams): Promise<boolean> {
  try {
    const startDateFormatted = new Date(params.startDate).toLocaleDateString('pt-BR');
    const endDateFormatted = new Date(params.endDate).toLocaleDateString('pt-BR');
    
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nova Solicitação de Aluguel - alugae.mobi</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .vehicle-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .highlight { background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; }
          .footer { text-align: center; margin-top: 30px; color: #666; }
          .button { background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚗 Nova Solicitação de Aluguel</h1>
            <p>alugae.mobi</p>
          </div>
          
          <div class="content">
            <p>Olá <strong>${params.ownerName}</strong>,</p>
            
            <p>Você recebeu uma nova solicitação de aluguel através do botão "Alugar agora"!</p>
            
            <div class="highlight">
              <h3>⚡ Ação Imediata Necessária</h3>
              <p>As datas foram automaticamente bloqueadas no seu calendário. Você tem 24 horas para aceitar ou recusar esta solicitação.</p>
            </div>
            
            <div class="vehicle-info">
              <h3>📋 Detalhes da Solicitação</h3>
              <p><strong>Veículo:</strong> ${params.vehicleBrand} ${params.vehicleModel} ${params.vehicleYear}</p>
              <p><strong>Locatário:</strong> ${params.renterName} (${params.renterEmail})</p>
              <p><strong>Período:</strong> ${startDateFormatted} até ${endDateFormatted}</p>
              <p><strong>Valor Total:</strong> R$ ${params.totalPrice}</p>
              <p><strong>ID da Reserva:</strong> #${params.bookingId}</p>
            </div>
            
            <p><strong>Próximos passos:</strong></p>
            <ol>
              <li>Acesse sua conta no alugae.mobi</li>
              <li>Revise os detalhes da solicitação</li>
              <li>Aceite ou recuse até 24h</li>
              <li>Se aceitar, entre em contato com o locatário</li>
            </ol>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://alugae.mobi/owner-dashboard" class="button">Gerenciar Solicitação</a>
            </div>
            
            <div class="footer">
              <p>📧 Email automático do sistema alugae.mobi</p>
              <p>Não responda este email. Para suporte, acesse nossa plataforma.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await resend.emails.send({
      from: 'alugae.mobi <noreply@alugae.mobi>',
      to: [params.ownerEmail],
      subject: `🚗 Nova Solicitação: ${params.vehicleBrand} ${params.vehicleModel} - ${startDateFormatted} a ${endDateFormatted}`,
      html: emailHtml,
    });

    console.log(`✅ Email enviado para proprietário: ${params.ownerEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    return false;
  }
}

interface RentRequestConfirmationParams {
  renterName: string;
  renterEmail: string;
  ownerName: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  startDate: string;
  endDate: string;
  totalPrice: string;
  bookingId: string;
}

export async function sendRentRequestConfirmation(params: RentRequestConfirmationParams): Promise<boolean> {
  try {
    const startDateFormatted = new Date(params.startDate).toLocaleDateString('pt-BR');
    const endDateFormatted = new Date(params.endDate).toLocaleDateString('pt-BR');
    
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Solicitação Enviada - alugae.mobi</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .vehicle-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .highlight { background: #dcfce7; padding: 15px; border-radius: 8px; border-left: 4px solid #059669; }
          .footer { text-align: center; margin-top: 30px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Solicitação Enviada!</h1>
            <p>alugae.mobi</p>
          </div>
          
          <div class="content">
            <p>Olá <strong>${params.renterName}</strong>,</p>
            
            <p>Sua solicitação de aluguel foi enviada com sucesso!</p>
            
            <div class="highlight">
              <h3>⏰ Status da Solicitação</h3>
              <p>As datas foram bloqueadas temporariamente. O proprietário ${params.ownerName} tem até 24 horas para responder.</p>
            </div>
            
            <div class="vehicle-info">
              <h3>📋 Resumo da Solicitação</h3>
              <p><strong>Veículo:</strong> ${params.vehicleBrand} ${params.vehicleModel} ${params.vehicleYear}</p>
              <p><strong>Proprietário:</strong> ${params.ownerName}</p>
              <p><strong>Período:</strong> ${startDateFormatted} até ${endDateFormatted}</p>
              <p><strong>Valor Total:</strong> R$ ${params.totalPrice}</p>
              <p><strong>ID da Reserva:</strong> #${params.bookingId}</p>
            </div>
            
            <p><strong>O que acontece agora:</strong></p>
            <ol>
              <li>Notificamos o proprietário sobre sua solicitação</li>
              <li>Você receberá um email quando ele responder</li>
              <li>Se aprovado, prosseguiremos com o pagamento</li>
              <li>Se recusado, as datas serão liberadas automaticamente</li>
            </ol>
            
            <div class="footer">
              <p>📧 Email automático do sistema alugae.mobi</p>
              <p>Acompanhe o status na sua conta: https://alugae.mobi/bookings</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await resend.emails.send({
      from: 'alugae.mobi <noreply@alugae.mobi>',
      to: [params.renterEmail],
      subject: `✅ Solicitação Enviada: ${params.vehicleBrand} ${params.vehicleModel} - Aguardando Resposta`,
      html: emailHtml,
    });

    console.log(`✅ Email de confirmação enviado para locatário: ${params.renterEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar email de confirmação:', error);
    return false;
  }
}