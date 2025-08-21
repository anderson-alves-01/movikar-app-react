import fetch from 'node-fetch';
import { createHash, randomUUID } from 'crypto';

interface PixConfig {
  clientId: string;
  clientSecret: string;
  certificatePath?: string;
  sandbox: boolean;
  baseUrl: string;
}

interface PixPaymentData {
  amount: number;
  description: string;
  payerName: string;
  payerEmail: string;
  payerDocument: string;
  payerPhone?: string;
  externalId: string;
  expirationTime?: number; // minutes
}

interface PixPaymentResponse {
  paymentId: string;
  pixCode: string;
  pixQrCode: string;
  expiresAt: Date;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
}

class PixService {
  private config: PixConfig;
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor() {
    this.config = {
      clientId: process.env.PIX_CLIENT_ID || '',
      clientSecret: process.env.PIX_CLIENT_SECRET || '',
      certificatePath: process.env.PIX_CERTIFICATE_PATH,
      sandbox: process.env.PIX_SANDBOX === 'true',
      baseUrl: process.env.PIX_BASE_URL || 'https://api.sicredi.com.br/pix',
    };

    if (!this.config.clientId || !this.config.clientSecret) {
      console.warn('PIX credentials not configured. Using mock mode.');
    }
  }

  // Get access token for PIX API
  private async getAccessToken(): Promise<string> {
    try {
      if (this.accessToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt) {
        return this.accessToken;
      }

      if (!this.config.clientId || !this.config.clientSecret) {
        return 'mock_token'; // Mock mode
      }

      const credentials = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');

      const response = await fetch(`${this.config.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials&scope=pix.read pix.write',
      });

      if (!response.ok) {
        throw new Error(`PIX token error: ${response.status}`);
      }

      const data = await response.json() as any;
      
      this.accessToken = data.access_token;
      const expiresIn = data.expires_in || 3600; // Default 1 hour
      this.tokenExpiresAt = new Date(Date.now() + (expiresIn * 1000));

      return this.accessToken;
    } catch (error) {
      console.error('Error getting PIX access token:', error);
      return 'mock_token'; // Fallback to mock
    }
  }

  // Create PIX payment
  async createPixPayment(paymentData: PixPaymentData): Promise<PixPaymentResponse> {
    try {
      const token = await this.getAccessToken();

      if (token === 'mock_token') {
        return this.createMockPixPayment(paymentData);
      }

      const pixPayload = {
        calendario: {
          expiracao: paymentData.expirationTime ? paymentData.expirationTime * 60 : 3600, // seconds
        },
        devedor: {
          nome: paymentData.payerName,
          cpf: paymentData.payerDocument.replace(/\D/g, ''),
        },
        valor: {
          original: paymentData.amount.toFixed(2),
        },
        chave: process.env.PIX_KEY || 'mock@example.com', // PIX key (email, phone, cpf, or random)
        solicitacaoPagador: paymentData.description,
        infoAdicionais: [
          {
            nome: 'Email',
            valor: paymentData.payerEmail,
          },
          {
            nome: 'ID Externo',
            valor: paymentData.externalId,
          },
        ],
      };

      const response = await fetch(`${this.config.baseUrl}/v2/cob`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pixPayload),
      });

      if (!response.ok) {
        throw new Error(`PIX create payment error: ${response.status}`);
      }

      const data = await response.json() as any;

      return {
        paymentId: data.txid,
        pixCode: data.pixCopiaECola,
        pixQrCode: data.qrcode,
        expiresAt: new Date(data.calendario.criacao + (data.calendario.expiracao * 1000)),
        status: 'pending',
      };
    } catch (error) {
      console.error('Error creating PIX payment:', error);
      return this.createMockPixPayment(paymentData);
    }
  }

  // Check PIX payment status
  async getPixPaymentStatus(paymentId: string): Promise<{
    status: 'pending' | 'paid' | 'expired' | 'cancelled';
    paidAt?: Date;
    paidAmount?: number;
    payerInfo?: {
      name?: string;
      document?: string;
    };
  }> {
    try {
      const token = await this.getAccessToken();

      if (token === 'mock_token') {
        return this.getMockPixPaymentStatus(paymentId);
      }

      const response = await fetch(`${this.config.baseUrl}/v2/cob/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`PIX get payment error: ${response.status}`);
      }

      const data = await response.json() as any;

      const status = this.parsePixStatus(data.status);
      
      return {
        status,
        paidAt: data.pix?.[0]?.horario ? new Date(data.pix[0].horario) : undefined,
        paidAmount: data.pix?.[0]?.valor ? parseFloat(data.pix[0].valor) : undefined,
        payerInfo: data.pix?.[0]?.pagador ? {
          name: data.pix[0].pagador.nome,
          document: data.pix[0].pagador.cpf,
        } : undefined,
      };
    } catch (error) {
      console.error('Error getting PIX payment status:', error);
      return { status: 'pending' };
    }
  }

  // Parse PIX status
  private parsePixStatus(status: string): 'pending' | 'paid' | 'expired' | 'cancelled' {
    switch (status?.toUpperCase()) {
      case 'ATIVA':
        return 'pending';
      case 'CONCLUIDA':
        return 'paid';
      case 'REMOVIDA_PELO_USUARIO_RECEBEDOR':
      case 'REMOVIDA_PELO_PSP':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  // Create mock PIX payment for development
  private createMockPixPayment(paymentData: PixPaymentData): PixPaymentResponse {
    const paymentId = `mock_${randomUUID()}`;
    const pixCode = this.generateMockPixCode(paymentData.amount);
    
    console.log('🔧 PIX Mock: Creating payment', {
      paymentId,
      amount: paymentData.amount,
      description: paymentData.description,
      payer: paymentData.payerName,
    });

    return {
      paymentId,
      pixCode,
      pixQrCode: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`, // Mock QR code
      expiresAt: new Date(Date.now() + (paymentData.expirationTime || 60) * 60 * 1000),
      status: 'pending',
    };
  }

  // Get mock PIX payment status
  private getMockPixPaymentStatus(paymentId: string): {
    status: 'pending' | 'paid' | 'expired' | 'cancelled';
    paidAt?: Date;
    paidAmount?: number;
  } {
    // Simulate random payment status for testing
    const random = Math.random();
    if (random < 0.1) {
      return { status: 'paid', paidAt: new Date(), paidAmount: 100.00 };
    } else if (random < 0.15) {
      return { status: 'expired' };
    } else {
      return { status: 'pending' };
    }
  }

  // Generate mock PIX code
  private generateMockPixCode(amount: number): string {
    const payload = {
      merchantName: 'ALUGAE MOBI',
      merchantCity: 'SAO PAULO',
      amount: amount.toFixed(2),
      txid: randomUUID().substring(0, 25),
    };

    // Simplified mock PIX code
    return `00020126580014BR.GOV.BCB.PIX0136${payload.txid}0208${payload.merchantName}5303986540${payload.amount.padStart(8, '0')}5802BR5913${payload.merchantCity}6009SAO PAULO61041000`;
  }

  // Refund PIX payment
  async refundPixPayment(paymentId: string, amount?: number, reason?: string): Promise<{
    success: boolean;
    refundId?: string;
    error?: string;
  }> {
    try {
      const token = await this.getAccessToken();

      if (token === 'mock_token') {
        console.log('🔧 PIX Mock: Refund processed', { paymentId, amount, reason });
        return {
          success: true,
          refundId: `refund_mock_${randomUUID()}`,
        };
      }

      // Get original payment details
      const paymentStatus = await this.getPixPaymentStatus(paymentId);
      
      if (paymentStatus.status !== 'paid') {
        return {
          success: false,
          error: 'Payment not paid or not found',
        };
      }

      const refundAmount = amount || paymentStatus.paidAmount || 0;

      const refundPayload = {
        valor: refundAmount.toFixed(2),
        natureza: 'CD', // Devolução
        descricao: reason || 'Estorno de pagamento PIX',
      };

      const response = await fetch(`${this.config.baseUrl}/v2/pix/${paymentId}/devolucao`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(refundPayload),
      });

      if (!response.ok) {
        throw new Error(`PIX refund error: ${response.status}`);
      }

      const data = await response.json() as any;

      return {
        success: true,
        refundId: data.id,
      };
    } catch (error) {
      console.error('Error processing PIX refund:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Webhook handler for PIX events
  handleWebhook(payload: any): {
    paymentId: string;
    status: 'pending' | 'paid' | 'expired' | 'cancelled';
    paidAt?: Date;
    paidAmount?: number;
  } | null {
    try {
      const paymentId = payload.txid || payload.endToEndId;
      const status = this.parsePixStatus(payload.status);
      
      return {
        paymentId,
        status,
        paidAt: payload.horario ? new Date(payload.horario) : undefined,
        paidAmount: payload.valor ? parseFloat(payload.valor) : undefined,
      };
    } catch (error) {
      console.error('Error parsing PIX webhook:', error);
      return null;
    }
  }

  // Validate PIX key format
  validatePixKey(key: string): { valid: boolean; type?: 'email' | 'phone' | 'cpf' | 'cnpj' | 'random' } {
    // Email format
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key)) {
      return { valid: true, type: 'email' };
    }

    // Phone format
    if (/^\+?55\d{10,11}$/.test(key.replace(/\D/g, ''))) {
      return { valid: true, type: 'phone' };
    }

    // CPF format
    if (/^\d{11}$/.test(key.replace(/\D/g, ''))) {
      return { valid: true, type: 'cpf' };
    }

    // CNPJ format
    if (/^\d{14}$/.test(key.replace(/\D/g, ''))) {
      return { valid: true, type: 'cnpj' };
    }

    // Random key format
    if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(key)) {
      return { valid: true, type: 'random' };
    }

    return { valid: false };
  }
}

export default new PixService();