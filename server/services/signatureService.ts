import { Contract } from "@shared/schema";
// @ts-ignore - DocuSign types are declared in types/docusign-esign.d.ts
import docusign from 'docusign-esign';

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

// DocuSign API integration
class DocuSignService {
  private integrationKey: string;
  private secretKey: string;
  private userId: string;
  private accountId: string;
  private privateKey: string;
  private baseUrl: string;
  private apiClient: any;

  constructor() {
    this.integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY || "";
    this.secretKey = process.env.DOCUSIGN_SECRET_KEY || "";
    this.userId = process.env.DOCUSIGN_USER_ID || "";
    this.accountId = process.env.DOCUSIGN_ACCOUNT_ID || "";
    this.privateKey = process.env.DOCUSIGN_PRIVATE_KEY || "";
    this.baseUrl = process.env.DOCUSIGN_BASE_URL || "https://demo.docusign.net/restapi";

    // Initialize DocuSign API client
    this.apiClient = new docusign.ApiClient();
    this.apiClient.setBasePath(this.baseUrl);

    if (!this.integrationKey || !this.userId || !this.privateKey) {
      console.warn("DocuSign credentials not configured - using mock mode");
    }
  }

  private async getAccessToken(): Promise<string> {
    if (!this.integrationKey || !this.userId || !this.privateKey) {
      throw new Error('DocuSign credentials not configured');
    }

    try {
      // Format private key (ensure proper PEM format)
      const formattedPrivateKey = this.privateKey.includes('-----BEGIN')
        ? this.privateKey
        : `-----BEGIN RSA PRIVATE KEY-----\n${this.privateKey}\n-----END RSA PRIVATE KEY-----`;

      // Request JWT token
      const response = await this.apiClient.requestJWTUserToken(
        this.integrationKey,
        this.userId,
        ['signature', 'impersonation'],
        formattedPrivateKey,
        3600 // 1 hour expiration
      );

      return response.body.access_token;
    } catch (error) {
      console.error('DocuSign JWT authentication failed:', error);
      throw new Error('Falha na autenticação com DocuSign');
    }
  }

  async createDocument(contract: Contract, pdfUrl: string): Promise<SignaturePlatformResponse> {
    if (!this.integrationKey || !this.userId || !this.privateKey) {
      // Mock response for testing
      return {
        documentId: `docusign-mock-${Date.now()}`,
        signUrl: `https://demo.docusign.net/signing/${contract.contractNumber}`,
        status: "created"
      };
    }

    try {
      // Get access token
      const accessToken = await this.getAccessToken();
      this.apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`);

      // Download PDF content
      const pdfResponse = await fetch(pdfUrl);
      const pdfBuffer = await pdfResponse.arrayBuffer();
      const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

      // Create envelope definition
      const envelopeDefinition = {
        emailSubject: `Contrato de Locação - ${contract.contractNumber}`,
        documents: [{
          documentBase64: pdfBase64,
          name: `Contrato-${contract.contractNumber}.pdf`,
          fileExtension: 'pdf',
          documentId: '1'
        }],
        recipients: {
          signers: [
            {
              email: contract.contractData.renter.email,
              name: contract.contractData.renter.name,
              recipientId: '1',
              routingOrder: '1',
              tabs: {
                signHereTabs: [{
                  documentId: '1',
                  pageNumber: '1',
                  xPosition: '400',
                  yPosition: '650',
                  tabLabel: 'RenterSignature'
                }]
              }
            },
            {
              email: contract.contractData.owner.email,
              name: contract.contractData.owner.name,
              recipientId: '2',
              routingOrder: '1',
              tabs: {
                signHereTabs: [{
                  documentId: '1',
                  pageNumber: '1',
                  xPosition: '150',
                  yPosition: '650',
                  tabLabel: 'OwnerSignature'
                }]
              }
            }
          ]
        },
        status: 'sent'
      };

      // Send envelope
      const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
      const results = await envelopesApi.createEnvelope(this.accountId, {
        envelopeDefinition
      });

      // Get signing URL for first recipient
      const recipientView = await envelopesApi.createRecipientView(
        this.accountId,
        results.envelopeId,
        {
          viewRequest: {
            returnUrl: `${process.env.APP_URL || 'http://localhost:5000'}/contract-signed`,
            authenticationMethod: 'none',
            email: contract.contractData.renter.email,
            userName: contract.contractData.renter.name,
            recipientId: '1'
          }
        }
      );

      return {
        documentId: results.envelopeId,
        signUrl: recipientView.url,
        status: "created"
      };

    } catch (error) {
      console.error('DocuSign API error:', error);
      throw new Error('Falha ao enviar documento para DocuSign');
    }
  }

  async getDocumentStatus(envelopeId: string): Promise<any> {
    if (!this.integrationKey || !this.userId || !this.privateKey) {
      return { status: "sent", recipients: [] };
    }

    try {
      const accessToken = await this.getAccessToken();
      this.apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`);

      const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
      const envelope = await envelopesApi.getEnvelope(this.accountId, envelopeId);
      const recipients = await envelopesApi.listRecipients(this.accountId, envelopeId);

      return {
        status: envelope.status,
        recipients: recipients.signers || [],
        completedDateTime: envelope.completedDateTime,
        statusChangedDateTime: envelope.statusChangedDateTime
      };

    } catch (error) {
      console.error('Error fetching DocuSign envelope status:', error);
      throw new Error('Falha ao consultar status do envelope');
    }
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
    case 'docusign':
      return new DocuSignService();
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
  
  if (service instanceof DocuSignService) {
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

    case 'docusign':
      // DocuSign webhook format (Connect)
      return {
        externalDocumentId: webhookData.data.envelopeId,
        signerEmail: webhookData.data.recipients.signers[0]?.email || 'unknown',
        signerName: webhookData.data.recipients.signers[0]?.name || 'unknown',
        signedAt: webhookData.data.envelopeSummary?.completedDateTime || new Date().toISOString(),
        ipAddress: webhookData.data.recipients.signers[0]?.deliveredDateTime || 'unknown',
        userAgent: 'DocuSign',
        signedPdfUrl: `${process.env.APP_URL || 'http://localhost:5000'}/api/contracts/download/${webhookData.data.envelopeId}`
      };
      
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}