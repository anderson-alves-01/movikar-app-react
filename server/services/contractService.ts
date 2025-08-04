import { storage } from "../storage.js";
import { ContractTemplate, Contract, InsertContract, ContractAuditLog } from "@shared/schema";
import { generateContractPDF } from "./pdfService.js";
import { sendToSignaturePlatform } from "./signatureService.js";
import { nanoid } from "nanoid";

export class ContractService {
  
  // Generate contract number
  private generateContractNumber(): string {
    const prefix = "CT";
    const year = new Date().getFullYear();
    const id = nanoid(8).toUpperCase();
    return `${prefix}${year}${id}`;
  }

  // Create contract from booking
  async createContractFromBooking(bookingId: number, templateId?: string, userId?: number): Promise<Contract> {
    // Get booking with all details
    const booking = await storage.getBookingWithDetails(bookingId);
    if (!booking) {
      throw new Error("Reserva não encontrada");
    }

    // Get template (use default if not specified)
    const template = templateId 
      ? await storage.getContractTemplate(templateId)
      : await storage.getDefaultContractTemplate();
    
    if (!template) {
      throw new Error("Template de contrato não encontrado");
    }

    // Prepare contract data
    const contractData = {
      vehicle: {
        id: booking.vehicle.id,
        brand: booking.vehicle.brand,
        model: booking.vehicle.model,
        year: booking.vehicle.year,
        color: booking.vehicle.color,
        transmission: booking.vehicle.transmission,
        fuel: booking.vehicle.fuel,
        seats: booking.vehicle.seats,
        category: booking.vehicle.category,
        features: booking.vehicle.features,
        location: booking.vehicle.location,
        pricePerDay: booking.vehicle.pricePerDay,
      },
      renter: {
        id: booking.renter.id,
        name: booking.renter.name,
        email: booking.renter.email,
        phone: booking.renter.phone,
        isVerified: booking.renter.isVerified,
      },
      owner: {
        id: booking.owner.id,
        name: booking.owner.name,
        email: booking.owner.email,
        phone: booking.owner.phone,
        isVerified: booking.owner.isVerified,
      },
      booking: {
        id: booking.id,
        startDate: booking.startDate,
        endDate: booking.endDate,
        totalPrice: booking.totalPrice,
        servicefee: booking.serviceFee,
        insuranceFee: booking.insuranceFee,
        status: booking.status,
      },
      terms: {
        minAge: 21,
        validLicense: true,
        insurance: true,
        deposit: Number(booking.totalPrice) * 0.3, // 30% deposit
        fuelReturn: "same_level",
        penalties: {
          lateReturn: 50.00,
          damage: "assessment_required",
          smoking: 200.00,
          pets: 100.00,
        },
        responsibilities: {
          renter: [
            "Devolver o veículo nas mesmas condições",
            "Respeitar o horário de devolução",
            "Não fumar no interior do veículo",
            "Reportar qualquer problema imediatamente"
          ],
          owner: [
            "Entregar o veículo em boas condições",
            "Fornecer documentação completa",
            "Manter seguro em dia",
            "Estar disponível para emergências"
          ]
        }
      }
    };

    // Create contract
    const contractNumber = this.generateContractNumber();
    
    const contractData_insert: InsertContract = {
      bookingId,
      contractNumber,
      templateId: template.id.toString(),
      contractData: contractData as any,
      signaturePlatform: "autentique", // Default platform
      createdBy: userId,
      status: "draft"
    };

    const contract = await storage.createContract(contractData_insert);

    // Log creation
    await this.logContractAction(contract.id, "created", userId, {
      templateUsed: template.name,
      contractNumber: contractNumber
    });

    return contract;
  }

  // Generate PDF preview
  async generateContractPreview(contractId: number): Promise<string> {
    const contract = await storage.getContractWithDetails(contractId);
    if (!contract) {
      throw new Error("Contrato não encontrado");
    }

    const template = await storage.getDefaultContractTemplate();
    if (!template) {
      throw new Error("Template não encontrado");
    }

    // Generate PDF and get URL
    const pdfUrl = await generateContractPDF(contract, template);
    
    // Update contract with PDF URL
    await storage.updateContract(contractId, { pdfUrl });
    
    // Log preview generation
    await this.logContractAction(contractId, "preview_generated", contract.createdBy);

    return pdfUrl;
  }

  // Send contract for signature
  async sendForSignature(contractId: number, userId?: number): Promise<string> {
    const contract = await storage.getContractWithDetails(contractId);
    if (!contract) {
      throw new Error("Contrato não encontrado");
    }

    if (contract.status !== "draft") {
      throw new Error("Contrato não está em estado de rascunho");
    }

    // Generate PDF if not exists
    let pdfUrl = contract.pdfUrl;
    if (!pdfUrl) {
      pdfUrl = await this.generateContractPreview(contractId);
    }

    // Send to signature platform
    const externalDocumentId = await sendToSignaturePlatform(contract, pdfUrl);

    // Update contract status
    await storage.updateContract(contractId, {
      status: "sent",
      externalDocumentId
    });

    // Log action
    await this.logContractAction(contractId, "sent", userId, {
      externalDocumentId,
      platform: contract.signaturePlatform
    });

    return externalDocumentId;
  }

  // Process signature webhook
  async processSignatureWebhook(externalDocumentId: string, signatureData: any): Promise<void> {
    const contract = await storage.getContractByExternalId(externalDocumentId);
    if (!contract) {
      throw new Error("Contrato não encontrado");
    }

    const { signerEmail, signerName, signedAt, ipAddress, userAgent, signedPdfUrl } = signatureData;
    
    // Determine if it's renter or owner signing
    const isRenterSigning = contract.contractData.renter.email === signerEmail;
    const isOwnerSigning = contract.contractData.owner.email === signerEmail;

    if (!isRenterSigning && !isOwnerSigning) {
      throw new Error("Assinante não autorizado");
    }

    const signatureEvidence = {
      ip: ipAddress,
      userAgent,
      timestamp: signedAt,
      location: "Brazil" // Can be enhanced with IP geolocation
    };

    const updates: Partial<InsertContract> = {};

    if (isRenterSigning) {
      updates.renterSigned = true;
      updates.renterSignedAt = new Date(signedAt);
      updates.renterSignatureIp = ipAddress;
      updates.renterSignatureEvidence = signatureEvidence;
    }

    if (isOwnerSigning) {
      updates.ownerSigned = true;
      updates.ownerSignedAt = new Date(signedAt);
      updates.ownerSignatureIp = ipAddress;
      updates.ownerSignatureEvidence = signatureEvidence;
    }

    // Check if contract is fully signed
    const updatedContract = await storage.getContract(contract.id);
    const bothSigned = (isRenterSigning || updatedContract?.renterSigned) && 
                      (isOwnerSigning || updatedContract?.ownerSigned);

    if (bothSigned) {
      updates.status = "signed";
      updates.signedPdfUrl = signedPdfUrl;
    }

    await storage.updateContract(contract.id, updates);

    // Log signature
    const signerType = isRenterSigning ? "renter" : "owner";
    await this.logContractAction(contract.id, "signed", undefined, {
      signerType,
      signerEmail,
      signerName,
      ipAddress,
      bothSigned
    });

    // If fully signed, approve the booking
    if (bothSigned) {
      await storage.updateBooking(contract.bookingId, { status: "approved" });
      await this.logContractAction(contract.id, "completed", undefined, {
        bookingApproved: true
      });
    }
  }

  // Get contracts for admin panel
  async getContractsForAdmin(filters: {
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  } = {}) {
    return await storage.getContractsWithFilters(filters);
  }

  // Download signed contract
  async downloadContract(contractId: number, userId: number): Promise<string> {
    const contract = await storage.getContractWithDetails(contractId);
    if (!contract) {
      throw new Error("Contrato não encontrado");
    }

    // Check permissions (user must be involved in the contract)
    const contractDataParsed = typeof contract.contractData === 'string' 
      ? JSON.parse(contract.contractData) 
      : contract.contractData;
    
    const hasPermission = contractDataParsed.renter?.id === userId || 
                         contractDataParsed.owner?.id === userId ||
                         contract.createdBy === userId ||
                         (contract.reviewedBy && contract.reviewedBy === userId);

    if (!hasPermission) {
      throw new Error("Sem permissão para acessar este contrato");
    }

    const pdfUrl = contract.signedPdfUrl || contract.pdfUrl;
    if (!pdfUrl) {
      throw new Error("PDF do contrato não encontrado");
    }

    // Log download
    await this.logContractAction(contractId, "downloaded", userId || undefined);

    return pdfUrl;
  }

  // Log contract actions for audit
  private async logContractAction(
    contractId: number, 
    action: string, 
    performedBy?: number, 
    details?: any
  ): Promise<void> {
    const logEntry = {
      contractId,
      action,
      performedBy,
      details
    };

    await storage.createContractAuditLog(logEntry);
  }

  // Get contract audit trail
  async getContractAuditTrail(contractId: number): Promise<ContractAuditLog[]> {
    return await storage.getContractAuditLogs(contractId);
  }

  // Cancel contract
  async cancelContract(contractId: number, reason: string, userId?: number): Promise<void> {
    const contract = await storage.getContract(contractId);
    if (!contract) {
      throw new Error("Contrato não encontrado");
    }

    if (contract.status === "signed") {
      throw new Error("Não é possível cancelar um contrato assinado");
    }

    await storage.updateContract(contractId, { status: "cancelled" });
    
    await this.logContractAction(contractId, "cancelled", userId, {
      reason
    });
  }
}

export const contractService = new ContractService();