import { Contract } from "@shared/schema";
// @ts-ignore - DocuSign types are declared in types/docusign-esign.d.ts
import docusign from 'docusign-esign';

// Interface for signature platform responses
interface SignaturePlatformResponse {
  documentId: string;
  signUrl: string;
  status: string;
}

// Interface for contract data used in signature services
interface ContractForSignature {
  contractNumber: string;
  signaturePlatform?: string;
  contractData: {
    renter: {
      name: string;
      email: string;
    };
    owner: {
      name: string;
      email: string;
    };
  };
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

  async createDocument(contract: ContractForSignature, pdfUrl: string): Promise<SignaturePlatformResponse> {
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

  async createDocument(contract: ContractForSignature, pdfUrl: string): Promise<SignaturePlatformResponse> {
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
    // Note: DOCUSIGN_BASE_URL includes /restapi, but SDK needs base domain only for setBasePath
    const baseUrlWithRestApi = process.env.DOCUSIGN_BASE_URL || "https://demo.docusign.net/restapi";
    this.baseUrl = baseUrlWithRestApi;
    
    // For SDK, extract just the base domain without /restapi
    const baseDomain = baseUrlWithRestApi.replace('/restapi', '');

    // Initialize DocuSign API client  
    this.apiClient = new docusign.ApiClient();
    this.apiClient.setBasePath(baseDomain);

    if (!this.integrationKey || !this.userId || !this.privateKey) {
      console.warn("🟡 DocuSign credentials not configured - using mock mode");
    } else {
      console.log("✅ DocuSign credentials configured - using real API");
      console.log(`🔑 Integration Key: ${this.integrationKey.substring(0, 10)}...`);
      console.log(`👤 User ID: ${this.userId.substring(0, 10)}...`);
      console.log(`🏢 Account ID: ${this.accountId.substring(0, 10)}...`);
    }
  }

  private async getAccessToken(): Promise<string> {
    if (!this.integrationKey || !this.userId || !this.privateKey) {
      throw new Error('DocuSign credentials not configured');
    }

    try {
      console.log("🔐 DocuSign JWT authentication starting...");
      
      // Format private key properly for RS256 
      let formattedPrivateKey = this.privateKey;
      
      // Replace \\n with actual line breaks if needed
      if (formattedPrivateKey.includes('\\n')) {
        formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, '\n');
      }
      
      // Debug key format
      console.log("🔍 Key analysis:", {
        length: formattedPrivateKey.length,
        hasBegin: formattedPrivateKey.includes('-----BEGIN'),
        isPublicKey: formattedPrivateKey.includes('PUBLIC KEY'),
        isPrivateKey: formattedPrivateKey.includes('PRIVATE KEY'),
        hasRSA: formattedPrivateKey.includes('RSA PRIVATE'),
        lineBreaks: (formattedPrivateKey.match(/\n/g) || []).length
      });
      
      // Check if we accidentally got a public key instead of private key
      if (formattedPrivateKey.includes('-----BEGIN PUBLIC KEY-----')) {
        console.error("❌ ERRO: Chave PÚBLICA detectada quando deveria ser PRIVADA!");
        console.error("🚨 DocuSign precisa da chave PRIVADA para autenticação JWT");
        console.error("💡 Verifique se DOCUSIGN_PRIVATE_KEY contém a chave privada correta");
        throw new Error('Chave pública fornecida ao invés da chave privada - DocuSign requer chave privada');
      }
      
      console.log("🔑 Detected key format:", {
        isPKCS1: formattedPrivateKey.includes('-----BEGIN RSA PRIVATE KEY-----'),
        isPKCS8: formattedPrivateKey.includes('-----BEGIN PRIVATE KEY-----'),
        hasNewlines: formattedPrivateKey.includes('\n')
      });
      
      // Clean up formatting and ensure proper line breaks for PEM
      formattedPrivateKey = formattedPrivateKey
        .replace(/\r\n/g, '\n')
        .replace(/\n+/g, '\n')
        .trim();
      
      // Add proper line breaks for PEM format if missing
      if (!formattedPrivateKey.includes('\n')) {
        try {
          const header = formattedPrivateKey.match(/^-----BEGIN[^-]+-----/)[0];
          const footer = formattedPrivateKey.match(/-----END[^-]+-----$/)[0];
          const keyData = formattedPrivateKey.replace(header, '').replace(footer, '').trim();
          
          // Split into 64-character lines
          const lines = [];
          for (let i = 0; i < keyData.length; i += 64) {
            lines.push(keyData.substring(i, i + 64));
          }
          
          formattedPrivateKey = header + '\n' + lines.join('\n') + '\n' + footer;
          console.log("🔧 Added PEM line breaks");
        } catch (e) {
          console.warn("⚠️ Could not format PEM properly, using as-is");
        }
      }
      
      console.log("✅ Private key ready for JWT signing");
      console.log("📏 Final key length:", formattedPrivateKey.length);
      console.log("📐 Line count:", (formattedPrivateKey.match(/\n/g) || []).length);

      // Try different key formats for JWT authentication
      let jwtResponse = null;
      const keyFormats = [
        { name: "Original format", key: formattedPrivateKey },
      ];
      
      // If it's PKCS#1, also try PKCS#8 conversion
      if (formattedPrivateKey.includes('-----BEGIN RSA PRIVATE KEY-----')) {
        const pkcs8Key = formattedPrivateKey
          .replace('-----BEGIN RSA PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----')
          .replace('-----END RSA PRIVATE KEY-----', '-----END PRIVATE KEY-----');
        keyFormats.push({ name: "PKCS#8 converted", key: pkcs8Key });
      }
      
      for (const format of keyFormats) {
        try {
          console.log(`🔑 Attempting JWT with ${format.name}...`);
          
          const response = await this.apiClient.requestJWTUserToken(
            this.integrationKey,
            this.userId,
            ['signature', 'impersonation'],
            format.key,
            3600 // 1 hour expiration
          );
          
          jwtResponse = response;
          console.log(`✅ JWT authentication successful with ${format.name}`);
          break;
          
        } catch (formatError) {
          console.log(`❌ JWT failed with ${format.name}:`, formatError.message);
          
          // Log detailed error for 400 status codes
          if (formatError.message.includes('status code 400')) {
            console.log('🔍 Error 400 details:', {
              message: formatError.message,
              response: formatError.response?.data || 'No response data',
              status: formatError.response?.status || 'No status'
            });
          }
          
          if (format === keyFormats[keyFormats.length - 1]) {
            // Last format, re-throw error
            throw formatError;
          }
        }
      }
      
      const response = jwtResponse;

      return response.body.access_token;
    } catch (error) {
      console.error('DocuSign JWT authentication failed:', error);
      throw new Error('Falha na autenticação com DocuSign');
    }
  }

  async createDocument(contract: ContractForSignature, pdfUrl: string): Promise<SignaturePlatformResponse> {
    console.log("📄 DocuSignService.createDocument called");
    console.log(`🔑 Credentials check: Integration=${!!this.integrationKey} User=${!!this.userId} Private=${!!this.privateKey}`);
    
    if (!this.integrationKey || !this.userId || !this.privateKey) {
      console.log("🟡 Using DocuSign MOCK mode - credentials missing");
      // Mock response for testing
      return {
        documentId: `docusign-mock-${Date.now()}`,
        signUrl: `https://demo.docusign.net/signing/${contract.contractNumber}`,
        status: "created"
      };
    }

    console.log("✅ Using DocuSign REAL API - credentials present");
    console.log("🔍 Contract data structure:", JSON.stringify(contract, null, 2));

    try {
      // Get access token
      const accessToken = await this.getAccessToken();
      this.apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`);

      // Create comprehensive professional contract in Brazilian Portuguese
      const professionalContract = `CONTRATO DE LOCAÇÃO DE VEÍCULO POR PRAZO DETERMINADO

Número do Contrato: ${contract.contractNumber}
Data: ${new Date().toLocaleDateString('pt-BR')}

LOCATÁRIO (LOCADOR):
Nome: ${contract.contractData.renter?.name || 'N/A'}
Email: ${contract.contractData.renter?.email || 'N/A'}
Telefone: ${contract.contractData.renter?.phone || 'N/A'}

PROPRIETÁRIO (LOCADO):
Nome: ${contract.contractData.owner?.name || 'N/A'}
Email: ${contract.contractData.owner?.email || 'N/A'}
Telefone: ${contract.contractData.owner?.phone || 'N/A'}

DADOS DO VEÍCULO:
Marca/Modelo: ${contract.contractData.vehicle?.brand || 'N/A'} ${contract.contractData.vehicle?.model || 'N/A'}
Ano de Fabricação: ${contract.contractData.vehicle?.year || 'N/A'}
Cor: ${contract.contractData.vehicle?.color || 'N/A'}
Transmissão: ${contract.contractData.vehicle?.transmission || 'N/A'}
Combustível: ${contract.contractData.vehicle?.fuel || 'N/A'}
Número de Assentos: ${contract.contractData.vehicle?.seats || 'N/A'}
Categoria: ${contract.contractData.vehicle?.category || 'N/A'}
Localização: ${contract.contractData.vehicle?.location || 'N/A'}

PERÍODO DE LOCAÇÃO:
Data de Início: ${contract.contractData.booking?.startDate ? new Date(contract.contractData.booking.startDate).toLocaleDateString('pt-BR') : 'N/A'}
Data de Fim: ${contract.contractData.booking?.endDate ? new Date(contract.contractData.booking.endDate).toLocaleDateString('pt-BR') : 'N/A'}

VALORES:
Valor Diário: R$ ${contract.contractData.vehicle?.pricePerDay ? Number(contract.contractData.vehicle.pricePerDay).toFixed(2) : '0,00'}
Taxa de Serviço: R$ ${contract.contractData.booking?.servicefee ? Number(contract.contractData.booking.servicefee).toFixed(2) : '0,00'}
VALOR TOTAL: R$ ${contract.contractData.booking?.totalPrice ? Number(contract.contractData.booking.totalPrice).toFixed(2) : '0,00'}

CLÁUSULAS E CONDIÇÕES:

1. OBJETO DO CONTRATO
Este contrato tem por objeto a locação do veículo acima descrito, pelo LOCATÁRIO, nas condições aqui estabelecidas.

2. PRAZO
O prazo de locação será do período especificado acima, podendo ser prorrogado mediante acordo entre as partes.

3. PAGAMENTO
O pagamento do valor total da locação foi efetuado através da plataforma alugae.mobi no ato da reserva.

4. OBRIGAÇÕES DO LOCATÁRIO
a) Utilizar o veículo com cuidado e diligência;
b) Devolver o veículo nas mesmas condições em que o recebeu;
c) Arcar com multas de trânsito durante o período de locação;
d) Comunicar imediatamente qualquer acidente ou dano ao veículo;
e) Não utilizar o veículo para fins comerciais sem autorização;
f) Não permitir que terceiros não autorizados conduzam o veículo.

5. OBRIGAÇÕES DO PROPRIETÁRIO
a) Entregar o veículo em perfeitas condições de uso;
b) Garantir que toda documentação está em ordem;
c) Fornecer assistência em caso de problemas mecânicos não causados pelo locatário;
d) Manter seguro vigente do veículo.

6. RESPONSABILIDADES
O LOCATÁRIO será responsável por qualquer dano causado ao veículo durante o período de locação, exceto desgaste natural.

7. DEVOLUÇÃO
O veículo deverá ser devolvido na data e local acordados, com o mesmo nível de combustível.

8. RESCISÃO
Este contrato poderá ser rescindido por qualquer das partes mediante comunicação prévia de 24 horas.

9. FORO
Fica eleito o foro da comarca onde se encontra o veículo para dirimir quaisquer questões oriundas deste contrato.

10. DISPOSIÇÕES GERAIS
As partes declaram estar de acordo com todas as cláusulas deste contrato, que constitui título executivo extrajudicial.

Ao assinar este documento, as partes confirmam ter lido, compreendido e concordado com todos os termos e condições estabelecidos.

ASSINATURAS:

_________________________________
${contract.contractData.renter?.name || 'LOCATÁRIO'}
CPF: ___________________________
Data: ${new Date().toLocaleDateString('pt-BR')}

_________________________________
${contract.contractData.owner?.name || 'PROPRIETÁRIO'}
CPF: ___________________________
Data: ${new Date().toLocaleDateString('pt-BR')}

TESTEMUNHAS:

1. ________________________     2. ________________________
   Nome:                           Nome:
   CPF:                            CPF:

Este contrato foi gerado automaticamente pela plataforma alugae.mobi e possui validade jurídica conforme legislação brasileira vigente.`;

      const textBase64 = Buffer.from(professionalContract, 'utf8').toString('base64');
      
      // Create envelope definition using simple text document
      const envelopeDefinition = {
        emailSubject: `Contrato de Locação - ${contract.contractNumber}`,
        documents: [{
          documentBase64: textBase64,
          name: `Contrato-${contract.contractNumber}.txt`,
          fileExtension: 'txt',
          documentId: '1'
        }],
        recipients: {
          signers: [
            {
              email: contract.contractData.renter.email.toLowerCase().trim(),
              name: contract.contractData.renter.name,
              recipientId: '1',
              routingOrder: '1',
              clientUserId: '1', // Adding clientUserId for embedded signing
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
              email: contract.contractData.owner.email.toLowerCase().trim(),
              name: contract.contractData.owner.name,
              recipientId: '2',
              routingOrder: '2', // Changed to sequential signing
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

      // Send envelope using direct HTTP call to avoid SDK URL construction issues
      console.log('Creating envelope with definition:', JSON.stringify(envelopeDefinition, null, 2));
      
      let results: any;
      
      try {
        const accessToken = await this.getAccessToken();
        const envelopeResponse = await fetch(
          `${this.baseUrl}/v2.1/accounts/${this.accountId}/envelopes`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(envelopeDefinition)
          }
        );

        if (!envelopeResponse.ok) {
          const errorData = await envelopeResponse.text();
          console.error('HTTP error creating envelope:', {
            status: envelopeResponse.status,
            statusText: envelopeResponse.statusText,
            url: envelopeResponse.url,
            errorData: errorData
          });
          throw new Error(`HTTP ${envelopeResponse.status}: ${errorData}`);
        }

        results = await envelopeResponse.json();
        console.log('Envelope creation results:', JSON.stringify(results, null, 2));
        console.log('Envelope ID received:', results.envelopeId);

        if (!results.envelopeId) {
          throw new Error('No envelope ID returned from DocuSign');
        }

        // Add a small delay to ensure envelope is ready
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Verify envelope exists and get recipients for debugging
        try {
          const envelopeStatus = await fetch(
            `${this.baseUrl}/v2.1/accounts/${this.accountId}/envelopes/${results.envelopeId}`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${await this.getAccessToken()}`,
                'Accept': 'application/json'
              }
            }
          );
          
          if (envelopeStatus.ok) {
            const envelopeInfo = await envelopeStatus.json();
            console.log('Envelope status:', envelopeInfo.status);
            
            // Get recipients
            const recipientsResponse = await fetch(
              `${this.baseUrl}/v2.1/accounts/${this.accountId}/envelopes/${results.envelopeId}/recipients`,
              {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${await this.getAccessToken()}`,
                  'Accept': 'application/json'
                }
              }
            );
            
            if (recipientsResponse.ok) {
              const recipients = await recipientsResponse.json();
              console.log('Envelope recipients:', JSON.stringify(recipients, null, 2));
            }
          }
        } catch (verifyError) {
          console.warn('Could not verify envelope:', verifyError);
        }

      } catch (envelopeError: any) {
        console.error('Envelope creation failed:', {
          message: envelopeError.message,
          response: envelopeError.response?.body || envelopeError.response?.data,
          status: envelopeError.response?.status
        });
        throw envelopeError;
      }

      // Get signing URL for first recipient using direct HTTP call for better control
      // Ensure exact match with what was sent in envelope creation
      const signerEmail = contract.contractData.renter.email.toLowerCase().trim();
      const signerName = contract.contractData.renter.name || 'Locatário';
      
      const viewRequest = {
        returnUrl: `https://alugae.mobi/contract-signed`,
        authenticationMethod: 'none',
        email: signerEmail,
        userName: signerName,
        recipientId: '1',
        clientUserId: '1' // Adding clientUserId which is sometimes required
      };

      console.log('Creating recipient view with parameters:', JSON.stringify(viewRequest, null, 2));

      // Use direct HTTP call instead of SDK to ensure proper payload
      const directAccessToken = await this.getAccessToken();
      console.log('Direct access token available:', !!directAccessToken);
      
      const fullUrl = `${this.baseUrl}/v2.1/accounts/${this.accountId}/envelopes/${results.envelopeId}/views/recipient`;
      console.log('🔍 Full URL being constructed:', fullUrl);
      console.log('🔍 Base URL:', this.baseUrl);
      
      const response = await fetch(fullUrl,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${directAccessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(viewRequest)
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error('HTTP error creating recipient view:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          errorData: errorData,
          envelopeId: results.envelopeId,
          accountId: this.accountId
        });
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const recipientView = await response.json();

      return {
        documentId: results.envelopeId,
        signUrl: recipientView.url,
        status: "created"
      };

    } catch (error: any) {
      console.error('DocuSign API error details:', {
        message: error.message,
        response: error.response?.body || error.response?.data,
        status: error.response?.status || error.status,
        stack: error.stack
      });
      
      // Log the full error for debugging
      console.error('Full DocuSign error object:', JSON.stringify(error, null, 2));
      
      throw new Error(`Falha ao enviar documento para DocuSign: ${error.message || 'Erro desconhecido'}`);
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

  // Generate a simple valid PDF for testing using a known working template
  private async generateProfessionalContractPDF(contract: ContractForSignature): Promise<string> {
    console.log('📄 Generating professional contract PDF for DocuSign');
    
    // Import the PDF generation service
    const { generateContractPDF } = await import('./pdfService');
    const { storage } = await import('../storage');
    
    // Get the default contract template
    const template = await storage.getDefaultContractTemplate();
    if (!template) {
      throw new Error('Template de contrato não encontrado');
    }

    // Create a mock contract object for PDF generation
    const mockContract = {
      id: 0,
      bookingId: 0,
      contractNumber: contract.contractNumber,
      status: 'draft' as const,
      templateId: template.id?.toString(),
      contractData: contract.contractData,
      signaturePlatform: 'docusign' as const,
      externalDocumentId: null,
      renterSigned: false,
      renterSignedAt: null,
      renterSignatureIp: null,
      renterSignatureEvidence: null,
      ownerSigned: false,
      ownerSignedAt: null,
      ownerSignatureIp: null,
      ownerSignatureEvidence: null,
      pdfUrl: null,
      signedPdfUrl: null,
      cloudStorageId: null,
      createdBy: null,
      reviewedBy: null,
      reviewedAt: null,
      cancelledAt: null,
      cancellationReason: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      // Generate PDF using the professional template
      const pdfUrl = await generateContractPDF(mockContract, template);
      
      // Since generateContractPDF returns a file path, we need to read the file and convert to base64
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // The pdfUrl is typically a relative path like `/api/contracts/download/filename.pdf`
      // We need to get the actual file path
      const fileName = pdfUrl.split('/').pop();
      const filePath = path.join(process.cwd(), 'uploads', fileName || '');
      
      const pdfBuffer = await fs.readFile(filePath);
      return pdfBuffer.toString('base64');
      
    } catch (error) {
      console.error('Error generating professional PDF, falling back to simple PDF:', error);
      
      // Fallback to a well-structured simple PDF if the complex generation fails
      return this.generateSimplePDF(contract);
    }
  }

  private async generateSimplePDF(contract: ContractForSignature): Promise<string> {
    // Create a minimal, valid PDF that DocuSign accepts
    const contractContent = `CONTRATO DE LOCACAO DE VEICULO POR PRAZO DETERMINADO

Contrato No: ${contract.contractNumber}
Data: ${new Date().toLocaleDateString('pt-BR')}

=== PARTES CONTRATANTES ===

LOCADOR (Proprietario):
Nome: ${contract.contractData.owner.name}
E-mail: ${contract.contractData.owner.email}
Telefone: ${contract.contractData.owner.phone || 'Nao informado'}

LOCATARIO:
Nome: ${contract.contractData.renter.name}
E-mail: ${contract.contractData.renter.email}
Telefone: ${contract.contractData.renter.phone || 'Nao informado'}

=== OBJETO DO CONTRATO ===

Veiculo: ${contract.contractData.vehicle.brand} ${contract.contractData.vehicle.model}
Ano: ${contract.contractData.vehicle.year}
Cor: ${contract.contractData.vehicle.color}
Transmissao: ${contract.contractData.vehicle.transmission}
Combustivel: ${contract.contractData.vehicle.fuel}
Lugares: ${contract.contractData.vehicle.seats}
Categoria: ${contract.contractData.vehicle.category}
Localizacao: ${contract.contractData.vehicle.location}

=== PERIODO E VALORES ===

Data de Inicio: ${new Date(contract.contractData.booking.startDate).toLocaleDateString('pt-BR')}
Data de Termino: ${new Date(contract.contractData.booking.endDate).toLocaleDateString('pt-BR')}
Valor Diario: R$ ${Number(contract.contractData.vehicle.pricePerDay).toFixed(2)}
Valor Total: R$ ${Number(contract.contractData.booking.totalPrice).toFixed(2)}
Taxa de Servico: R$ ${Number(contract.contractData.booking.servicefee || 0).toFixed(2)}

=== TERMOS E CONDICOES ===

1. O locatario deve ter no minimo 21 anos e possuir CNH valida
2. O veiculo deve ser devolvido no mesmo estado em que foi retirado
3. E proibido fumar no interior do veiculo
4. Qualquer dano deve ser comunicado imediatamente
5. O locatario e responsavel por multas de transito durante o periodo
6. Combustivel deve ser devolvido no mesmo nivel
7. Atraso na devolucao acarreta multa de R$ 50,00 por dia

=== RESPONSABILIDADES ===

Do Locatario: Devolver o veiculo nas mesmas condicoes, respeitar o horario de devolucao, nao fumar no interior do veiculo, reportar qualquer problema imediatamente.

Do Locador: Entregar o veiculo em boas condicoes, fornecer documentacao completa, manter seguro em dia, estar disponivel para emergencias.

=== ASSINATURAS ===

Assinatura do Locatario: ________________________
${contract.contractData.renter.name}


Assinatura do Locador: ________________________
${contract.contractData.owner.name}

Brasilia, ${new Date().toLocaleDateString('pt-BR')}`;

    // Use html-pdf-node for generating a proper PDF
    const htmlPdf = await import('html-pdf-node');
    
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {
                font-family: Arial, sans-serif;
                font-size: 12px;
                line-height: 1.4;
                color: #000;
                margin: 40px;
            }
            pre {
                white-space: pre-wrap;
                font-family: Arial, sans-serif;
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <pre>${contractContent}</pre>
    </body>
    </html>`;

    const options = {
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    };

    const file = { content: htmlContent };

    try {
      const pdfBuffer = await htmlPdf.generatePdf(file, options);
      return pdfBuffer.toString('base64');
    } catch (error) {
      console.error('PDF generation failed, using minimal PDF:', error);
      
      // Fallback to a very simple but valid PDF structure
      const simplePdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 300 >>
stream
BT
/F1 12 Tf
50 750 Td
(CONTRATO DE LOCACAO DE VEICULO) Tj
0 -30 Td
(Contrato: ${contract.contractNumber}) Tj
0 -30 Td
(Locatario: ${contract.contractData.renter.name}) Tj
0 -30 Td
(Proprietario: ${contract.contractData.owner.name}) Tj
0 -30 Td
(Veiculo: ${contract.contractData.vehicle.brand} ${contract.contractData.vehicle.model}) Tj
0 -30 Td
(Data: ${new Date(contract.contractData.booking.startDate).toLocaleDateString('pt-BR')} ate ${new Date(contract.contractData.booking.endDate).toLocaleDateString('pt-BR')}) Tj
0 -30 Td
(Valor Total: R$ ${Number(contract.contractData.booking.totalPrice).toFixed(2)}) Tj
0 -60 Td
(Assinatura Locatario: ________________) Tj
0 -40 Td
(Assinatura Proprietario: ________________) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000251 00000 n 
0000000318 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
670
%%EOF`;

      return Buffer.from(simplePdf, 'utf8').toString('base64');
    }
  }

  // Generate HTML contract that DocuSign can convert to PDF internally
  private generateContractHTML(contract: ContractForSignature): string {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Contrato de Locação de Veículo</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
        .header { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 30px; }
        .section { margin: 20px 0; }
        .signature-line { border-bottom: 1px solid black; width: 300px; display: inline-block; margin-left: 10px; }
        .signature-area { margin-top: 40px; }
    </style>
</head>
<body>
    <div class="header">CONTRATO DE LOCAÇÃO DE VEÍCULO</div>
    
    <div class="section">
        <strong>Número do Contrato:</strong> ${contract.contractNumber}
    </div>
    
    <div class="section">
        <strong>LOCATÁRIO:</strong><br>
        Nome: ${contract.contractData.renter.name}<br>
        Email: ${contract.contractData.renter.email}
    </div>
    
    <div class="section">
        <strong>PROPRIETÁRIO:</strong><br>
        Nome: ${contract.contractData.owner.name}<br>
        Email: ${contract.contractData.owner.email}
    </div>
    
    <div class="section">
        <strong>Data de Criação:</strong> ${new Date().toLocaleDateString('pt-BR')}
    </div>
    
    <div class="section">
        Este contrato estabelece os termos e condições para a locação do veículo entre as partes mencionadas acima.
    </div>
    
    <div class="signature-area">
        <p><strong>Assinatura do Locatário:</strong> <span class="signature-line"></span></p>
        <br><br>
        <p><strong>Assinatura do Proprietário:</strong> <span class="signature-line"></span></p>
    </div>
</body>
</html>`;
  }
}

// ClickSign API integration
class ClickSignService {
  private apiKey: string;
  private baseUrl = "https://api.clicksign.com";

  constructor() {
    this.apiKey = process.env.CLICKSIGN_API_KEY || "";
  }

  async createDocument(contract: ContractForSignature, pdfUrl: string): Promise<SignaturePlatformResponse> {
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

// Force DocuSign service initialization on module load to test credentials
console.log("🧪 Testing DocuSign service initialization...");
try {
  const testDocuSignService = new DocuSignService();
  console.log("🧪 DocuSign service test completed");
} catch (error) {
  console.error("🧪 DocuSign service test failed:", error instanceof Error ? error.message : String(error));
}

// Factory function to get the appropriate service
export function getSignatureService(platform: string) {
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
      return new DocuSignService(); // Default to DocuSign if configured, otherwise mock mode
  }
}

// Main function to send document to signature platform
export async function sendToSignaturePlatform(
  contract: ContractForSignature, 
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