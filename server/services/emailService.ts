import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface BookingEmailData {
  bookingId: string;
  vehicleBrand: string;
  vehicleModel: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  renterName: string;
  renterEmail: string;
  ownerName: string;
  ownerEmail: string;
}

export class EmailService {
  constructor() {
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY não configurado - e-mails não serão enviados');
    }
  }
  private fromEmail = 'onboarding@resend.dev'; // Domínio verificado do Resend para testes

  async sendBookingConfirmationToRenter(data: BookingEmailData): Promise<boolean> {
    try {
      console.log('📧 Tentativa de envio de e-mail para locatário:', data.renterEmail);
      console.log('📧 Dados do e-mail:', { 
        bookingId: data.bookingId, 
        vehicle: `${data.vehicleBrand} ${data.vehicleModel}`,
        period: `${data.startDate} - ${data.endDate}`,
        price: data.totalPrice 
      });
      
      if (!process.env.RESEND_API_KEY) {
        console.error('❌ RESEND_API_KEY não está configurado!');
        return false;
      }

      // Para desenvolvimento, usar email do proprietário da conta Resend
      const testEmail = 'asouzamax@gmail.com';
      console.log(`📧 Modo de desenvolvimento: enviando para ${testEmail} ao invés de ${data.renterEmail}`);

      const result = await resend.emails.send({
        from: this.fromEmail,
        to: testEmail,
        subject: `[TESTE] Reserva Confirmada - ${data.vehicleBrand} ${data.vehicleModel}`,
        html: this.generateRenterConfirmationEmail(data)
      });
      
      console.log('✅ E-mail enviado para locatário com sucesso. ID:', result.data?.id);
      console.log('📧 Email original seria para:', data.renterEmail);
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar e-mail para locatário:', error);
      console.error('❌ Detalhes do erro:', JSON.stringify(error, null, 2));
      return false;
    }
  }

  async sendBookingNotificationToOwner(data: BookingEmailData): Promise<boolean> {
    try {
      console.log('📧 Tentativa de envio de e-mail para proprietário:', data.ownerEmail);
      console.log('📧 Dados do e-mail:', { 
        bookingId: data.bookingId, 
        vehicle: `${data.vehicleBrand} ${data.vehicleModel}`,
        renter: data.renterName,
        period: `${data.startDate} - ${data.endDate}`,
        price: data.totalPrice 
      });
      
      if (!process.env.RESEND_API_KEY) {
        console.error('❌ RESEND_API_KEY não está configurado!');
        return false;
      }

      // Para desenvolvimento, usar email do proprietário da conta Resend
      const testEmail = 'asouzamax@gmail.com';
      console.log(`📧 Modo de desenvolvimento: enviando para ${testEmail} ao invés de ${data.ownerEmail}`);

      const result = await resend.emails.send({
        from: this.fromEmail,
        to: testEmail,
        subject: `[TESTE] Nova Reserva - ${data.vehicleBrand} ${data.vehicleModel}`,
        html: this.generateOwnerNotificationEmail(data)
      });
      
      console.log('✅ E-mail enviado para proprietário com sucesso. ID:', result.data?.id);
      console.log('📧 Email original seria para:', data.ownerEmail);
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar e-mail para proprietário:', error);
      console.error('❌ Detalhes do erro:', JSON.stringify(error, null, 2));
      return false;
    }
  }

  private generateRenterConfirmationEmail(data: BookingEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reserva Confirmada</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #eee; }
          .total { font-weight: bold; font-size: 18px; color: #dc2626; }
          .footer { text-align: center; margin-top: 30px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚗 Reserva Confirmada!</h1>
            <p>Sua reserva foi criada com sucesso</p>
          </div>
          <div class="content">
            <p>Olá <strong>${data.renterName}</strong>,</p>
            <p>Sua reserva do veículo foi confirmada! Aqui estão os detalhes:</p>
            
            <div class="booking-details">
              <h3>Detalhes da Reserva</h3>
              <div class="detail-row">
                <span>Reserva ID:</span>
                <span><strong>#${data.bookingId}</strong></span>
              </div>
              <div class="detail-row">
                <span>Veículo:</span>
                <span><strong>${data.vehicleBrand} ${data.vehicleModel}</strong></span>
              </div>
              <div class="detail-row">
                <span>Data de Retirada:</span>
                <span>${data.startDate}</span>
              </div>
              <div class="detail-row">
                <span>Data de Devolução:</span>
                <span>${data.endDate}</span>
              </div>
              <div class="detail-row total">
                <span>Valor Total:</span>
                <span>R$ ${data.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            
            <h3>Próximos Passos:</h3>
            <ul>
              <li>O proprietário entrará em contato para combinar os detalhes</li>
              <li>Tenha seus documentos em ordem (CNH válida)</li>
              <li>Chegue no horário combinado para retirada</li>
            </ul>
            
            <p>Você pode acompanhar sua reserva na área <strong>Minhas Reservas</strong> em nosso site.</p>
            
            <div class="footer">
              <p>Obrigado por escolher o alugae.mobi!</p>
              <p>Em caso de dúvidas, entre em contato: <a href="mailto:suporte@alugae.mobi">suporte@alugae.mobi</a></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateOwnerNotificationEmail(data: BookingEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Nova Reserva Recebida</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #eee; }
          .total { font-weight: bold; font-size: 18px; color: #dc2626; }
          .action-button { background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Nova Reserva!</h1>
            <p>Você recebeu uma nova solicitação de reserva</p>
          </div>
          <div class="content">
            <p>Olá <strong>${data.ownerName}</strong>,</p>
            <p>Você recebeu uma nova reserva para seu veículo! Aqui estão os detalhes:</p>
            
            <div class="booking-details">
              <h3>Detalhes da Reserva</h3>
              <div class="detail-row">
                <span>Reserva ID:</span>
                <span><strong>#${data.bookingId}</strong></span>
              </div>
              <div class="detail-row">
                <span>Veículo:</span>
                <span><strong>${data.vehicleBrand} ${data.vehicleModel}</strong></span>
              </div>
              <div class="detail-row">
                <span>Locatário:</span>
                <span><strong>${data.renterName}</strong></span>
              </div>
              <div class="detail-row">
                <span>E-mail do Locatário:</span>
                <span>${data.renterEmail}</span>
              </div>
              <div class="detail-row">
                <span>Data de Retirada:</span>
                <span>${data.startDate}</span>
              </div>
              <div class="detail-row">
                <span>Data de Devolução:</span>
                <span>${data.endDate}</span>
              </div>
              <div class="detail-row total">
                <span>Valor Total:</span>
                <span>R$ ${data.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            
            <h3>Próximos Passos:</h3>
            <ul>
              <li>Entre em contato com o locatário para combinar os detalhes</li>
              <li>Confirme horário e local de entrega</li>
              <li>Prepare a documentação do veículo</li>
              <li>Realize a vistoria prévia</li>
            </ul>
            
            <a href="mailto:${data.renterEmail}" class="action-button">Entrar em Contato com o Locatário</a>
            
            <p>Você pode gerenciar todas as suas reservas na área <strong>Meus Veículos</strong> em nosso site.</p>
            
            <div class="footer">
              <p>Obrigado por usar o alugae.mobi!</p>
              <p>Em caso de dúvidas, entre em contato: <a href="mailto:suporte@alugae.mobi">suporte@alugae.mobi</a></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();