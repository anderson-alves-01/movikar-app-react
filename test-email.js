// Teste simples do serviço de email
import { EmailService } from './server/services/emailService.js';

async function testEmail() {
  console.log('🧪 Testando serviço de email...');
  
  const emailService = new EmailService();
  
  const testData = {
    bookingId: 'TEST-123',
    vehicleBrand: 'Toyota',
    vehicleModel: 'Corolla',
    startDate: '2025-08-20',
    endDate: '2025-08-25', 
    totalPrice: 250.00,
    renterName: 'João Silva',
    renterEmail: 'joao.silva@example.com',
    ownerName: 'Maria Santos',
    ownerEmail: 'maria.santos@example.com'
  };
  
  try {
    console.log('📧 Enviando email de teste para locatário...');
    const result1 = await emailService.sendBookingConfirmationToRenter(testData);
    console.log('✅ Resultado email locatário:', result1);
    
    console.log('📧 Enviando email de teste para proprietário...');
    const result2 = await emailService.sendBookingNotificationToOwner(testData);
    console.log('✅ Resultado email proprietário:', result2);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testEmail();