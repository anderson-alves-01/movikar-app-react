import fetch from 'node-fetch';
import { createHash } from 'crypto';

interface D4SignConfig {
  baseUrl: string;
  token: string;
  cryptKey: string;
}

interface DocumentData {
  templateId: string;
  signers: {
    name: string;
    email: string;
    phone?: string;
    documentType?: string;
    documentNumber?: string;
  }[];
  variables: Record<string, string>;
}

interface ContractVariables {
  locadorNome: string;
  locadorCpf: string;
  locadorEmail: string;
  locadorTelefone: string;
  locatarioNome: string;
  locatarioCpf: string;
  locatarioEmail: string;
  locatarioTelefone: string;
  veiculoMarca: string;
  veiculoModelo: string;
  veiculoAno: string;
  veiculoPlaca: string;
  valorDiaria: string;
  dataInicio: string;
  dataFim: string;
  valorTotal: string;
  observacoes?: string;
}

class D4SignService {
  private config: D4SignConfig;

  constructor() {
    this.config = {
      baseUrl: process.env.D4SIGN_BASE_URL || 'https://secure.d4sign.com.br/api/v1',
      token: process.env.D4SIGN_TOKEN || '',
      cryptKey: process.env.D4SIGN_CRYPT_KEY || '',
    };

    if (!this.config.token || !this.config.cryptKey) {
      console.warn('D4Sign credentials not configured. Using mock mode.');
    }
  }

  // Generate timestamp for D4Sign API
  private generateTimestamp(): string {
    return Math.floor(Date.now() / 1000).toString();
  }

  // Generate signature for D4Sign API
  private generateSignature(token: string, timestamp: string): string {
    const data = `${token}${timestamp}`;
    return createHash('sha256').update(data + this.config.cryptKey).digest('hex');
  }

  // Create document from template
  async createDocumentFromTemplate(
    templateId: string,
    variables: ContractVariables,
    signers: { name: string; email: string; phone?: string }[]
  ): Promise<{ documentId: string; linkSigning: string }> {
    try {
      if (!this.config.token || !this.config.cryptKey) {
        // Mock response for development
        return this.createMockDocument(variables, signers);
      }

      const timestamp = this.generateTimestamp();
      const signature = this.generateSignature(this.config.token, timestamp);

      // Create document from template
      const createResponse = await fetch(`${this.config.baseUrl}/documents/${templateId}/makedocumentbytemplate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'tokenAPI': this.config.token,
          'cryptKey': signature,
          'timestamp': timestamp,
        },
        body: JSON.stringify(variables),
      });

      if (!createResponse.ok) {
        throw new Error(`D4Sign create document error: ${createResponse.status}`);
      }

      const createData = await createResponse.json() as any;
      const documentId = createData.uuid;

      // Add signers to document
      for (const signer of signers) {
        await this.addSignerToDocument(documentId, signer);
      }

      // Send document for signing
      const sendResponse = await this.sendDocumentForSigning(documentId);

      return {
        documentId,
        linkSigning: sendResponse.linkSigning,
      };
    } catch (error) {
      console.error('Error creating D4Sign document:', error);
      // Return mock on error
      return this.createMockDocument(variables, signers);
    }
  }

  // Add signer to document
  private async addSignerToDocument(
    documentId: string,
    signer: { name: string; email: string; phone?: string }
  ): Promise<void> {
    const timestamp = this.generateTimestamp();
    const signature = this.generateSignature(this.config.token, timestamp);

    const response = await fetch(`${this.config.baseUrl}/documents/${documentId}/createlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'tokenAPI': this.config.token,
        'cryptKey': signature,
        'timestamp': timestamp,
      },
      body: JSON.stringify({
        email: signer.email,
        act: '1', // Assign to sign
        foreign: '0', // Not foreign
        certificateemail: signer.email,
        certificatename: signer.name,
        certificatephone: signer.phone || '',
      }),
    });

    if (!response.ok) {
      throw new Error(`D4Sign add signer error: ${response.status}`);
    }
  }

  // Send document for signing
  private async sendDocumentForSigning(documentId: string): Promise<{ linkSigning: string }> {
    const timestamp = this.generateTimestamp();
    const signature = this.generateSignature(this.config.token, timestamp);

    const response = await fetch(`${this.config.baseUrl}/documents/${documentId}/sendtosigner`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'tokenAPI': this.config.token,
        'cryptKey': signature,
        'timestamp': timestamp,
      },
      body: JSON.stringify({
        message: 'Por favor, assine o contrato de locação de veículo.',
        workflow: '0', // No workflow
        skip_email: '0', // Send email
      }),
    });

    if (!response.ok) {
      throw new Error(`D4Sign send document error: ${response.status}`);
    }

    const data = await response.json() as any;
    
    return {
      linkSigning: data.message || `https://secure.d4sign.com.br/embed/assinar/${documentId}`,
    };
  }

  // Check document status
  async getDocumentStatus(documentId: string): Promise<{
    status: 'pending' | 'signed' | 'cancelled';
    signers: Array<{
      name: string;
      email: string;
      status: 'pending' | 'signed';
      signedAt?: Date;
    }>;
    signedPdfUrl?: string;
  }> {
    try {
      if (!this.config.token || !this.config.cryptKey) {
        // Mock response
        return {
          status: 'signed',
          signers: [
            { name: 'Mock Owner', email: 'owner@mock.com', status: 'signed', signedAt: new Date() },
            { name: 'Mock Renter', email: 'renter@mock.com', status: 'signed', signedAt: new Date() },
          ],
          signedPdfUrl: 'https://mock.d4sign.com/document.pdf',
        };
      }

      const timestamp = this.generateTimestamp();
      const signature = this.generateSignature(this.config.token, timestamp);

      const response = await fetch(`${this.config.baseUrl}/documents/${documentId}`, {
        method: 'GET',
        headers: {
          'tokenAPI': this.config.token,
          'cryptKey': signature,
          'timestamp': timestamp,
        },
      });

      if (!response.ok) {
        throw new Error(`D4Sign get document error: ${response.status}`);
      }

      const data = await response.json() as any;
      
      // Parse D4Sign response to our format
      const status = this.parseD4SignStatus(data.status_id);
      const signers = this.parseD4SignSigners(data.list_info || []);
      
      return {
        status,
        signers,
        signedPdfUrl: data.signed_file_url,
      };
    } catch (error) {
      console.error('Error getting D4Sign document status:', error);
      // Return pending status on error
      return {
        status: 'pending',
        signers: [],
      };
    }
  }

  // Parse D4Sign status to our format
  private parseD4SignStatus(statusId: number): 'pending' | 'signed' | 'cancelled' {
    switch (statusId) {
      case 1: // Waiting for signature
      case 2: // In progress
        return 'pending';
      case 3: // Signed
        return 'signed';
      case 4: // Cancelled
      case 5: // Rejected
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  // Parse D4Sign signers to our format
  private parseD4SignSigners(signers: any[]): Array<{
    name: string;
    email: string;
    status: 'pending' | 'signed';
    signedAt?: Date;
  }> {
    return signers.map(signer => ({
      name: signer.name || signer.email,
      email: signer.email,
      status: signer.signed === '1' ? 'signed' : 'pending',
      signedAt: signer.signed_at ? new Date(signer.signed_at) : undefined,
    }));
  }

  // Mock document creation for development
  private createMockDocument(
    variables: ContractVariables,
    signers: { name: string; email: string; phone?: string }[]
  ): { documentId: string; linkSigning: string } {
    const mockDocumentId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('🔧 D4Sign Mock: Creating contract document', {
      documentId: mockDocumentId,
      variables: {
        vehicle: `${variables.veiculoMarca} ${variables.veiculoModelo}`,
        period: `${variables.dataInicio} to ${variables.dataFim}`,
        value: variables.valorTotal,
      },
      signers: signers.map(s => ({ name: s.name, email: s.email })),
    });

    return {
      documentId: mockDocumentId,
      linkSigning: `https://mock-d4sign.example.com/sign/${mockDocumentId}`,
    };
  }

  // Download signed document
  async downloadSignedDocument(documentId: string): Promise<Buffer | null> {
    try {
      if (!this.config.token || !this.config.cryptKey) {
        console.log('🔧 D4Sign Mock: Document download requested for', documentId);
        return null; // Mock mode
      }

      const timestamp = this.generateTimestamp();
      const signature = this.generateSignature(this.config.token, timestamp);

      const response = await fetch(`${this.config.baseUrl}/documents/${documentId}/download`, {
        method: 'GET',
        headers: {
          'tokenAPI': this.config.token,
          'cryptKey': signature,
          'timestamp': timestamp,
        },
      });

      if (!response.ok) {
        throw new Error(`D4Sign download error: ${response.status}`);
      }

      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      console.error('Error downloading D4Sign document:', error);
      return null;
    }
  }

  // Cancel document
  async cancelDocument(documentId: string, reason?: string): Promise<boolean> {
    try {
      if (!this.config.token || !this.config.cryptKey) {
        console.log('🔧 D4Sign Mock: Document cancelled', documentId, reason);
        return true; // Mock mode
      }

      const timestamp = this.generateTimestamp();
      const signature = this.generateSignature(this.config.token, timestamp);

      const response = await fetch(`${this.config.baseUrl}/documents/${documentId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'tokenAPI': this.config.token,
          'cryptKey': signature,
          'timestamp': timestamp,
        },
        body: JSON.stringify({
          reason: reason || 'Cancelled by system',
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error cancelling D4Sign document:', error);
      return false;
    }
  }

  // Webhook handler for D4Sign events
  handleWebhook(payload: any): {
    documentId: string;
    event: string;
    status: 'pending' | 'signed' | 'cancelled';
    signerEmail?: string;
  } | null {
    try {
      // Parse D4Sign webhook payload
      const documentId = payload.uuidDoc || payload.document_id;
      const event = payload.action || payload.event;
      const status = this.parseWebhookStatus(payload.status_id || payload.status);
      
      return {
        documentId,
        event,
        status,
        signerEmail: payload.email,
      };
    } catch (error) {
      console.error('Error parsing D4Sign webhook:', error);
      return null;
    }
  }

  // Parse webhook status
  private parseWebhookStatus(status: any): 'pending' | 'signed' | 'cancelled' {
    if (typeof status === 'number') {
      return this.parseD4SignStatus(status);
    }
    
    const statusStr = String(status).toLowerCase();
    if (statusStr.includes('sign')) return 'signed';
    if (statusStr.includes('cancel') || statusStr.includes('reject')) return 'cancelled';
    return 'pending';
  }
}

export default new D4SignService();