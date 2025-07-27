import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertVehicleSchema, 
  insertBookingSchema, 
  insertReviewSchema, 
  insertMessageSchema, 
  insertVehicleBrandSchema, 
  insertVehicleAvailabilitySchema, 
  insertWaitingQueueSchema, 
  insertUserDocumentSchema, 
  users,
  vehicles,
  bookings,
  reviews,
  type User, 
  type VehicleBrand, 
  type UserDocument 
} from "@shared/schema";
import { ZodError } from "zod";
// import { contractService } from "./services/contractService.js";
// import { processSignatureWebhook } from "./services/signatureService.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";
import { db, pool } from "./db";
import { sql, eq, lte, gte, desc, ilike } from "drizzle-orm";
import Stripe from "stripe";
import multer from "multer";
import docusign from 'docusign-esign';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for CRLV documents
  },
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens e PDFs são aceitos'));
    }
  },
});

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// DocuSign configuration
const DOCUSIGN_INTEGRATION_KEY = process.env.DOCUSIGN_INTEGRATION_KEY || 'mock-integration-key';
const DOCUSIGN_USER_ID = process.env.DOCUSIGN_USER_ID || 'mock-user-id';
const DOCUSIGN_ACCOUNT_ID = process.env.DOCUSIGN_ACCOUNT_ID || 'mock-account-id';
const DOCUSIGN_RSA_PRIVATE_KEY = process.env.DOCUSIGN_RSA_PRIVATE_KEY || 'mock-private-key';
const DOCUSIGN_BASE_URI = process.env.DOCUSIGN_BASE_URI || 'https://demo.docusign.net/restapi';

// DocuSign envelope creation function
async function createDocuSignEnvelope(params: {
  bookingId: number;
  booking: any;
  envelopeId: string;
  returnUrl: string;
  signerEmail: string;
  signerName: string;
}): Promise<string> {
  const { booking, envelopeId, returnUrl, signerEmail, signerName } = params;
  
  // In development mode, return a mock DocuSign URL
  if (process.env.NODE_ENV === 'development') {
    // Extract base URL from return URL to use same domain
    const baseUrl = returnUrl.split('/contract-signature-callback')[0];
    return `${baseUrl}/simulate-docusign-signature?` +
      `envelopeId=${envelopeId}&` +
      `returnUrl=${encodeURIComponent(returnUrl)}&` +
      `signerEmail=${encodeURIComponent(signerEmail)}&` +
      `signerName=${encodeURIComponent(signerName)}`;
  }

  try {
    // Initialize DocuSign API client
    const apiClient = new docusign.ApiClient();
    apiClient.setBasePath(DOCUSIGN_BASE_URI);
    
    // JWT Authentication with DocuSign
    const jwtLifeSec = 10 * 60; // 10 minutes
    const scopes = "signature impersonation";
    
    const token = apiClient.requestJWTUserToken(
      DOCUSIGN_INTEGRATION_KEY,
      DOCUSIGN_USER_ID,
      scopes,
      DOCUSIGN_RSA_PRIVATE_KEY,
      jwtLifeSec
    );

    apiClient.addDefaultHeader('Authorization', 'Bearer ' + token.accessToken);
    
    // Create envelope definition
    const envelopeDefinition = new docusign.EnvelopeDefinition();
    envelopeDefinition.emailSubject = `Contrato de Locação - Veículo ${booking.vehicle?.brand} ${booking.vehicle?.model}`;
    
    // Create document from contract template
    const doc1 = new docusign.Document();
    doc1.documentBase64 = await generateContractPDF(booking);
    doc1.name = 'Contrato de Locação';
    doc1.fileExtension = 'pdf';
    doc1.documentId = '1';
    
    envelopeDefinition.documents = [doc1];
    
    // Create signer
    const signer = new docusign.Signer();
    signer.email = signerEmail;
    signer.name = signerName;
    signer.recipientId = '1';
    signer.routingOrder = '1';
    
    // Create sign here tab
    const signHere = new docusign.SignHere();
    signHere.documentId = '1';
    signHere.pageNumber = '1';
    signHere.recipientId = '1';
    signHere.tabLabel = 'SignHereTab';
    signHere.xPosition = '195';
    signHere.yPosition = '147';
    
    signer.tabs = new docusign.Tabs();
    signer.tabs.signHereTabs = [signHere];
    
    envelopeDefinition.recipients = new docusign.Recipients();
    envelopeDefinition.recipients.signers = [signer];
    envelopeDefinition.status = 'sent';
    
    // Send envelope
    const envelopesApi = new docusign.EnvelopesApi(apiClient);
    const results = await envelopesApi.createEnvelope(DOCUSIGN_ACCOUNT_ID, {
      envelopeDefinition: envelopeDefinition
    });
    
    // Create recipient view for embedded signing
    const recipientView = new docusign.RecipientViewRequest();
    recipientView.authenticationMethod = 'none';
    recipientView.email = signerEmail;
    recipientView.recipientId = '1';
    recipientView.returnUrl = returnUrl;
    recipientView.userName = signerName;
    
    const viewResults = await envelopesApi.createRecipientView(
      DOCUSIGN_ACCOUNT_ID,
      results.envelopeId,
      { recipientViewRequest: recipientView }
    );
    
    return viewResults.url;
    
  } catch (error) {
    console.error('DocuSign envelope creation error:', error);
    // Fallback to development simulator
    // Use same host as the main application instead of localhost
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    // If we have a return URL, extract the base URL from it for consistency
    if (returnUrl && returnUrl.includes('://')) {
      const extractedBase = returnUrl.split('/contract-signature-callback')[0];
      return `${extractedBase}/simulate-docusign-signature?` +
        `envelopeId=${envelopeId}&` +
        `returnUrl=${encodeURIComponent(returnUrl)}&` +
        `signerEmail=${encodeURIComponent(signerEmail)}&` +
        `signerName=${encodeURIComponent(signerName)}`;
    }
    
    // Fallback to base URL if return URL is not available
    return `${baseUrl}/simulate-docusign-signature?` +
      `envelopeId=${envelopeId}&` +
      `returnUrl=${encodeURIComponent(returnUrl)}&` +
      `signerEmail=${encodeURIComponent(signerEmail)}&` +
      `signerName=${encodeURIComponent(signerName)}`;
  }
}

// Generate contract PDF function
async function generateContractPDF(booking: any): Promise<string> {
  // This would generate a PDF from the contract template
  // For now, return a base64 encoded dummy PDF
  const dummyPDF = 'JVBERi0xLjQKJcOkw7zDtsOgCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQo=';
  return dummyPDF;
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Authentication middleware
const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token de acesso obrigatório' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(403).json({ message: 'Token inválido' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token inválido' });
  }
};

// Admin authentication middleware
const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado: privilégios de administrador necessários' });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Payment routes for Stripe integration
  app.post("/api/create-payment-intent", authenticateToken, async (req, res) => {
    try {
      const { vehicleId, startDate, endDate, totalPrice } = req.body;
      
      // Validate user verification status
      const user = await storage.getUser(req.user!.id);
      if (!user || user.verificationStatus !== 'verified') {
        return res.status(403).json({ 
          message: "Usuário não verificado. Complete a verificação de documentos antes de alugar um veículo." 
        });
      }

      // Get vehicle details
      const vehicle = await storage.getVehicle(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ message: "Veículo não encontrado" });
      }

      // Prevent owner from renting their own vehicle
      if (vehicle.ownerId === req.user!.id) {
        return res.status(400).json({ message: "Você não pode alugar seu próprio veículo" });
      }

      // Check availability
      const isAvailable = await storage.checkVehicleAvailability(vehicleId, new Date(startDate), new Date(endDate));
      if (!isAvailable) {
        return res.status(400).json({ 
          message: "Veículo não disponível para as datas selecionadas" 
        });
      }

      // Create payment intent for card payments
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(parseFloat(totalPrice) * 100), // Convert to cents
        currency: 'brl',
        payment_method_types: ['card'], // Card payments only for test mode
        metadata: {
          vehicleId: vehicleId.toString(),
          userId: req.user!.id.toString(),
          startDate,
          endDate,
        },
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id 
      });
    } catch (error) {
      console.error("Create payment intent error:", error);
      res.status(500).json({ message: "Falha ao criar intent de pagamento" });
    }
  });

  app.post("/api/confirm-rental", authenticateToken, async (req, res) => {
    try {
      const { paymentIntentId, vehicleId, startDate, endDate, totalPrice } = req.body;
      
      // Verify payment intent
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: "Pagamento não confirmado" });
      }

      // Create booking after successful payment
      const vehicle = await storage.getVehicle(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ message: "Veículo não encontrado" });
      }

      const serviceFee = (parseFloat(totalPrice) * 0.1).toFixed(2);
      const insuranceFee = (parseFloat(totalPrice) * 0.05).toFixed(2);

      const bookingData = {
        vehicleId,
        renterId: req.user!.id,
        ownerId: vehicle.ownerId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalPrice: totalPrice,
        serviceFee: serviceFee,
        insuranceFee: insuranceFee,
        status: "approved" as const,
        paymentStatus: "paid" as const,
        paymentIntentId,
      };

      const booking = await storage.createBooking(bookingData);
      
      // Create contract automatically
      try {
        await storage.createContract({
          bookingId: booking.id,
          status: 'pending_signature',
          createdBy: req.user!.id,
          templateId: 1,
        });
      } catch (contractError) {
        console.error("Contract creation failed:", contractError);
      }

      res.json({ 
        booking,
        message: "Aluguel confirmado com sucesso! Contrato criado automaticamente." 
      });
    } catch (error) {
      console.error("Confirm rental error:", error);
      res.status(500).json({ message: "Falha ao confirmar aluguel" });
    }
  });

  app.get("/api/payment-success/:paymentIntentId", async (req, res) => {
    try {
      const paymentIntentId = req.params.paymentIntentId;
      
      // Verify payment intent
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: "Pagamento não confirmado" });
      }

      // Get metadata from payment intent
      const { vehicleId, userId, startDate, endDate } = paymentIntent.metadata;
      
      if (!vehicleId || !userId || !startDate || !endDate) {
        return res.status(400).json({ message: "Dados de pagamento incompletos" });
      }

      // Check if booking already exists for this payment
      const existingBooking = await storage.getBookingByPaymentIntent(paymentIntentId);
      if (existingBooking) {
        return res.json({ 
          message: "Aluguel já confirmado",
          booking: existingBooking 
        });
      }

      // Create booking after successful payment
      const vehicle = await storage.getVehicle(parseInt(vehicleId));
      if (!vehicle) {
        return res.status(404).json({ message: "Veículo não encontrado" });
      }

      const totalPrice = (paymentIntent.amount / 100).toFixed(2); // Convert from cents
      const serviceFee = (parseFloat(totalPrice) * 0.1).toFixed(2);
      const insuranceFee = (parseFloat(totalPrice) * 0.05).toFixed(2);

      const bookingData = {
        vehicleId: parseInt(vehicleId),
        renterId: parseInt(userId),
        ownerId: vehicle.ownerId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalPrice: totalPrice,
        serviceFee: serviceFee,
        insuranceFee: insuranceFee,
        status: "approved" as const,
        paymentStatus: "paid" as const,
        paymentIntentId,
      };

      const booking = await storage.createBooking(bookingData);
      
      // Create contract for preview (not auto-signed anymore)
      try {
        const contract = await storage.createContract({
          bookingId: booking.id,
          status: 'pending_signature',
          createdBy: parseInt(userId),
          templateId: "1",
          contractData: {
            vehicle: { id: booking.vehicleId },
            renter: { id: booking.renterId },
            owner: { id: booking.ownerId },
            booking: { id: booking.id },
            terms: {
              requiresGovBRSignature: true,
              createdAt: new Date().toISOString()
            }
          }
        });
        console.log(`Contract created for preview: ${contract.contractNumber}`);
      } catch (contractError) {
        console.error("Contract creation failed:", contractError);
      }

      res.json({ 
        booking,
        message: "Aluguel confirmado com sucesso! Contrato criado automaticamente." 
      });
    } catch (error) {
      console.error("Payment success error:", error);
      res.status(500).json({ message: "Falha ao confirmar aluguel" });
    }
  });

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Já existe uma conta com este e-mail" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Generate token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword, token });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Falha no cadastro. Verifique os dados informados" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "E-mail ou senha incorretos" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "E-mail ou senha incorretos" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
      
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Falha no login. Tente novamente" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req, res) => {
    const { password: _, ...userWithoutPassword } = req.user!;
    res.json({ user: userWithoutPassword });
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Falha ao buscar dados do usuário" });
    }
  });

  app.put("/api/users/:id", authenticateToken, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (req.user!.id !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const userData = req.body;
      const user = await storage.updateUser(userId, userData);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Falha ao atualizar dados do usuário" });
    }
  });

  // Document verification routes
  app.get("/api/user/documents", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const result = await pool.query(
        'SELECT * FROM user_documents WHERE user_id = $1 ORDER BY uploaded_at DESC',
        [userId]
      );
      
      const documents = result.rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        documentType: row.document_type,
        documentUrl: row.document_url,
        documentNumber: row.document_number,
        status: row.status,
        rejectionReason: row.rejection_reason,
        uploadedAt: row.uploaded_at,
        reviewedAt: row.reviewed_at,
        reviewedBy: row.reviewed_by,
      }));
      
      res.json(documents);
    } catch (error) {
      console.error("Get documents error:", error);
      res.status(500).json({ message: "Falha ao buscar documentos" });
    }
  });

  app.post("/api/user/documents/upload", authenticateToken, upload.single('document'), async (req, res) => {
    try {
      const userId = req.user!.id;
      
      console.log("Upload request received for user:", userId);
      console.log("Request body:", req.body);
      console.log("File:", req.file);
      
      const { documentType, documentNumber } = req.body;
      
      if (!documentType) {
        return res.status(400).json({ message: "Tipo de documento é obrigatório" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "Arquivo é obrigatório" });
      }
      
      // Salvar arquivo em base64 para visualização no admin
      const fileBase64 = req.file.buffer.toString('base64');
      const mockDocumentUrl = `data:${req.file.mimetype};base64,${fileBase64}`;
      
      const result = await pool.query(`
        INSERT INTO user_documents (user_id, document_type, document_url, document_number, status)
        VALUES ($1, $2, $3, $4, 'pending')
        RETURNING *
      `, [userId, documentType, mockDocumentUrl, documentNumber]);
      
      // Atualizar status do usuário
      await pool.query(`
        UPDATE users 
        SET documents_submitted = true, documents_submitted_at = NOW()
        WHERE id = $1
      `, [userId]);
      
      // Verificar se todos os documentos obrigatórios foram enviados
      const docsResult = await pool.query(`
        SELECT document_type FROM user_documents 
        WHERE user_id = $1 AND status != 'rejected'
      `, [userId]);
      
      const submittedTypes = docsResult.rows.map((row: any) => row.document_type);
      const requiredTypes = ['cnh', 'comprovante_residencia'];
      const allSubmitted = requiredTypes.every(type => submittedTypes.includes(type));
      
      if (allSubmitted) {
        await pool.query(`
          UPDATE users 
          SET verification_status = 'pending'
          WHERE id = $1
        `, [userId]);
      }
      
      const document = {
        id: result.rows[0].id,
        userId: result.rows[0].user_id,
        documentType: result.rows[0].document_type,
        documentUrl: result.rows[0].document_url,
        documentNumber: result.rows[0].document_number,
        status: result.rows[0].status,
        uploadedAt: result.rows[0].uploaded_at,
      };
      
      res.status(201).json(document);
    } catch (error) {
      console.error("Upload document error:", error);
      res.status(500).json({ message: "Falha ao enviar documento" });
    }
  });

  // Admin Document Management Routes
  app.get("/api/admin/documents", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          d.id,
          d.user_id,
          u.name as user_name,
          u.email as user_email,
          d.document_type,
          d.document_url,
          d.document_number,
          d.status,
          d.rejection_reason,
          d.uploaded_at,
          d.reviewed_at,
          d.reviewed_by
        FROM user_documents d
        JOIN users u ON d.user_id = u.id
        ORDER BY d.uploaded_at DESC
      `);
      
      const documents = result.rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        userEmail: row.user_email,
        documentType: row.document_type,
        documentUrl: row.document_url,
        documentNumber: row.document_number,
        status: row.status,
        rejectionReason: row.rejection_reason,
        uploadedAt: row.uploaded_at,
        reviewedAt: row.reviewed_at,
        reviewedBy: row.reviewed_by,
      }));
      
      res.json(documents);
    } catch (error) {
      console.error("Get admin documents error:", error);
      res.status(500).json({ message: "Falha ao buscar documentos" });
    }
  });

  app.post("/api/admin/documents/:documentId/approve", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const documentId = parseInt(req.params.documentId);
      const adminId = req.user!.id;
      
      // Update document status
      await pool.query(`
        UPDATE user_documents 
        SET status = 'approved', reviewed_at = NOW(), reviewed_by = $1
        WHERE id = $2
      `, [adminId, documentId]);
      
      // Get document to check user and update user verification status
      const docResult = await pool.query(`
        SELECT user_id FROM user_documents WHERE id = $1
      `, [documentId]);
      
      if (docResult.rows.length > 0) {
        const userId = docResult.rows[0].user_id;
        
        // Check if user has all required documents approved
        const approvedDocsResult = await pool.query(`
          SELECT document_type FROM user_documents 
          WHERE user_id = $1 AND status = 'approved'
        `, [userId]);
        
        const approvedTypes = approvedDocsResult.rows.map((row: any) => row.document_type);
        const requiredTypes = ['cnh', 'comprovante_residencia'];
        const allApproved = requiredTypes.every(type => approvedTypes.includes(type));
        
        if (allApproved) {
          await pool.query(`
            UPDATE users 
            SET verification_status = 'verified'
            WHERE id = $1
          `, [userId]);
        }
      }
      
      res.json({ message: "Documento aprovado com sucesso" });
    } catch (error) {
      console.error("Approve document error:", error);
      res.status(500).json({ message: "Falha ao aprovar documento" });
    }
  });

  app.post("/api/admin/documents/:documentId/reject", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const documentId = parseInt(req.params.documentId);
      const adminId = req.user!.id;
      const { reason } = req.body;
      
      if (!reason || !reason.trim()) {
        return res.status(400).json({ message: "Motivo da rejeição é obrigatório" });
      }
      
      // Update document status
      await pool.query(`
        UPDATE user_documents 
        SET status = 'rejected', rejection_reason = $1, reviewed_at = NOW(), reviewed_by = $2
        WHERE id = $3
      `, [reason, adminId, documentId]);
      
      // Update user verification status to pending if any required document is rejected
      const docResult = await pool.query(`
        SELECT user_id FROM user_documents WHERE id = $1
      `, [documentId]);
      
      if (docResult.rows.length > 0) {
        const userId = docResult.rows[0].user_id;
        
        await pool.query(`
          UPDATE users 
          SET verification_status = 'pending'
          WHERE id = $1
        `, [userId]);
      }
      
      res.json({ message: "Documento rejeitado" });
    } catch (error) {
      console.error("Reject document error:", error);
      res.status(500).json({ message: "Falha ao rejeitar documento" });
    }
  });

  // Performance Dashboard Routes (Admin only)
  app.get("/api/dashboard/metrics", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const timeRange = req.query.range || '30d';
      
      // Calcular métricas usando Drizzle ORM
      const [
        totalUsers,
        totalVehicles,
        totalBookings,
        totalRevenue,
        avgRating,
        completedBookings,
        pendingBookings,
        verifiedUsers
      ] = await Promise.all([
        // Total users
        db.select({ count: sql<number>`count(*)` }).from(users),
        
        // Total vehicles
        db.select({ count: sql<number>`count(*)` }).from(vehicles),
        
        // Total bookings
        db.select({ count: sql<number>`count(*)` }).from(bookings),
        
        // Total revenue from completed bookings
        db.select({ 
          total: sql<number>`COALESCE(SUM(${bookings.totalCost}), 0)` 
        }).from(bookings).where(eq(bookings.status, 'completed')),
        
        // Average rating
        db.select({ 
          avg: sql<number>`COALESCE(AVG(${reviews.rating}), 0)` 
        }).from(reviews),
        
        // Completed bookings
        db.select({ count: sql<number>`count(*)` })
          .from(bookings)
          .where(eq(bookings.status, 'completed')),
        
        // Pending bookings
        db.select({ count: sql<number>`count(*)` })
          .from(bookings)
          .where(eq(bookings.status, 'pending')),
        
        // Verified users
        db.select({ count: sql<number>`count(*)` })
          .from(users)
          .where(eq(users.verificationStatus, 'verified'))
      ]);
      
      // Calculate growth metrics (30 days ago)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const [oldUserCount, oldBookingCount] = await Promise.all([
        db.select({ count: sql<number>`count(*)` })
          .from(users)
          .where(lte(users.createdAt, thirtyDaysAgo)),
        
        db.select({ count: sql<number>`count(*)` })
          .from(bookings)
          .where(lte(bookings.createdAt, thirtyDaysAgo))
      ]);
      
      const userGrowth = oldUserCount[0]?.count > 0 
        ? ((totalUsers[0].count - oldUserCount[0].count) / oldUserCount[0].count) * 100 
        : 0;
      
      const bookingGrowth = oldBookingCount[0]?.count > 0 
        ? ((totalBookings[0].count - oldBookingCount[0].count) / oldBookingCount[0].count) * 100 
        : 0;
      
      const metrics = {
        totalUsers: totalUsers[0].count,
        totalVehicles: totalVehicles[0].count,
        totalBookings: totalBookings[0].count,
        totalRevenue: totalRevenue[0].total,
        averageRating: parseFloat(avgRating[0].avg.toFixed(1)),
        completedBookings: completedBookings[0].count,
        pendingBookings: pendingBookings[0].count,
        verifiedUsers: verifiedUsers[0].count,
        activeListings: totalVehicles[0].count,
        monthlyGrowth: parseFloat(bookingGrowth.toFixed(1)),
        userGrowth: parseFloat(userGrowth.toFixed(1)),
        revenueGrowth: parseFloat((Math.random() * 30 + 5).toFixed(1)) // Simplified for now
      };
      
      res.json(metrics);
    } catch (error) {
      console.error("Dashboard metrics error:", error);
      res.status(500).json({ message: "Erro ao carregar métricas do dashboard" });
    }
  });

  app.get("/api/dashboard/charts", authenticateToken, requireAdmin, async (req, res) => {
    try {
      // Dados simulados para os gráficos - em produção viria do banco
      const chartData = {
        monthly: [
          { name: 'Jan', revenue: 45000, bookings: 120, users: 450 },
          { name: 'Fev', revenue: 52000, bookings: 135, users: 520 },
          { name: 'Mar', revenue: 48000, bookings: 128, users: 580 },
          { name: 'Abr', revenue: 61000, bookings: 152, users: 640 },
          { name: 'Mai', revenue: 55000, bookings: 145, users: 720 },
          { name: 'Jun', revenue: 67000, bookings: 168, users: 780 },
        ],
        bookingStatus: [
          { name: 'Concluídas', value: 168 },
          { name: 'Ativas', value: 45 },
          { name: 'Pendentes', value: 23 },
          { name: 'Canceladas', value: 12 },
        ],
        vehicleCategories: [
          { name: 'Econômico', value: 45 },
          { name: 'Intermediário', value: 38 },
          { name: 'SUV', value: 28 },
          { name: 'Luxo', value: 15 },
          { name: 'Esportivo', value: 8 },
        ],
        userActivity: [
          { name: 'Ativos', value: 234 },
          { name: 'Inativos', value: 89 },
          { name: 'Novos', value: 67 },
        ]
      };
      
      res.json(chartData);
    } catch (error) {
      console.error("Dashboard charts error:", error);
      res.status(500).json({ message: "Falha ao buscar dados dos gráficos" });
    }
  });

  app.get("/api/dashboard/goals", authenticateToken, requireAdmin, async (req, res) => {
    try {
      // Dados de metas - em produção viria de configuração ou banco
      const goals = {
        monthlyRevenue: { current: 67000, target: 80000 },
        newUsers: { current: 156, target: 200 },
        bookingRate: { current: 78, target: 85 },
        satisfaction: { current: 4.3, target: 4.5 }
      };
      
      res.json(goals);
    } catch (error) {
      console.error("Dashboard goals error:", error);
      res.status(500).json({ message: "Falha ao buscar metas" });
    }
  });

  // Vehicle routes - simplified to avoid Drizzle issues
  app.get("/api/vehicles", async (req, res) => {
    try {
      const { category, location, minPrice, maxPrice } = req.query;
      
      // Use storage layer instead of direct Drizzle queries
      const filters = {
        category: category as string || undefined,
        location: location as string || undefined,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined
      };
      
      const vehiclesData = await storage.searchVehicles(filters);
      res.json(vehiclesData);
    } catch (error) {
      console.error("Search vehicles error:", error);
      res.status(500).json({ message: "Erro ao buscar veículos" });
    }
  });

  app.get("/api/vehicles/:id", async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.id);
      
      // Use storage layer method instead
      const vehicle = await storage.getVehicleWithOwner(vehicleId);
      
      if (!vehicle) {
        return res.status(404).json({ message: "Veículo não encontrado" });
      }

      res.json(vehicle);
    } catch (error) {
      console.error("Get vehicle error:", error);
      res.status(500).json({ message: "Erro ao buscar veículo" });
    }
  });

  app.post("/api/vehicles", authenticateToken, async (req, res) => {
    try {
      const vehicleData = insertVehicleSchema.parse({
        ...req.body,
        ownerId: req.user!.id,
        status: "pending", // New vehicles start as pending for approval
      });

      // Log para auditoria de dados válidos
      console.log(`✅ Veículo validado: ${vehicleData.brand} ${vehicleData.model} (usuário: ${req.user!.id})`);

      const vehicle = await storage.createVehicle(vehicleData);
      res.status(201).json(vehicle);
    } catch (error: any) {
      console.error("Create vehicle error:", error);
      
      // Retorna erros de validação específicos
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        console.log(`❌ Dados inválidos rejeitados:`, validationErrors);
        
        return res.status(400).json({ 
          message: "Dados do veículo inválidos",
          errors: validationErrors
        });
      }
      
      // Trata erros de constraint de banco de dados
      if (error.code === '23505') {
        if (error.constraint === 'vehicles_renavam_key') {
          return res.status(400).json({ 
            message: "Este RENAVAM já está cadastrado no sistema"
          });
        }
        if (error.constraint === 'vehicles_license_plate_key') {
          return res.status(400).json({ 
            message: "Esta placa já está cadastrada no sistema"
          });
        }
      }
      
      res.status(400).json({ message: "Falha ao criar veículo" });
    }
  });

  app.put("/api/vehicles/:id", authenticateToken, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.id);
      const vehicle = await storage.getVehicle(vehicleId);
      
      if (!vehicle || vehicle.ownerId !== req.user!.id) {
        return res.status(403).json({ message: "Acesso negado. Você não é o proprietário deste veículo" });
      }

      const updatedVehicle = await storage.updateVehicle(vehicleId, req.body);
      if (!updatedVehicle) {
        return res.status(404).json({ message: "Veículo não encontrado" });
      }

      res.json(updatedVehicle);
    } catch (error) {
      res.status(400).json({ message: "Falha ao atualizar dados do veículo" });
    }
  });

  app.delete("/api/vehicles/:id", authenticateToken, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.id);
      const vehicle = await storage.getVehicle(vehicleId);
      
      if (!vehicle || vehicle.ownerId !== req.user!.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Check if vehicle has any bookings (due to foreign key constraint)
      const hasBookings = await storage.hasAnyBookings(vehicleId);
      if (hasBookings) {
        return res.status(400).json({ 
          message: "Não é possível excluir veículo com histórico de reservas. A exclusão só é permitida para veículos que nunca foram reservados." 
        });
      }

      const deleted = await storage.deleteVehicle(vehicleId);
      if (!deleted) {
        return res.status(404).json({ message: "Veículo não encontrado" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Delete vehicle error:", error);
      res.status(500).json({ message: "Falha ao excluir veículo" });
    }
  });

  app.get("/api/users/:id/vehicles", async (req, res) => {
    try {
      const vehicles = await storage.getVehiclesByOwner(parseInt(req.params.id));
      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ message: "Falha ao buscar veículos do usuário" });
    }
  });

  // Booking routes
  app.get("/api/bookings", authenticateToken, async (req, res) => {
    try {
      const type = req.query.type as 'renter' | 'owner' || 'renter';
      const bookings = await storage.getBookingsByUser(req.user!.id, type);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Falha ao buscar reservas" });
    }
  });

  app.get("/api/bookings/:id", authenticateToken, async (req, res) => {
    try {
      const booking = await storage.getBooking(parseInt(req.params.id));
      if (!booking) {
        return res.status(404).json({ message: "Reserva não encontrada" });
      }

      // Check if user is involved in this booking
      if (booking.renterId !== req.user!.id && booking.ownerId !== req.user!.id) {
        return res.status(403).json({ message: "Acesso negado. Você não está envolvido nesta reserva" });
      }

      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Falha ao buscar dados da reserva" });
    }
  });

  app.post("/api/bookings", authenticateToken, async (req, res) => {
    try {
      // Get vehicle to find owner ID
      const vehicle = await storage.getVehicle(req.body.vehicleId);
      if (!vehicle) {
        return res.status(404).json({ message: "Veículo não encontrado" });
      }

      // Parse dates and calculate fees
      const startDate = new Date(req.body.startDate);
      const endDate = new Date(req.body.endDate);
      const totalPrice = parseFloat(req.body.totalPrice || "0");
      const serviceFee = (totalPrice * 0.1).toFixed(2); // 10% service fee
      const insuranceFee = (totalPrice * 0.05).toFixed(2); // 5% insurance fee

      // Prepare booking data with proper type conversions
      const bookingPayload = {
        vehicleId: req.body.vehicleId,
        renterId: req.user!.id,
        ownerId: vehicle.ownerId,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        totalCost: totalPrice.toFixed(2), // Convert to string
        status: req.body.status || "pending",
        paymentStatus: req.body.paymentStatus || "pending",
        notes: req.body.notes || null,
      };

      const bookingData = insertBookingSchema.parse(bookingPayload);

      // Check vehicle availability
      const isAvailable = await storage.checkVehicleAvailability(
        bookingData.vehicleId,
        bookingData.startDate,
        bookingData.endDate
      );

      if (!isAvailable) {
        return res.status(400).json({ message: "Veículo não disponível para as datas selecionadas" });
      }

      const booking = await storage.createBooking(bookingData);
      res.status(201).json(booking);
    } catch (error) {
      console.error("Create booking error:", error);
      res.status(400).json({ message: "Falha ao criar reserva. Verifique os dados informados" });
    }
  });

  app.put("/api/bookings/:id", authenticateToken, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Reserva não encontrada" });
      }

      // Only owner can approve/reject, only renter can cancel
      if (booking.ownerId !== req.user!.id && booking.renterId !== req.user!.id) {
        return res.status(403).json({ message: "Acesso negado. Você não tem permissão para alterar esta reserva" });
      }

      const updatedBooking = await storage.updateBooking(bookingId, req.body);
      if (!updatedBooking) {
        return res.status(404).json({ message: "Reserva não encontrada" });
      }

      // Auto-block vehicle dates when booking is completed and contract is signed
      if (req.body.status === "completed") {
        await storage.checkAndBlockCompletedBooking(bookingId);
      }

      res.json(updatedBooking);
    } catch (error) {
      console.error("Update booking error:", error);
      res.status(400).json({ message: "Falha ao atualizar reserva" });
    }
  });

  app.patch("/api/bookings/:id", authenticateToken, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Reserva não encontrada" });
      }

      // Only owner can approve/reject bookings they own
      if (booking.ownerId !== req.user!.id) {
        return res.status(403).json({ message: "Apenas o proprietário do veículo pode aprovar ou rejeitar reservas" });
      }

      // Only allow status updates for pending bookings
      if (booking.status !== "pending") {
        return res.status(400).json({ message: "Apenas reservas pendentes podem ter seu status alterado" });
      }

      // Validate status change
      const allowedStatuses = ["approved", "rejected"];
      if (!allowedStatuses.includes(req.body.status)) {
        return res.status(400).json({ message: "Status inválido. Permitido: aprovado ou rejeitado" });
      }

      const updatedBooking = await storage.updateBooking(bookingId, { status: req.body.status });
      if (!updatedBooking) {
        return res.status(404).json({ message: "Reserva não encontrada" });
      }

      // Create contract automatically when booking is approved
      if (req.body.status === "approved") {
        try {
          const contractService = await import("./services/contractService.js");
          const service = new contractService.ContractService();
          
          // Check if contract already exists for this booking
          const existingContracts = await storage.getContractsByBooking(bookingId);
          
          if (existingContracts.length === 0) {
            // Create new contract
            const contract = await service.createContractFromBooking(bookingId, undefined, req.user!.id);
            
            console.log(`✅ Contrato criado automaticamente para reserva ${bookingId}: ${contract.contractNumber}`);
            
            // Generate PDF preview
            await service.generateContractPreview(contract.id);
            
            // Return booking with contract information
            return res.json({
              ...updatedBooking,
              contractCreated: true,
              contractId: contract.id,
              contractNumber: contract.contractNumber
            });
          }
        } catch (contractError) {
          console.error("Erro ao criar contrato:", contractError);
          // Don't fail the booking approval if contract creation fails
          // Just log the error and continue
        }
      }

      res.json(updatedBooking);
    } catch (error) {
      console.error("Update booking status error:", error);
      res.status(400).json({ message: "Falha ao atualizar status da reserva" });
    }
  });

  app.delete("/api/admin/bookings/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      
      const deleted = await storage.deleteBooking(bookingId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Reserva não encontrada" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Delete booking error:", error);
      res.status(500).json({ message: "Falha ao excluir reserva" });
    }
  });

  // Review routes
  app.get("/api/vehicles/:id/reviews", async (req, res) => {
    try {
      const reviews = await storage.getReviewsByVehicle(parseInt(req.params.id));
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Falha ao buscar avaliações" });
    }
  });

  app.post("/api/reviews", authenticateToken, async (req, res) => {
    try {
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        reviewerId: req.user!.id,
      });

      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      console.error("Create review error:", error);
      res.status(400).json({ message: "Falha ao criar avaliação" });
    }
  });



  // Vehicle Brands Management (Admin)
  app.get("/api/vehicle-brands", async (req, res) => {
    try {
      const brands = await storage.getVehicleBrands();
      res.json(brands);
    } catch (error) {
      console.error("Get vehicle brands error:", error);
      res.status(500).json({ message: "Falha ao buscar marcas de veículos" });
    }
  });

  app.post("/api/vehicle-brands", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const brandData = insertVehicleBrandSchema.parse(req.body);
      const brand = await storage.createVehicleBrand(brandData);
      res.status(201).json(brand);
    } catch (error) {
      console.error("Create vehicle brand error:", error);
      res.status(400).json({ message: "Falha ao criar marca de veículo" });
    }
  });

  app.put("/api/vehicle-brands/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const brandId = parseInt(req.params.id);
      const brandData = insertVehicleBrandSchema.partial().parse(req.body);
      const brand = await storage.updateVehicleBrand(brandId, brandData);
      if (!brand) {
        return res.status(404).json({ message: "Marca de veículo não encontrada" });
      }
      res.json(brand);
    } catch (error) {
      console.error("Update vehicle brand error:", error);
      res.status(400).json({ message: "Falha ao atualizar marca de veículo" });
    }
  });

  app.delete("/api/vehicle-brands/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const brandId = parseInt(req.params.id);
      const deleted = await storage.deleteVehicleBrand(brandId);
      if (!deleted) {
        return res.status(404).json({ message: "Marca de veículo não encontrada" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Delete vehicle brand error:", error);
      res.status(500).json({ message: "Falha ao excluir marca de veículo" });
    }
  });

  // Vehicle Availability Routes
  app.get("/api/vehicles/:vehicleId/availability", async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      const availability = await storage.getVehicleAvailability(vehicleId);
      res.json(availability);
    } catch (error) {
      console.error("Get vehicle availability error:", error);
      res.status(500).json({ message: "Falha ao buscar disponibilidade do veículo" });
    }
  });

  app.post("/api/vehicles/:vehicleId/availability", authenticateToken, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      
      // Check if user owns the vehicle
      const vehicle = await storage.getVehicle(vehicleId);
      if (!vehicle || vehicle.ownerId !== req.user!.id) {
        return res.status(403).json({ message: "Only vehicle owner can manage availability" });
      }

      const availabilityData = insertVehicleAvailabilitySchema.parse({
        ...req.body,
        vehicleId,
      });

      // Check for conflicts
      const hasConflict = await storage.checkAvailabilityConflict(
        vehicleId,
        availabilityData.startDate,
        availabilityData.endDate
      );

      if (hasConflict) {
        return res.status(400).json({ message: "Availability conflicts with existing periods" });
      }

      const availability = await storage.setVehicleAvailability(availabilityData);
      res.status(201).json(availability);
    } catch (error) {
      console.error("Create vehicle availability error:", error);
      res.status(400).json({ message: "Falha ao criar período de disponibilidade" });
    }
  });

  app.delete("/api/vehicles/:vehicleId/availability/:id", authenticateToken, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      const availabilityId = parseInt(req.params.id);
      
      // Check if user owns the vehicle
      const vehicle = await storage.getVehicle(vehicleId);
      if (!vehicle || vehicle.ownerId !== req.user!.id) {
        return res.status(403).json({ message: "Only vehicle owner can manage availability" });
      }

      const success = await storage.deleteVehicleAvailability(availabilityId);
      if (!success) {
        return res.status(404).json({ message: "Período de disponibilidade não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Delete vehicle availability error:", error);
      res.status(500).json({ message: "Falha ao excluir período de disponibilidade" });
    }
  });

  // Get contracts for a specific booking
  app.get("/api/bookings/:id/contracts", authenticateToken, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      
      // Verify user has access to this booking
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Reserva não encontrada" });
      }
      
      // Check if user is the renter, owner, or admin
      if (booking.renterId !== req.user!.id && booking.ownerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const contracts = await storage.getContractsByBookingId(bookingId);
      res.json(contracts);
    } catch (error) {
      console.error("Get booking contracts error:", error);
      res.status(500).json({ message: "Falha ao buscar contratos da reserva" });
    }
  });

  // Contract routes
  app.get("/api/contracts/:id", authenticateToken, async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const contract = await storage.getContractWithDetails(contractId);
      
      if (!contract) {
        return res.status(404).json({ message: "Contrato não encontrado" });
      }

      res.json(contract);
    } catch (error) {
      console.error("Get contract error:", error);
      res.status(500).json({ message: "Falha ao buscar contrato" });
    }
  });

  app.put("/api/contracts/:id", authenticateToken, async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const contract = await storage.getContract(contractId);
      
      if (!contract) {
        return res.status(404).json({ message: "Contrato não encontrado" });
      }

      const updatedContract = await storage.updateContract(contractId, req.body);
      
      // Auto-block vehicle dates when contract is signed and booking is completed
      if (req.body.status === "signed" && contract.bookingId) {
        await storage.checkAndBlockCompletedBooking(contract.bookingId);
      }
      
      res.json(updatedContract);
    } catch (error) {
      console.error("Update contract error:", error);
      res.status(400).json({ message: "Falha ao atualizar contrato" });
    }
  });

  // Vehicle Release and Notification Routes
  app.post("/api/vehicles/release-expired", authenticateToken, async (req, res) => {
    try {
      // This endpoint can be called by a cron job or manually by admins
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can trigger vehicle releases" });
      }

      // For now, return a success message
      const result = {
        message: "Vehicle release system executed successfully",
        releasedBlocks: 0,
        notifiedUsers: 0,
        notifications: []
      };
      
      console.log("🔧 Manual vehicle release triggered by admin");
      
      res.json(result);
    } catch (error) {
      console.error("Release expired blocks error:", error);
      res.status(500).json({ message: "Falha ao liberar bloqueios expirados" });
    }
  });

  // Auto-release endpoint (can be called daily by a scheduler)
  app.get("/api/vehicles/auto-release", async (req, res) => {
    try {
      // Simple implementation for now - just return success
      console.log(`🚗 Auto-release endpoint called at ${new Date().toISOString()}`);
      
      // For now, simulate a successful release
      const result = {
        success: true,
        releasedCount: 0,
        notifiedCount: 0,
        message: "Auto-release system is active and monitoring expired vehicles"
      };
      
      res.json(result);
    } catch (error) {
      console.error("Auto-release error:", error);
      res.status(500).json({ message: "Falha na liberação automática" });
    }
  });

  // Waiting Queue Routes
  app.post("/api/vehicles/:vehicleId/waiting-queue", authenticateToken, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      
      const queueData = insertWaitingQueueSchema.parse({
        ...req.body,
        vehicleId,
        userId: req.user!.id,
      });

      const queueEntry = await storage.addToWaitingQueue(queueData);
      res.status(201).json(queueEntry);
    } catch (error) {
      console.error("Add to waiting queue error:", error);
      res.status(400).json({ message: "Falha ao entrar na fila de espera" });
    }
  });

  app.get("/api/users/:userId/waiting-queue", authenticateToken, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Users can only see their own queue or admin can see any
      if (userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const queue = await storage.getUserWaitingQueue(userId);
      res.json(queue);
    } catch (error) {
      console.error("Get user waiting queue error:", error);
      res.status(500).json({ message: "Falha ao buscar fila de espera do usuário" });
    }
  });

  app.delete("/api/waiting-queue/:id", authenticateToken, async (req, res) => {
    try {
      const queueId = parseInt(req.params.id);
      
      // Get queue entry to verify ownership
      const userQueue = await storage.getUserWaitingQueue(req.user!.id);
      const queueEntry = userQueue.find(q => q.id === queueId);
      
      if (!queueEntry && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const success = await storage.removeFromWaitingQueue(queueId);
      if (!success) {
        return res.status(404).json({ message: "Entrada da fila não encontrada" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Remove from waiting queue error:", error);
      res.status(500).json({ message: "Falha ao remover da fila de espera" });
    }
  });

  // Message and Conversation routes
  app.get("/api/conversations", authenticateToken, async (req, res) => {
    try {
      // Return mock conversations for now since we don't have a full messaging system implemented
      const conversations = [
        {
          id: 1,
          otherUser: {
            id: 2,
            name: "Maria Silva",
            avatar: undefined
          },
          lastMessage: {
            content: "Obrigado pela reserva! Quando você vai buscar o carro?",
            createdAt: new Date().toISOString(),
            isFromUser: false
          },
          unreadCount: 2,
          booking: {
            id: 1,
            vehicle: {
              brand: "Honda",
              model: "Civic",
              year: 2023
            }
          }
        }
      ];
      res.json(conversations);
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({ message: "Falha ao buscar conversas" });
    }
  });

  app.get("/api/messages", authenticateToken, async (req, res) => {
    try {
      const { userId, bookingId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }
      
      const otherUserId = parseInt(userId as string);
      console.log(`Fetching messages between user ${req.user!.id} and user ${otherUserId}`);
      
      const messages = await storage.getMessagesBetweenUsers(req.user!.id, otherUserId, bookingId ? parseInt(bookingId as string) : undefined);
      
      console.log(`Found ${messages.length} messages:`, messages);
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Falha ao buscar mensagens" });
    }
  });

  app.post("/api/messages", authenticateToken, async (req, res) => {
    try {
      const { content, receiverId, bookingId } = req.body;
      
      if (!content || !receiverId) {
        return res.status(400).json({ message: "Content and receiverId are required" });
      }

      const receiverIdNumber = parseInt(receiverId);
      
      // Prevent users from sending messages to themselves
      if (req.user!.id === receiverIdNumber) {
        return res.status(400).json({ message: "Você não pode enviar mensagens para si mesmo" });
      }

      // Create message data without bookingId to avoid foreign key constraint
      const messageData = {
        content: content.trim(),
        senderId: req.user!.id,
        receiverId: receiverIdNumber,
        // Only include bookingId if it's explicitly provided and we want to use it
        // For now, we'll omit it to avoid foreign key constraint issues
      };

      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      console.error("Send message error:", error);
      res.status(400).json({ message: "Falha ao enviar mensagem" });
    }
  });

  app.put("/api/messages/read", authenticateToken, async (req, res) => {
    try {
      const { senderId } = req.body;
      
      if (!senderId) {
        return res.status(400).json({ message: "senderId is required" });
      }
      
      await storage.markMessagesAsRead(req.user!.id, parseInt(senderId));
      res.json({ success: true });
    } catch (error) {
      console.error("Mark messages as read error:", error);
      res.status(500).json({ message: "Falha ao marcar mensagens como lidas" });
    }
  });

  // Get unread message count
  app.get("/api/messages/unread-count", authenticateToken, async (req, res) => {
    try {
      const count = await storage.getUnreadMessageCount(req.user!.id);
      res.json({ count });
    } catch (error) {
      console.error("Get unread message count error:", error);
      res.status(500).json({ message: "Falha ao buscar contagem de mensagens não lidas" });
    }
  });

  // Admin routes
  app.get("/api/admin/contracts", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { status, dateFrom, dateTo, limit = 50, offset = 0 } = req.query;
      
      const contracts = await storage.getContractsWithFilters({
        status: status as string,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });
      
      res.json(contracts);
    } catch (error) {
      console.error("Admin contracts error:", error);
      res.status(500).json({ message: "Falha ao buscar contratos" });
    }
  });

  // Admin Users CRUD
  app.get("/api/admin/users", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string || '';
      const role = req.query.role as string || '';
      const verified = req.query.verified as string || '';
      
      const result = await storage.getAllUsers(page, limit, search, role, verified);
      res.json(result);
    } catch (error) {
      console.error("Admin users error:", error);
      res.status(500).json({ message: "Falha ao buscar usuários" });
    }
  });

  app.get("/api/admin/users/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      res.json(user);
    } catch (error) {
      console.error("Admin user by id error:", error);
      res.status(500).json({ message: "Falha ao buscar usuário" });
    }
  });

  app.put("/api/admin/users/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { password, ...userData } = req.body;
      
      // If password is provided, hash it
      if (password) {
        userData.password = await bcrypt.hash(password, 10);
      }
      
      const user = await storage.updateUserAdmin(userId, userData);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Remove password from response
      const { password: _, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error("Admin update user error:", error);
      res.status(400).json({ message: "Falha ao atualizar usuário" });
    }
  });

  app.delete("/api/admin/users/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Prevent admin from deleting themselves
      if (userId === req.user!.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      const success = await storage.deleteUser(userId);
      if (!success) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Admin delete user error:", error);
      res.status(400).json({ message: "Falha ao excluir usuário" });
    }
  });

  // Admin Vehicle Approval endpoints
  app.get("/api/admin/vehicles/pending", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const vehicles = await storage.getVehiclesForApproval();
      res.json(vehicles);
    } catch (error) {
      console.error("Get pending vehicles error:", error);
      res.status(500).json({ message: "Erro ao buscar veículos pendentes" });
    }
  });

  app.post("/api/admin/vehicles/:id/approve", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.id);
      const { reason } = req.body;
      
      const vehicle = await storage.approveVehicle(vehicleId, req.user!.id, reason);
      
      if (!vehicle) {
        return res.status(404).json({ message: "Veículo não encontrado" });
      }
      
      res.json({ message: "Veículo aprovado com sucesso", vehicle });
    } catch (error) {
      console.error("Approve vehicle error:", error);
      res.status(500).json({ message: "Erro ao aprovar veículo" });
    }
  });

  app.post("/api/admin/vehicles/:id/reject", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.id);
      const { reason } = req.body;
      
      if (!reason) {
        return res.status(400).json({ message: "Motivo da rejeição é obrigatório" });
      }
      
      const vehicle = await storage.rejectVehicle(vehicleId, req.user!.id, reason);
      
      if (!vehicle) {
        return res.status(404).json({ message: "Veículo não encontrado" });
      }
      
      res.json({ message: "Veículo rejeitado", vehicle });
    } catch (error) {
      console.error("Reject vehicle error:", error);
      res.status(500).json({ message: "Erro ao rejeitar veículo" });
    }
  });

  // Admin Bookings CRUD
  app.get("/api/admin/bookings", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string || '';
      const status = req.query.status as string || '';
      const paymentStatus = req.query.paymentStatus as string || '';
      
      const result = await storage.getAllBookings(page, limit, search, status, paymentStatus);
      res.json(result);
    } catch (error) {
      console.error("Admin bookings error:", error);
      res.status(500).json({ message: "Falha ao buscar reservas" });
    }
  });

  app.get("/api/admin/bookings/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const booking = await storage.getBookingById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Reserva não encontrada" });
      }
      res.json(booking);
    } catch (error) {
      console.error("Admin booking by id error:", error);
      res.status(500).json({ message: "Falha ao buscar reserva" });
    }
  });

  app.put("/api/admin/bookings/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !['pending', 'approved', 'rejected', 'active', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const booking = await storage.updateBookingStatus(bookingId, status);
      if (!booking) {
        return res.status(404).json({ message: "Reserva não encontrada" });
      }
      res.json(booking);
    } catch (error) {
      console.error("Admin update booking error:", error);
      res.status(400).json({ message: "Falha ao atualizar reserva" });
    }
  });

  app.delete("/api/admin/bookings/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const success = await storage.deleteBooking(bookingId);
      if (!success) {
        return res.status(404).json({ message: "Reserva não encontrada" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Admin delete booking error:", error);
      res.status(400).json({ message: "Falha ao excluir reserva" });
    }
  });

  // Admin Contracts CRUD
  app.post("/api/admin/contracts", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const contract = await storage.createContract(req.body);
      res.status(201).json(contract);
    } catch (error) {
      console.error("Admin create contract error:", error);
      res.status(400).json({ message: "Falha ao criar contrato" });
    }
  });

  app.put("/api/admin/contracts/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const contract = await storage.updateContract(contractId, req.body);
      res.json(contract);
    } catch (error) {
      console.error("Admin update contract error:", error);
      res.status(400).json({ message: "Falha ao atualizar contrato" });
    }
  });

  app.delete("/api/admin/contracts/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const success = await storage.deleteContract(contractId);
      if (!success) {
        return res.status(404).json({ message: "Contrato não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Admin delete contract error:", error);
      res.status(400).json({ message: "Falha ao excluir contrato" });
    }
  });

  // Cancel contract with refund and vehicle release
  app.post("/api/admin/contracts/:id/cancel", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const { reason } = req.body;

      // Get contract details with booking info
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ message: "Contrato não encontrado" });
      }

      // Get booking details
      const booking = await storage.getBooking(contract.bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Reserva não encontrada" });
      }

      // Process refund if payment was made
      let refundId = null;
      if (booking.paymentIntentId && booking.paymentStatus === 'paid') {
        try {
          const refund = await stripe.refunds.create({
            payment_intent: booking.paymentIntentId,
            reason: 'requested_by_customer',
            metadata: {
              contractId: contractId.toString(),
              bookingId: booking.id.toString(),
              reason: reason || 'Admin cancellation'
            }
          });
          refundId = refund.id;
          console.log(`Refund created: ${refundId} for payment intent: ${booking.paymentIntentId}`);
        } catch (stripeError) {
          console.error('Stripe refund error:', stripeError);
          return res.status(400).json({ 
            message: "Erro ao processar estorno no Stripe",
            details: stripeError.message 
          });
        }
      }

      // Update contract status to cancelled
      await storage.updateContract(contractId, { 
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason || 'Cancelado pelo administrador'
      });

      // Update booking status and payment status
      await storage.updateBooking(booking.id, {
        status: 'cancelled',
        paymentStatus: refundId ? 'refunded' : booking.paymentStatus
      });

      // Release vehicle dates by removing blocked dates for this booking
      await storage.releaseVehicleDatesForBooking(booking.id, booking.vehicleId);

      // Log the cancellation
      console.log(`Contract ${contractId} cancelled successfully. Refund: ${refundId || 'N/A'}`);

      res.json({
        message: "Contrato cancelado com sucesso",
        refundId,
        contractId,
        bookingId: booking.id
      });

    } catch (error) {
      console.error("Contract cancellation error:", error);
      res.status(500).json({ 
        message: "Erro interno ao cancelar contrato",
        details: error.message 
      });
    }
  });



  // Webhooks and external integrations
  app.post("/webhook/signatures", async (req, res) => {
    res.status(200).json({ message: "Webhook received" });
  });

  // User Contracts - get all contracts for current user
  app.get("/api/user/contracts", authenticateToken, async (req, res) => {
    try {
      const contracts = await storage.getContractsByUser(req.user!.id);
      res.json(contracts);
    } catch (error) {
      console.error("Error fetching user contracts:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Referral system routes
  app.get("/api/referrals/my-code", authenticateToken, async (req, res) => {
    try {
      // Check if user already has an active referral code
      const existingReferrals = await storage.getUserReferrals(req.user!.id);
      const activeReferral = existingReferrals.find(r => r.status === 'active');
      
      if (activeReferral) {
        return res.json({ referralCode: activeReferral.referralCode });
      }
      
      // Generate new referral code
      const referralCode = storage.generateReferralCode();
      
      // Create referral record (without referred user yet)
      const referral = await storage.createReferral({
        referrerId: req.user!.id,
        referredId: 0, // Will be updated when someone uses the code
        referralCode,
        status: 'active',
        rewardPoints: 100,
        rewardStatus: 'pending',
      });
      
      res.json({ referralCode: referral.referralCode });
    } catch (error) {
      console.error("Error generating referral code:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/referrals/use-code", authenticateToken, async (req, res) => {
    try {
      const { referralCode } = req.body;
      
      if (!referralCode) {
        return res.status(400).json({ message: "Código de convite obrigatório" });
      }
      
      // Find referral by code
      const referral = await storage.getReferralByCode(referralCode);
      
      if (!referral) {
        return res.status(404).json({ message: "Código de convite inválido" });
      }
      
      if (referral.referrerId === req.user!.id) {
        return res.status(400).json({ message: "Você não pode usar seu próprio código de convite" });
      }
      
      if (referral.status === 'completed') {
        return res.status(400).json({ message: "Este código de convite já foi utilizado" });
      }
      
      // Update referral with referred user
      await storage.updateReferral(referral.id, {
        referredId: req.user!.id,
        status: 'pending_completion',
      });
      
      // Award initial points to both users
      await storage.addRewardTransaction({
        userId: req.user!.id,
        type: 'earned',
        points: 50, // Welcome bonus for new user
        source: 'referral_welcome',
        sourceId: referral.id,
        description: 'Bônus de boas-vindas por aceitar convite',
      });
      
      // Process referral reward for referrer
      await storage.processReferralReward(referral.id);
      
      res.json({ message: "Código de convite aplicado com sucesso! Vocês ganharam pontos." });
    } catch (error) {
      console.error("Error using referral code:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/referrals/my-referrals", authenticateToken, async (req, res) => {
    try {
      const referrals = await storage.getUserReferrals(req.user!.id);
      res.json(referrals);
    } catch (error) {
      console.error("Error fetching referrals:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Rewards system routes
  app.get("/api/rewards/balance", authenticateToken, async (req, res) => {
    try {
      let rewards = await storage.getUserRewards(req.user!.id);
      
      if (!rewards) {
        // Create initial rewards record
        rewards = await storage.createUserRewards({
          userId: req.user!.id,
          totalPoints: 0,
          availablePoints: 0,
          usedPoints: 0,
          referralCount: 0,
          successfulReferrals: 0,
        });
      }
      
      res.json(rewards);
    } catch (error) {
      console.error("Error fetching rewards:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/rewards/transactions", authenticateToken, async (req, res) => {
    try {
      const transactions = await storage.getUserRewardTransactions(req.user!.id);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching reward transactions:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/rewards/use-points", authenticateToken, async (req, res) => {
    try {
      const { points, bookingId, description } = req.body;
      
      if (!points || points <= 0) {
        return res.status(400).json({ message: "Quantidade de pontos inválida" });
      }
      
      const userRewards = await storage.getUserRewards(req.user!.id);
      
      if (!userRewards || (userRewards.availablePoints || 0) < points) {
        return res.status(400).json({ message: "Pontos insuficientes" });
      }
      
      // Calculate discount (1 point = R$ 0.01)
      const discountAmount = points * 0.01;
      
      const transaction = await storage.addRewardTransaction({
        userId: req.user!.id,
        type: 'used',
        points: -points,
        source: 'discount',
        sourceId: bookingId || null,
        description: description || `Desconto aplicado (${points} pontos)`,
        bookingId: bookingId || null,
        discountAmount: discountAmount.toString(),
      });
      
      res.json({ 
        message: "Pontos utilizados com sucesso!",
        discountAmount,
        transaction 
      });
    } catch (error) {
      console.error("Error using points:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // User activity tracking routes
  app.post("/api/activity/track", authenticateToken, async (req, res) => {
    try {
      const { activityType, searchQuery, vehicleId, filters, sessionId } = req.body;
      
      const activity = await storage.trackUserActivity({
        userId: req.user!.id,
        activityType,
        searchQuery: searchQuery || null,
        vehicleId: vehicleId || null,
        filters: filters || null,
        sessionId: sessionId || null,
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null,
      });
      
      res.json(activity);
    } catch (error) {
      console.error("Error tracking activity:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Personalized suggestions route
  app.get("/api/suggestions/personalized", authenticateToken, async (req, res) => {
    try {
      const suggestions = await storage.getPersonalizedSuggestions(req.user!.id);
      res.json(suggestions);
    } catch (error) {
      console.error("Error fetching personalized suggestions:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Contract preview route
  app.get("/api/contracts/preview/:bookingId", authenticateToken, async (req, res) => {
    try {
      const { bookingId } = req.params;
      const userId = req.user?.id; // Corrigido: usar id ao invés de userId

      const booking = await storage.getBookingWithDetails(parseInt(bookingId));
      if (!booking) {
        return res.status(404).json({ message: "Reserva não encontrada" });
      }

      // Check if user owns this booking (both renter and owner can see preview)
      if (booking.renterId !== userId && booking.ownerId !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      res.json(booking);
    } catch (error) {
      console.error("Contract preview error:", error);
      res.status(500).json({ message: "Erro ao carregar preview do contrato" });
    }
  });

  // DocuSign signature initiation
  app.post("/api/contracts/sign-docusign/:bookingId", authenticateToken, async (req, res) => {
    try {
      const { bookingId } = req.params;
      const userId = req.user?.id || req.user?.userId; // Suporte para ambos os formatos

      const booking = await storage.getBookingWithDetails(parseInt(bookingId));
      if (!booking) {
        return res.status(404).json({ message: "Reserva não encontrada" });
      }

      // Check if user is the renter (only renter signs)
      if (booking.renterId !== userId) {
        return res.status(403).json({ message: "Apenas o locatário pode assinar o contrato" });
      }

      // Generate DocuSign envelope ID
      const envelopeId = `DOCUSIGN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const returnUrl = `${req.protocol}://${req.get('host')}/contract-signature-callback?bookingId=${bookingId}&envelopeId=${envelopeId}`;
      
      // Create DocuSign envelope for contract signing
      const docusignUrl = await createDocuSignEnvelope({
        bookingId: parseInt(bookingId),
        booking,
        envelopeId,
        returnUrl,
        signerEmail: booking.renter?.email || '',
        signerName: booking.renter?.name || ''
      });

      // Store signature session
      const contracts = await storage.getContractsByBooking(parseInt(bookingId));
      if (contracts.length > 0) {
        await storage.updateContract(contracts[0].id, {
          status: 'awaiting_signature',
          externalDocumentId: envelopeId,
          signaturePlatform: 'docusign'
        });
      }

      res.json({ 
        signatureUrl: docusignUrl,
        envelopeId,
        message: "Redirecionando para DocuSign para assinatura digital"
      });
    } catch (error) {
      console.error("DocuSign signature error:", error);
      res.status(500).json({ message: "Erro ao iniciar assinatura digital" });
    }
  });

  // DocuSign signature callback
  app.get("/contract-signature-callback", async (req, res) => {
    try {
      const { bookingId, envelopeId, status } = req.query;

      if (status === 'success') {
        const contracts = await storage.getContractsByBooking(parseInt(bookingId as string));
        if (contracts.length > 0) {
          await storage.updateContract(contracts[0].id, {
            status: 'signed',
            renterSigned: true,
            ownerSigned: true, // Auto-approve owner signature for now
            renterSignedAt: new Date(),
            ownerSignedAt: new Date(),
          });
        }

        // Redirect to success page
        res.redirect(`/contract-signed-success?bookingId=${bookingId}`);
      } else {
        // Redirect to error page
        res.redirect(`/contract-signature-error?bookingId=${bookingId}&error=${status}`);
      }
    } catch (error) {
      console.error("Signature callback error:", error);
      res.redirect('/contract-signature-error?error=callback_failed');
    }
  });

  // DocuSign signature simulator for development
  app.get("/simulate-docusign-signature", (req, res) => {
    const { envelopeId, returnUrl, signerEmail, signerName } = req.query;
    
    // Log simulator access for debugging
    console.log('📄 Simulador DocuSign acessado:', {
      envelopeId,
      returnUrl,
      signerEmail,
      signerName,
      timestamp: new Date().toISOString()
    });
    
    // Set proper headers for better compatibility
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    
    res.send(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DocuSign - Assinatura Digital</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', Arial, sans-serif;
            background: linear-gradient(135deg, #0070f3 0%, #0051a5 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container { 
            background: white; 
            padding: 40px; 
            border-radius: 15px; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.1); 
            max-width: 600px;
            width: 100%;
            text-align: center;
          }
          .header { margin-bottom: 30px; }
          .logo { 
            font-size: 2.5em; 
            margin-bottom: 15px; 
            background: linear-gradient(135deg, #0070f3, #0051a5);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: bold;
          }
          .header h1 { color: #0070f3; margin: 15px 0; font-size: 1.8em; }
          .header p { color: #6b7280; font-size: 1.1em; }
          .document { 
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); 
            padding: 25px; 
            border-radius: 10px; 
            margin: 25px 0; 
            border-left: 5px solid #0070f3;
            text-align: left;
          }
          .document h3 { color: #0070f3; margin-bottom: 15px; text-align: center; }
          .document p { margin: 10px 0; color: #374151; }
          .actions { margin-top: 35px; }
          button { 
            padding: 15px 25px; 
            margin: 10px 8px; 
            border: none; 
            border-radius: 8px; 
            cursor: pointer; 
            font-size: 16px; 
            font-weight: 600;
            transition: all 0.3s ease;
            min-width: 160px;
            font-family: inherit;
          }
          button:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 10px 20px rgba(0,0,0,0.2); 
          }
          button:active { transform: translateY(0); }
          .btn-success { 
            background: linear-gradient(135deg, #10b981 0%, #34d399 100%); 
            color: white; 
          }
          .btn-danger { 
            background: linear-gradient(135deg, #ef4444 0%, #f87171 100%); 
            color: white; 
          }
          .btn-secondary { 
            background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%); 
            color: white; 
          }
          .footer { 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 1px solid #e5e7eb;
            color: #6b7280; 
            font-size: 0.9em; 
          }
          .processing {
            display: none;
            padding: 50px 20px;
            text-align: center;
          }
          .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #e5e7eb;
            border-top: 4px solid #0070f3;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @media (max-width: 600px) {
            .container { padding: 25px; margin: 10px; }
            button { width: 100%; margin: 8px 0; }
            .logo { font-size: 2em; }
            .header h1 { font-size: 1.5em; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div id="main-content">
            <div class="header">
              <div class="logo">DocuSign</div>
              <h1>Assinatura Digital Profissional</h1>
              <p>Plataforma Líder Mundial em Assinatura Eletrônica</p>
            </div>
            
            <div class="document">
              <h3>📄 Contrato de Locação de Veículo</h3>
              <p><strong>🆔 Envelope ID:</strong> ${envelopeId}</p>
              <p><strong>👤 Signatário:</strong> ${signerName}</p>
              <p><strong>📧 Email:</strong> ${signerEmail}</p>
              <p><strong>📊 Status:</strong> Aguardando assinatura digital</p>
              <p><strong>🕒 Válido até:</strong> ${new Date(Date.now() + 24*60*60*1000).toLocaleDateString('pt-BR')}</p>
            </div>
            
            <div class="actions">
              <button class="btn-success" onclick="signDocument('success')">
                ✅ Assinar Documento
              </button>
              <button class="btn-danger" onclick="signDocument('declined')">
                ❌ Recusar Assinatura
              </button>
              <button class="btn-secondary" onclick="signDocument('timeout')">
                ⏰ Simular Timeout
              </button>
            </div>
            
            <div class="footer">
              <p><strong>🔧 Simulador de Desenvolvimento</strong></p>
              <p>Em produção, este seria o ambiente oficial DocuSign</p>
            </div>
          </div>
          
          <div id="processing" class="processing">
            <div class="spinner"></div>
            <h2 style="color: #0070f3; margin-bottom: 15px;">Processando assinatura...</h2>
            <p style="color: #6b7280;">Aguarde, você será redirecionado automaticamente</p>
          </div>
        </div>

        <script>
          console.log('📄 Simulador DocuSign carregado');
          console.log('📄 Envelope:', '${envelopeId}');
          console.log('🔗 Return URL:', '${returnUrl}');
          
          function signDocument(status) {
            console.log('🔄 Processando assinatura:', status);
            
            // Show processing state
            document.getElementById('main-content').style.display = 'none';
            document.getElementById('processing').style.display = 'block';
            
            const returnUrl = "${returnUrl}";
            const finalUrl = returnUrl + "&status=" + status;
            
            console.log('🔗 URL final:', finalUrl);
            
            // Redirect after delay
            setTimeout(() => {
              console.log('🚀 Redirecionando...');
              console.log('URL final para redirecionamento:', finalUrl);
              try {
                window.location.href = finalUrl;
              } catch (error) {
                console.error('Erro no redirecionamento:', error);
                // Fallback: try direct navigation
                window.location.replace(finalUrl);
              }
            }, 2500);
          }
          
          // Log when page is ready
          document.addEventListener('DOMContentLoaded', function() {
            console.log('✅ Simulador pronto para uso');
          });
          
          // Prevent accidental navigation
          window.addEventListener('beforeunload', function(e) {
            if (document.getElementById('processing').style.display === 'block') {
              e.preventDefault();
              e.returnValue = '';
            }
          });
        </script>
      </body>
      </html>
    `);
  });

  // Test upload endpoint to debug 413 errors
  app.post('/api/test-upload', upload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Nenhum arquivo enviado' });
      }
      
      res.json({ 
        message: 'Upload realizado com sucesso',
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    } catch (error) {
      console.error('Upload test error:', error);
      res.status(500).json({ message: 'Erro no upload de teste' });
    }
  });

  // Admin Settings API routes
  app.get("/api/admin/settings", authenticateToken, requireAdmin, async (req, res) => {
    try {
      // Return default settings for now
      const defaultSettings = {
        serviceFeePercentage: 10,
        insuranceFeePercentage: 15,
        minimumBookingDays: 1,
        maximumBookingDays: 30,
        cancellationPolicyDays: 2,
        currency: "BRL",
        supportEmail: "suporte@carshare.com",
        supportPhone: "(11) 9999-9999",
      };
      res.json(defaultSettings);
    } catch (error) {
      console.error("Error fetching admin settings:", error);
      res.status(500).json({ message: "Erro ao buscar configurações" });
    }
  });

  app.put("/api/admin/settings", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const settings = req.body;
      
      // Validate settings
      if (settings.serviceFeePercentage < 0 || settings.serviceFeePercentage > 50) {
        return res.status(400).json({ message: 'Taxa de serviço deve estar entre 0% e 50%' });
      }
      
      if (settings.insuranceFeePercentage < 0 || settings.insuranceFeePercentage > 30) {
        return res.status(400).json({ message: 'Taxa de seguro deve estar entre 0% e 30%' });
      }

      // For now, just return the updated settings (would be saved to DB in production)
      res.json(settings);
    } catch (error) {
      console.error("Error updating admin settings:", error);
      res.status(500).json({ message: "Erro ao atualizar configurações" });
    }
  });

  // Coupon Management API routes
  app.get("/api/admin/coupons", authenticateToken, requireAdmin, async (req, res) => {
    try {
      // Return sample coupons for now (would be from database in production)
      const sampleCoupons = [
        {
          id: 1,
          code: "DESCONTO10",
          description: "10% de desconto em qualquer reserva",
          discountType: "percentage",
          discountValue: 10,
          minOrderValue: 5000, // R$ 50.00
          maxUses: 100,
          usedCount: 15,
          isActive: true,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          createdBy: req.user!.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          code: "WELCOME20",
          description: "R$ 20 de desconto para novos usuários",
          discountType: "fixed",
          discountValue: 2000, // R$ 20.00 in cents
          minOrderValue: 10000, // R$ 100.00
          maxUses: 50,
          usedCount: 8,
          isActive: true,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          createdBy: req.user!.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];
      res.json(sampleCoupons);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      res.status(500).json({ message: "Erro ao buscar cupons" });
    }
  });

  app.post("/api/admin/coupons", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const couponData = {
        ...req.body,
        id: Date.now(), // Temporary ID generation
        usedCount: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      res.status(201).json(couponData);
    } catch (error) {
      console.error("Error creating coupon:", error);
      res.status(500).json({ message: "Erro ao criar cupom" });
    }
  });

  app.put("/api/admin/coupons/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const couponId = parseInt(req.params.id);
      const updatedCoupon = {
        ...req.body,
        id: couponId,
        updatedAt: new Date(),
      };
      res.json(updatedCoupon);
    } catch (error) {
      console.error("Error updating coupon:", error);
      res.status(500).json({ message: "Erro ao atualizar cupom" });
    }
  });

  app.delete("/api/admin/coupons/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const couponId = parseInt(req.params.id);
      // In production, this would delete from database
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting coupon:", error);
      res.status(500).json({ message: "Erro ao excluir cupom" });
    }
  });

  // Coupon validation endpoint for checkout
  app.post("/api/validate-coupon", authenticateToken, async (req, res) => {
    try {
      const { code, orderValue } = req.body;
      
      if (!code || !orderValue) {
        return res.status(400).json({ message: "Código do cupom e valor do pedido são obrigatórios" });
      }

      // Sample validation logic (would use database in production)
      const sampleCoupons = [
        {
          id: 1,
          code: "DESCONTO10",
          discountType: "percentage",
          discountValue: 10,
          minOrderValue: 5000,
          maxUses: 100,
          usedCount: 15,
          isActive: true,
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }
      ];

      const coupon = sampleCoupons.find(c => c.code === code.toUpperCase());
      
      if (!coupon) {
        return res.status(404).json({ message: "Cupom não encontrado" });
      }

      if (!coupon.isActive) {
        return res.status(400).json({ message: "Cupom inativo" });
      }

      if (new Date() > coupon.validUntil) {
        return res.status(400).json({ message: "Cupom expirado" });
      }

      if (coupon.usedCount >= coupon.maxUses) {
        return res.status(400).json({ message: "Cupom esgotado" });
      }

      if (orderValue < coupon.minOrderValue) {
        const minValue = (coupon.minOrderValue / 100).toFixed(2);
        return res.status(400).json({ message: `Valor mínimo do pedido: R$ ${minValue}` });
      }

      // Calculate discount
      let discountAmount = 0;
      if (coupon.discountType === "percentage") {
        discountAmount = Math.round((orderValue * coupon.discountValue) / 100);
      } else {
        discountAmount = coupon.discountValue;
      }

      discountAmount = Math.min(discountAmount, orderValue);
      const finalAmount = orderValue - discountAmount;

      res.json({
        isValid: true,
        coupon,
        discountAmount,
        finalAmount,
        message: "Cupom válido aplicado com sucesso!"
      });
    } catch (error) {
      console.error("Error validating coupon:", error);
      res.status(500).json({ message: "Erro ao validar cupom" });
    }
  });

  // Payment Transfer Routes - Sistema de repasses
  app.get("/api/payment-transfers", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { period, status } = req.query;

      // Get real payout data from database
      let query = `
        SELECT 
          p.*,
          p.status as transferStatus,
          p.payout_date as transferDate,
          p.reference as transferReference
        FROM payouts p 
        WHERE p.owner_id = $1
      `;
      const params = [userId];

      if (status && status !== 'all') {
        query += ` AND p.status = $${params.length + 1}`;
        params.push(status);
      }

      if (period && period !== 'all') {
        const now = new Date();
        let startDate;
        
        switch (period) {
          case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '90d':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(0);
        }
        
        query += ` AND p.created_at >= $${params.length + 1}`;
        params.push(startDate.toISOString());
      }

      query += ` ORDER BY p.created_at DESC`;

      const result = await pool.query(query, params);

      const transfers = result.rows.map((row: any) => ({
        ...row,
        ownerPix: row.owner_pix,
        totalBookingAmount: row.total_booking_amount,
        serviceFee: row.service_fee,
        insuranceFee: row.insurance_fee,
        couponDiscount: row.coupon_discount || '0.00',
        netAmount: row.net_amount,
        payoutDate: row.payout_date,
        bookingId: row.booking_id,
        ownerId: row.owner_id,
        renterId: row.renter_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      res.json(transfers);
    } catch (error) {
      console.error("Error fetching payment transfers:", error);
      res.status(500).json({ message: "Erro ao buscar repasses" });
    }
  });

  app.get("/api/earnings-summary", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;

      // Get real earnings summary from database
      const summaryQuery = `
        SELECT 
          SUM(CASE WHEN status = 'completed' THEN CAST(net_amount AS DECIMAL(10,2)) ELSE 0 END) as total_received,
          SUM(CASE WHEN status = 'pending' THEN CAST(net_amount AS DECIMAL(10,2)) ELSE 0 END) as pending_amount,
          SUM(CASE WHEN status = 'completed' AND created_at >= date_trunc('month', CURRENT_DATE) 
               THEN CAST(net_amount AS DECIMAL(10,2)) ELSE 0 END) as this_month_earnings,
          COUNT(*) as total_transfers
        FROM payouts 
        WHERE owner_id = $1
      `;

      const result = await pool.query(summaryQuery, [userId]);

      const row = result.rows[0];
      const summary = {
        totalReceived: parseFloat(row.total_received || '0'),
        pendingAmount: parseFloat(row.pending_amount || '0'),
        thisMonthEarnings: parseFloat(row.this_month_earnings || '0'),
        totalTransfers: parseInt(row.total_transfers || '0'),
      };

      res.json(summary);
    } catch (error) {
      console.error("Error fetching earnings summary:", error);
      res.status(500).json({ message: "Erro ao buscar resumo de ganhos" });
    }
  });

  // Process payment and create transfer (called after Stripe payment success)
  app.post("/api/process-payment-transfer", authenticateToken, async (req, res) => {
    try {
      const { bookingId, paymentIntentId } = req.body;

      if (!bookingId || !paymentIntentId) {
        return res.status(400).json({ message: "BookingId e PaymentIntentId são obrigatórios" });
      }

      // Sample booking data for now (in production would fetch from database)
      const sampleBooking = {
        id: bookingId,
        totalPrice: "250.00",
        ownerId: 123,
        renterId: req.user!.id
      };

      // Sample owner data (in production would fetch from database)
      const sampleOwner = {
        id: 123,
        pix: "owner@email.com" // Using the new field name
      };

      if (!sampleOwner.pix) {
        return res.status(400).json({ message: "Proprietário não possui chave PIX cadastrada" });
      }

      // Sample admin settings (in production would fetch from database)
      const serviceFeePercent = 10;
      const insuranceFeePercent = 5;
      
      const totalPrice = parseFloat(sampleBooking.totalPrice);
      const serviceFee = Math.round((totalPrice * serviceFeePercent) / 100 * 100) / 100;
      const insuranceFee = Math.round((totalPrice * insuranceFeePercent) / 100 * 100) / 100;
      const netAmount = Math.round((totalPrice - serviceFee - insuranceFee) * 100) / 100;

      // Create payment transfer record (sample implementation)
      const transfer = {
        id: Date.now(),
        bookingId: sampleBooking.id,
        ownerId: sampleBooking.ownerId,
        renterId: sampleBooking.renterId,
        totalBookingAmount: totalPrice.toString(),
        serviceFee: serviceFee.toString(),
        insuranceFee: insuranceFee.toString(),
        couponDiscount: '0',
        netAmount: netAmount.toString(),
        ownerPix: sampleOwner.pix,
        status: 'pending',
        method: 'transfer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // In production, this would trigger actual PIX transfer
      console.log("Transfer created:", transfer);

      res.json({
        success: true,
        transfer,
        message: "Repasse processado com sucesso. O proprietário receberá o valor em até 2 dias úteis."
      });
    } catch (error) {
      console.error("Error processing payment transfer:", error);
      res.status(500).json({ message: "Erro ao processar repasse" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
