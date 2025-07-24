import { Contract } from "@shared/schema";

// Interface for signature platform responses
interface SignaturePlatformResponse {
  documentId: string;
  signUrl: string;
  status: string;
}

// Autentique API integration
class AutentiqueService {
  private apiKey: string;
  private baseUrl = "https://api.autentique.com.br";

  constructor() {
    this.apiKey = process.env.AUTENTIQUE_API_KEY || "";
    if (!this.apiKey) {
      console.warn("AUTENTIQUE_API_KEY not configured - using mock mode");
    }
  }

  async createDocument(contract: Contract, pdfUrl: string): Promise<SignaturePlatformResponse> {
    if (!this.apiKey) {
      // Mock response for testing
      return {
        documentId: `mock-doc-${Date.now()}`,
        signUrl: `https://mock.autentique.com.br/sign/${contract.contractNumber}`,
        status: "created"
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/v2/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document: {
            name: `Contrato de Locação - ${contract.contractNumber}`,
            file_url: pdfUrl
          },
          signers: [
            {
              email: contract.contractData.renter.email,
              name: contract.contractData.renter.name,
              action: "SIGN",
              positions: [
                {
                  x: "70%",
                  y: "85%",
                  z: 1,
                  page: 1
                }
              ]
            },
            {
              email: contract.contractData.owner.email,
              name: contract.contractData.owner.name,
              action: "SIGN",
              positions: [
                {
                  x: "30%",
                  y: "85%",
                  z: 1,
                  page: 1
                }
              ]
            }
          ]
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Autentique API error: ${data.message || 'Unknown error'}`);
      }

      return {
        documentId: data.id,
        signUrl: data.sign_url,
        status: data.status
      };

    } catch (error) {
      console.error('Autentique API error:', error);
      throw new Error('Falha ao enviar documento para assinatura');
    }
  }

  async getDocumentStatus(documentId: string): Promise<any> {
    if (!this.apiKey) {
      return { status: "PENDING", signatures: [] };
    }

    try {
      const response = await fetch(`${this.baseUrl}/v2/documents/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error fetching document status:', error);
      throw new Error('Falha ao consultar status do documento');
    }
  }
}

// D4Sign API integration
class D4SignService {
  private apiKey: string;
  private cryptKey: string;
  private baseUrl = "https://secure.d4sign.com.br/api/v1";

  constructor() {
    this.apiKey = process.env.D4SIGN_API_KEY || "";
    this.cryptKey = process.env.D4SIGN_CRYPT_KEY || "";
  }

  async createDocument(contract: Contract, pdfUrl: string): Promise<SignaturePlatformResponse> {
    if (!this.apiKey || !this.cryptKey) {
      // Mock response for testing
      return {
        documentId: `d4sign-mock-${Date.now()}`,
        signUrl: `https://secure.d4sign.com.br/sign/${contract.contractNumber}`,
        status: "created"
      };
    }

    // D4Sign implementation would go here
    // Following their API documentation
    throw new Error('D4Sign integration not implemented yet');
  }
}

// ClickSign API integration
class ClickSignService {
  private apiKey: string;
  private baseUrl = "https://api.clicksign.com";

  constructor() {
    this.apiKey = process.env.CLICKSIGN_API_KEY || "";
  }

  async createDocument(contract: Contract, pdfUrl: string): Promise<SignaturePlatformResponse> {
    if (!this.apiKey) {
      // Mock response for testing
      return {
        documentId: `clicksign-mock-${Date.now()}`,
        signUrl: `https://app.clicksign.com/sign/${contract.contractNumber}`,
        status: "created"
      };
    }

    // ClickSign implementation would go here
    // Following their API documentation
    throw new Error('ClickSign integration not implemented yet');
  }
}

// Factory function to get the appropriate service
function getSignatureService(platform: string) {
  switch (platform) {
    case 'autentique':
      return new AutentiqueService();
    case 'd4sign':
      return new D4SignService();
    case 'clicksign':
      return new ClickSignService();
    default:
      return new AutentiqueService(); // Default to Autentique
  }
}

// Main function to send document to signature platform
export async function sendToSignaturePlatform(
  contract: Contract, 
  pdfUrl: string
): Promise<string> {
  const service = getSignatureService(contract.signaturePlatform || 'autentique');
  const response = await service.createDocument(contract, pdfUrl);
  return response.documentId;
}

// Function to check document status
export async function checkDocumentStatus(
  platform: string, 
  documentId: string
): Promise<any> {
  const service = getSignatureService(platform);
  
  if (service instanceof AutentiqueService) {
    return await service.getDocumentStatus(documentId);
  }
  
  throw new Error(`Status check not implemented for platform: ${platform}`);
}

// Webhook processor for different platforms
export function processSignatureWebhook(
  platform: string, 
  webhookData: any
): {
  externalDocumentId: string;
  signerEmail: string;
  signerName: string;
  signedAt: string;
  ipAddress: string;
  userAgent: string;
  signedPdfUrl?: string;
} {
  switch (platform) {
    case 'autentique':
      return {
        externalDocumentId: webhookData.document.id,
        signerEmail: webhookData.signer.email,
        signerName: webhookData.signer.name,
        signedAt: webhookData.signed_at,
        ipAddress: webhookData.signer.ip_address || 'unknown',
        userAgent: webhookData.signer.user_agent || 'unknown',
        signedPdfUrl: webhookData.document.signed_file_url
      };
      
    case 'd4sign':
      // D4Sign webhook format would be different
      return {
        externalDocumentId: webhookData.uuidDoc,
        signerEmail: webhookData.email,
        signerName: webhookData.name,
        signedAt: webhookData.dateSign,
        ipAddress: webhookData.ip || 'unknown',
        userAgent: 'unknown',
        signedPdfUrl: webhookData.fileUrl
      };
      
    case 'clicksign':
      // ClickSign webhook format would be different
      return {
        externalDocumentId: webhookData.document.key,
        signerEmail: webhookData.signer.email,
        signerName: webhookData.signer.name,
        signedAt: webhookData.signed_at,
        ipAddress: 'unknown',
        userAgent: 'unknown',
        signedPdfUrl: webhookData.document.download_url
      };
      
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}