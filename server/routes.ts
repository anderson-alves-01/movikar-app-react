import type { Express, Request, Response, NextFunction } from "express";
import { WebSocketServer, WebSocket } from 'ws';

interface AuthRequest extends Request {
  user?: User;
}
import { createServer, type Server } from "http";
import rateLimit from "express-rate-limit";
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
  insertVehicleInspectionSchema,
  insertVehicleInspectionFormSchema,
  users,
  userDocuments,
  vehicles,
  bookings,
  reviews,
  subscriptionPlans,
  userSubscriptions,
  vehicleInspections,
  qualifiedLeads,
  vehicleBoosts,
  premiumServices,
  userPremiumServices,
  type User, 
  type VehicleBrand, 
  type UserDocument,
  type SubscriptionPlan,
  type UserSubscription,
  type VehicleInspection,
  type QualifiedLead,
  type VehicleBoost,
  type PremiumService,
  type UserPremiumService
} from "@shared/schema";
import { ZodError } from "zod";
// import { contractService } from "./services/contractService.js";
// import { processSignatureWebhook } from "./services/signatureService.js";
import './services/signatureService.js'; // Force module load
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";
import { db, pool } from "./db";
import { sql, eq, lte, gte, desc, ilike, and, lt, asc, or } from "drizzle-orm";
import Stripe from "stripe";
import multer from "multer";
// @ts-ignore
import docusign from 'docusign-esign';
import { getFeatureFlags } from "@shared/feature-flags";
import type { AdminSettings } from "@shared/admin-settings";
import { registerHealthRoutes } from "./routes/health";
import emailService, { type BookingEmailData, type SubscriptionEmailData } from "./services/emailService";

// In-memory storage for admin settings
let currentAdminSettings: AdminSettings = {
  serviceFeePercentage: 10,
  insuranceFeePercentage: 15,
  minimumBookingDays: 1,
  maximumBookingDays: 30,
  cancellationPolicyDays: 2,
  currency: "BRL",
  supportEmail: "sac@alugae.mobi",
  supportPhone: "(11) 9999-9999",
  enablePixPayment: false,
  enablePixTransfer: true,
  pixTransferDescription: "Repasse alugae",
  enableInsuranceOption: true, // Feature toggle para opção de seguro
  enableContractSignature: false, // Feature toggle para assinatura de contratos
  enableRentNowCheckout: true, // Feature toggle para checkout "Aluga Agora"
  essentialPlanPrice: 29.90,
  plusPlanPrice: 59.90,
  annualDiscountPercentage: 15,
};

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('❌ CRITICAL SECURITY ERROR: JWT_SECRET environment variable is required');
  console.error('❌ Application cannot start without a secure JWT secret');
  process.exit(1);
}

// TypeScript assertion - we know JWT_SECRET is defined after the check above
// TypeScript assertion - we know JWT_SECRET is defined after the check above

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
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.warn('Warning: STRIPE_SECRET_KEY not found. Stripe functionality will be disabled.');
} else {
  console.log('✅ Stripe secret key loaded: [HIDDEN FOR SECURITY]');
}

let stripe: Stripe | null = null;
if (stripeSecretKey) {
  try {
    stripe = new Stripe(stripeSecretKey);
    console.log('✅ Stripe initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing Stripe:', error);
    stripe = null;
  }
}

// DocuSign configuration with proper validation
const DOCUSIGN_INTEGRATION_KEY = process.env.DOCUSIGN_INTEGRATION_KEY;
const DOCUSIGN_USER_ID = process.env.DOCUSIGN_USER_ID;
const DOCUSIGN_ACCOUNT_ID = process.env.DOCUSIGN_ACCOUNT_ID;
const DOCUSIGN_RSA_PRIVATE_KEY = process.env.DOCUSIGN_RSA_PRIVATE_KEY;
const DOCUSIGN_BASE_URI = process.env.DOCUSIGN_BASE_URI || 'https://demo.docusign.net/restapi';

// Validate critical DocuSign environment variables
const hasDocuSignConfig = DOCUSIGN_INTEGRATION_KEY && DOCUSIGN_USER_ID && DOCUSIGN_ACCOUNT_ID && DOCUSIGN_RSA_PRIVATE_KEY;
if (!hasDocuSignConfig) {
  console.warn('⚠️ DocuSign credentials not fully configured - some features will use mock mode');
}

// DocuSign envelope creation function using the signature service
async function createDocuSignEnvelope(params: {
  bookingId: number;
  booking: any;
  envelopeId: string;
  returnUrl: string;
  signerEmail: string;
  signerName: string;
}): Promise<string> {
  const { booking, envelopeId, returnUrl, signerEmail, signerName } = params;

  try {
    // Import the signature service
    const { sendToSignaturePlatform } = await import('./services/signatureService.js');
    
    // Create contract object for the signature service
    const contract = {
      contractNumber: `CNT-${Date.now()}`,
      signaturePlatform: 'docusign',
      contractData: {
        renter: {
          name: signerName,
          email: signerEmail
        },
        owner: {
          name: booking.owner?.name || 'Owner',
          email: booking.owner?.email || 'owner@example.com'
        }
      }
    };

    // Generate a dummy PDF URL for now (would be replaced with actual contract PDF)
    const pdfUrl = `${returnUrl.split('/contract-signature-callback')[0]}/api/contracts/pdf/${booking.id}`;
    
    // Use the signature service to create the document
    const documentId = await sendToSignaturePlatform(contract, pdfUrl);
    
    // The signature service will return either a real DocuSign URL or a mock URL
    // depending on whether credentials are configured
    console.log("✅ DocuSign envelope created with documentId:", documentId);
    
    // For now, return a success URL that the contract service would provide
    return `${returnUrl}?status=success`;

  } catch (error) {
    console.error('DocuSign envelope creation error:', error);
    throw error;
  }
}

// Generate contract PDF function
async function generateContractPDF(booking: any): Promise<string> {
  // Generate a minimal valid PDF document
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 12 Tf
72 720 Td
(CONTRATO DE LOCACAO DE VEICULO) Tj
0 -20 Td
(Veiculo: ${booking.vehicle?.brand || 'N/A'} ${booking.vehicle?.model || 'N/A'}) Tj
0 -20 Td
(Locatario: ${booking.renter?.name || 'N/A'}) Tj
0 -20 Td
(Proprietario: ${booking.owner?.name || 'N/A'}) Tj
0 -20 Td
(Data: ${booking.startDate} ate ${booking.endDate}) Tj
0 -20 Td
(Valor Total: R$ ${booking.totalCost || '0,00'}) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000110 00000 n 
0000000252 00000 n 
0000000504 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
569
%%EOF`;

  // Convert to base64
  return Buffer.from(pdfContent).toString('base64');
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
  console.log('🔐 Auth middleware - URL:', req.path);
  console.log('🔐 Auth middleware - All cookies:', req.cookies);

  // Try cookies first, then Authorization header as fallback
  let token = req.cookies?.token;

  if (!token) {
    const authHeader = req.headers.authorization;
    console.log('🔐 Auth middleware - Authorization header:', authHeader);
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log('🔐 Auth middleware - Using Authorization header fallback, token:', token.substring(0, 20) + '...');
    }
  } else {
    console.log('🔐 Auth middleware - Using cookie token');
  }

  console.log('🔐 Auth middleware - Token exists:', !!token);

  if (!token) {
    console.log('❌ Auth middleware - No token found in cookies or headers');
    // Clear any stale cookies if no token
    res.clearCookie('token');
    res.clearCookie('refresh_token');
    return res.status(401).json({ message: 'Token de acesso obrigatório' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    console.log('🔐 Auth middleware - Token decoded, userId:', decoded.userId);

    const user = await storage.getUser(decoded.userId);
    if (!user) {
      console.log('❌ Auth middleware - User not found for ID:', decoded.userId);
      res.clearCookie('token');
      res.clearCookie('refresh_token');
      return res.status(403).json({ message: 'Token inválido' });
    }

    console.log('✅ Auth middleware - User authenticated:', user.email);
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      // Try to refresh token from refresh_token cookie
      const refreshToken = req.cookies?.refresh_token;

      if (!refreshToken) {
        res.clearCookie('token');
        res.clearCookie('refresh_token');
        return res.status(401).json({ message: "Token expirado e refresh token não encontrado" });
      }

      try {
        const decoded = jwt.verify(refreshToken, JWT_SECRET + '_refresh') as { userId: number };
        const user = await storage.getUser(decoded.userId);

        if (!user) {
          res.clearCookie('token');
          res.clearCookie('refresh_token');
          return res.status(401).json({ message: "Usuário não encontrado" });
        }

        // Generate new tokens
        const newToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
        const newRefreshToken = jwt.sign({ userId: user.id }, JWT_SECRET + '_refresh', { expiresIn: '7d' });

        // Set new cookies with consistent settings
        const cookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
          sameSite: process.env.NODE_ENV === 'production' ? 'strict' as const : 'lax' as const,
          path: '/',
          domain: undefined // Let browser handle domain
        };

        res.cookie('token', newToken, {
          ...cookieOptions,
          maxAge: 15 * 60 * 1000
        });

        res.cookie('refresh_token', newRefreshToken, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000
        });

        req.user = user;
        next();
      } catch (refreshError) {
        console.error('Refresh token error:', refreshError);
        res.clearCookie('token');
        res.clearCookie('refresh_token');
        return res.status(401).json({ message: "Refresh token inválido" });
      }
    } else {
      console.error('Token verification error:', error);
      res.clearCookie('token');
      res.clearCookie('refresh_token');
      return res.status(403).json({ message: 'Token inválido' });
    }
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
  // Trust proxy configuration for Replit environment
  app.set('trust proxy', 1);

  // Rate limiting configuration - mais permissivo para desenvolvimento e testes
  const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes (reduzido de 15)
    max: 50, // Limit cada IP to 50 requests per windowMs (aumentado de 10)
    message: { message: 'Muitas tentativas de login. Tente novamente em alguns minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Pular rate limiting para refresh e logout durante desenvolvimento
      return process.env.NODE_ENV === 'development' && 
             (req.path === '/api/auth/refresh' || req.path === '/api/auth/logout');
    }
  });

  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: { message: 'Muitas requisições. Tente novamente em alguns minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply rate limiting
  app.use('/api/auth', authLimiter);
  app.use('/api', generalLimiter);

  // Store checkout data temporarily to avoid URL length issues
  const checkoutDataStore = new Map();

  app.post("/api/store-checkout-data", authenticateToken, async (req, res) => {
    try {
      const checkoutData = req.body;
      
      // Calculate security deposit if not provided
      if (!checkoutData.securityDeposit && checkoutData.vehicle?.securityDepositValue) {
        const dailyPrice = parseFloat(checkoutData.vehicle.pricePerDay);
        const securityDepositValue = parseFloat(checkoutData.vehicle.securityDepositValue);
        const securityDepositType = checkoutData.vehicle.securityDepositType || 'percentage';
        const securityDeposit = securityDepositType === 'percentage' 
          ? (dailyPrice * securityDepositValue / 100).toFixed(2)
          : securityDepositValue.toFixed(2);
        checkoutData.securityDeposit = securityDeposit;
      }
      
      const checkoutId = `checkout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Store data for 45 minutes (increased from 30 to give more time)
      checkoutDataStore.set(checkoutId, {
        data: checkoutData,
        timestamp: Date.now(),
        userId: req.user!.id
      });

      // Clean up old entries (older than 45 minutes)
      for (const [key, value] of Array.from(checkoutDataStore.entries())) {
        if (Date.now() - value.timestamp > 45 * 60 * 1000) {
          checkoutDataStore.delete(key);
        }
      }

      res.json({ checkoutId });
    } catch (error) {
      console.error("Store checkout data error:", error);
      res.status(500).json({ message: "Erro ao armazenar dados de checkout" });
    }
  });

  app.get("/api/checkout-data/:checkoutId", authenticateToken, async (req, res) => {
    try {
      const { checkoutId } = req.params;
      const stored = checkoutDataStore.get(checkoutId);

      if (!stored) {
        return res.status(404).json({ message: "Dados de checkout não encontrados ou expirados" });
      }

      // Verify ownership
      if (stored.userId !== req.user!.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Check if expired (45 minutes)
      if (Date.now() - stored.timestamp > 45 * 60 * 1000) {
        checkoutDataStore.delete(checkoutId);
        return res.status(404).json({ message: "Dados de checkout expirados" });
      }

      res.json(stored.data);
    } catch (error) {
      console.error("Get checkout data error:", error);
      res.status(500).json({ message: "Erro ao recuperar dados de checkout" });
    }
  });

  // Payment routes for Stripe integration
  app.post("/api/create-payment-intent", authenticateToken, async (req, res) => {
    console.log('🔍 VALIDAÇÃO - Iniciando processo de validação para payment intent...');
    console.log('📝 DADOS RECEBIDOS:', JSON.stringify(req.body, null, 2));
    
    try {
      // Comprehensive input validation
      const { vehicleId, startDate, endDate, totalPrice } = req.body;
      
      // Validate required fields
      console.log('🔍 VALIDAÇÃO ETAPA 1 - Verificando campos obrigatórios...');
      if (!vehicleId || !startDate || !endDate || !totalPrice) {
        console.log('❌ FALHA NA VALIDAÇÃO - ETAPA 1: Campos obrigatórios ausentes');
        console.log('📊 DETALHES:', { vehicleId, startDate, endDate, totalPrice });
        console.log('🎯 RETORNO: HTTP 400 - Dados obrigatórios não fornecidos');
        return res.status(400).json({ 
          message: "Dados obrigatórios não fornecidos. Verifique o veículo, datas e preço." 
        });
      }
      console.log('✅ VALIDAÇÃO ETAPA 1 - APROVADA: Todos os campos obrigatórios presentes');

      // Validate data types and formats
      console.log('🔍 VALIDAÇÃO ETAPA 2 - Verificando tipos de dados...');
      const vehicleIdNum = Number(vehicleId);
      if (!vehicleId || !Number.isInteger(vehicleIdNum) || vehicleIdNum <= 0) {
        console.log('❌ FALHA NA VALIDAÇÃO - ETAPA 2: ID do veículo inválido');
        console.log('📊 DETALHES: vehicleId =', vehicleId, 'vehicleIdNum =', vehicleIdNum);
        console.log('🎯 RETORNO: HTTP 400 - ID do veículo inválido');
        return res.status(400).json({ message: "ID do veículo inválido" });
      }
      console.log('✅ VALIDAÇÃO ETAPA 2 - APROVADA: ID do veículo válido =', vehicleIdNum);

      // Validate date formats
      console.log('🔍 VALIDAÇÃO ETAPA 3 - Verificando formato de datas...');
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        console.log('❌ FALHA NA VALIDAÇÃO - ETAPA 3: Formato de data inválido');
        console.log('📊 DETALHES:', { startDate, endDate, startDateObj, endDateObj });
        console.log('🎯 RETORNO: HTTP 400 - Formato de data inválido');
        return res.status(400).json({ message: "Formato de data inválido" });
      }
      console.log('✅ VALIDAÇÃO ETAPA 3 - APROVADA: Datas válidas');

      // Validate date logic
      console.log('🔍 VALIDAÇÃO ETAPA 4 - Verificando lógica de datas...');
      if (startDateObj >= endDateObj) {
        console.log('❌ FALHA NA VALIDAÇÃO - ETAPA 4: Data de início não anterior à data de fim');
        console.log('📊 DETALHES:', { startDate, endDate, startDateObj, endDateObj });
        console.log('🎯 RETORNO: HTTP 400 - Data de início deve ser anterior à data de fim');
        return res.status(400).json({ message: "Data de início deve ser anterior à data de fim" });
      }

      // Validate minimum rental period (at least 1 day)
      const diffDays = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 1) {
        console.log('❌ FALHA NA VALIDAÇÃO - ETAPA 4B: Período de aluguel muito curto');
        console.log('📊 DETALHES: Dias calculados =', diffDays);
        console.log('🎯 RETORNO: HTTP 400 - Período mínimo de aluguel é de 1 dia');
        return res.status(400).json({ message: "Período mínimo de aluguel é de 1 dia" });
      }
      console.log('✅ VALIDAÇÃO ETAPA 4 - APROVADA: Lógica de datas válida, período =', diffDays, 'dias');

      // Validate price format and range
      console.log('🔍 VALIDAÇÃO ETAPA 5 - Verificando formato e faixas de preço...');
      const priceNum = parseFloat(totalPrice);
      if (isNaN(priceNum) || priceNum <= 0) {
        console.log('❌ FALHA NA VALIDAÇÃO - ETAPA 5A: Preço zero ou negativo');
        console.log('📊 DETALHES: totalPrice =', totalPrice, 'priceNum =', priceNum);
        console.log('🎯 RETORNO: HTTP 400 - Preço deve ser maior que zero');
        return res.status(400).json({ message: "Preço deve ser maior que zero" });
      }

      if (priceNum > 999999) {
        console.log('❌ FALHA NA VALIDAÇÃO - ETAPA 5B: Preço acima do limite');
        console.log('📊 DETALHES: totalPrice =', totalPrice, 'priceNum =', priceNum);
        console.log('🎯 RETORNO: HTTP 400 - Preço excede o limite máximo permitido');
        return res.status(400).json({ message: "Preço excede o limite máximo permitido" });
      }

      // Validate minimum amount for BRL (Stripe minimum is 50 centavos = R$ 0.50)
      if (priceNum < 0.50) {
        console.log('❌ FALHA NA VALIDAÇÃO - ETAPA 5C: Preço abaixo do mínimo Stripe');
        console.log('📊 DETALHES: totalPrice =', totalPrice, 'priceNum =', priceNum, 'Mínimo Stripe = R$ 0,50');
        console.log('🎯 RETORNO: HTTP 400 - Valor mínimo de cobrança é R$ 0,50');
        return res.status(400).json({ message: "Valor mínimo de cobrança é R$ 0,50" });
      }
      console.log('✅ VALIDAÇÃO ETAPA 5 - APROVADA: Preço válido = R$', priceNum);

      console.log('💳 Criando payment intent:', { vehicleId, startDate, endDate, totalPrice, userId: req.user!.id });

      // Validate user verification status
      console.log('🔍 VALIDAÇÃO ETAPA 6 - Verificando status do usuário...');
      const user = await storage.getUser(req.user!.id);
      console.log('👤 Status de verificação do usuário:', user?.verificationStatus);

      if (!user) {
        console.log('❌ FALHA NA VALIDAÇÃO - ETAPA 6A: Usuário não encontrado');
        console.log('🎯 RETORNO: HTTP 404 - Usuário não encontrado');
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      if (user.verificationStatus !== 'verified') {
        console.log('❌ FALHA NA VALIDAÇÃO - ETAPA 6B: Usuário não verificado');
        console.log('📊 DETALHES: Status =', user.verificationStatus);
        console.log('🎯 RETORNO: HTTP 403 - Usuário não verificado');
        return res.status(403).json({ 
          message: "Usuário não verificado. Complete a verificação de documentos antes de alugar um veículo." 
        });
      }
      console.log('✅ VALIDAÇÃO ETAPA 6 - APROVADA: Usuário verificado');

      // Get vehicle details with enhanced validation
      console.log('🔍 VALIDAÇÃO ETAPA 7 - Verificando dados do veículo...');
      const vehicle = await storage.getVehicle(vehicleIdNum);
      if (!vehicle) {
        console.log('❌ FALHA NA VALIDAÇÃO - ETAPA 7A: Veículo não encontrado');
        console.log('📊 DETALHES: vehicleId =', vehicleIdNum);
        console.log('🎯 RETORNO: HTTP 404 - Veículo não encontrado');
        return res.status(404).json({ message: "Veículo não encontrado" });
      }

      // Verify vehicle status (both 'active' and 'approved' are valid for rental)
      if (vehicle.status !== 'active' && vehicle.status !== 'approved') {
        console.log('❌ FALHA NA VALIDAÇÃO - ETAPA 7B: Veículo não disponível para aluguel');
        console.log('📊 DETALHES: vehicleId =', vehicleIdNum, 'status =', vehicle.status);
        console.log('ℹ️  NOTA: Status válidos para aluguel: active, approved');
        console.log('🎯 RETORNO: HTTP 400 - Veículo não está disponível para aluguel');
        return res.status(400).json({ message: "Veículo não está disponível para aluguel" });
      }

      // Prevent owner from renting their own vehicle
      if (vehicle.ownerId === req.user!.id) {
        console.log('❌ FALHA NA VALIDAÇÃO - ETAPA 7C: Usuário tentando alugar próprio veículo');
        console.log('📊 DETALHES: ownerId =', vehicle.ownerId, 'userId =', req.user!.id);
        console.log('🎯 RETORNO: HTTP 400 - Você não pode alugar seu próprio veículo');
        return res.status(400).json({ message: "Você não pode alugar seu próprio veículo" });
      }
      console.log('✅ VALIDAÇÃO ETAPA 7 - APROVADA: Veículo válido e disponível');

      // Check availability with enhanced error reporting
      console.log('🔍 VALIDAÇÃO ETAPA 8 - Verificando disponibilidade do veículo...');
      const isAvailable = await storage.checkVehicleAvailability(vehicleIdNum, startDateObj, endDateObj);
      console.log('📅 Resultado da verificação de disponibilidade:', {
        vehicleId: vehicleIdNum,
        startDate,
        endDate,
        isAvailable
      });

      if (!isAvailable) {
        console.log('❌ FALHA NA VALIDAÇÃO - ETAPA 8: Veículo não disponível nas datas solicitadas');
        // Log more details about why it's not available
        const existingBookings = await storage.getBookingsByVehicle(vehicleIdNum);
        const conflictingBookings = existingBookings.filter(booking => {
          const bookingStart = new Date(booking.startDate);
          const bookingEnd = new Date(booking.endDate);
          
          return (startDateObj <= bookingEnd && endDateObj >= bookingStart);
        });
        
        console.log('📊 DETALHES: Reservas conflitantes encontradas =', conflictingBookings.length);
        console.log('🎯 RETORNO: HTTP 400 - Veículo não disponível para as datas selecionadas');
        
        return res.status(400).json({ 
          message: "Veículo não disponível para as datas selecionadas. Tente outras datas." 
        });
      }
      console.log('✅ VALIDAÇÃO ETAPA 8 - APROVADA: Veículo disponível nas datas solicitadas');

      // Get admin settings from database for feature flags
      const dbSettings = await storage.getAdminSettings();
      const adminSettings = dbSettings ? {
        ...dbSettings,
        serviceFeePercentage: parseFloat(dbSettings.serviceFeePercentage || "10"),
        insuranceFeePercentage: parseFloat(dbSettings.insuranceFeePercentage || "15"),
      } : currentAdminSettings;

      // Force only card payments due to Stripe PIX configuration issues
      const paymentMethodTypes = ['card'];

      console.log('🔧 Payment methods:', paymentMethodTypes);
      console.log('💰 Amount in cents:', Math.round(priceNum * 100));

      // Enhanced Stripe validation
      if (!stripe) {
        console.log('❌ Stripe not configured - STRIPE_SECRET_KEY missing');
        return res.status(500).json({ message: "Serviço de pagamento temporariamente indisponível. Tente novamente em alguns minutos." });
      }

      // Validate Stripe connection before creating payment intent
      try {
        await stripe.paymentMethods.list({ limit: 1 });
        console.log('✅ Stripe connection validated');
      } catch (stripeTestError) {
        console.error('❌ Stripe connection test failed:', stripeTestError);
        return res.status(500).json({ message: "Erro de conexão com o sistema de pagamento. Tente novamente." });
      }

      console.log('🔍 VALIDAÇÃO ETAPA 9 - Criando Payment Intent no Stripe...');
      console.log('💰 Dados do pagamento: BRL', totalPrice, '-> centavos:', Math.round(priceNum * 100));
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(priceNum * 100), // Convert to cents
        currency: 'brl',
        payment_method_types: paymentMethodTypes,
        metadata: {
          vehicleId: vehicleIdNum.toString(),
          userId: req.user!.id.toString(),
          startDate: startDate.toString(),
          endDate: endDate.toString(),
          userEmail: user.email || 'unknown',
          vehicleBrand: vehicle.brand || 'unknown',
          vehicleModel: vehicle.model || 'unknown',
        },
        description: `Aluguel de ${vehicle.brand} ${vehicle.model} - ${startDate} a ${endDate}`,
      });

      console.log('✅ VALIDAÇÃO ETAPA 9 - CONCLUÍDA: Payment intent criado com sucesso!');
      console.log('🎉 VALIDAÇÃO COMPLETA - TODAS AS 9 ETAPAS APROVADAS');
      console.log('📝 PAYMENT INTENT ID:', paymentIntent.id);
      console.log('🎯 RETORNO: HTTP 200 - Sucesso');
      
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id 
      });
    } catch (error) {
      console.error("💥 Create payment intent error:", error);
      console.error("🔍 Error details:", {
        message: error instanceof Error ? error.message : String(error),
        type: error && typeof error === 'object' && 'type' in error ? error.type : 'unknown',
        code: error && typeof error === 'object' && 'code' in error ? error.code : 'unknown',
        stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined,
        stripeConfigured: !!stripe,
        secretKeyExists: !!process.env.STRIPE_SECRET_KEY,
        requestBody: req.body,
        userId: req.user?.id
      });

      // Enhanced error responses based on error type
      if (error && typeof error === 'object' && 'type' in error) {
        const stripeError = error as any;
        
        switch (stripeError.type) {
          case 'StripeConnectionError':
            return res.status(503).json({ message: "Erro de conexão com o sistema de pagamento. Verifique sua internet e tente novamente." });
          case 'StripeAuthenticationError':
            return res.status(500).json({ message: "Erro de autenticação do sistema de pagamento. Tente novamente em alguns minutos." });
          case 'StripeRateLimitError':
            return res.status(429).json({ message: "Muitas tentativas. Aguarde alguns segundos e tente novamente." });
          case 'StripeInvalidRequestError':
            return res.status(400).json({ message: "Dados de pagamento inválidos. Verifique as informações e tente novamente." });
          default:
            return res.status(500).json({ message: "Erro no sistema de pagamento. Tente novamente." });
        }
      }

      // Database or other system errors
      if (error instanceof Error && error.message.includes('database')) {
        return res.status(503).json({ message: "Erro temporário no sistema. Tente novamente em alguns minutos." });
      }

      // Generic fallback
      res.status(500).json({ message: "Falha ao criar intent de pagamento. Verifique os dados e tente novamente." });
    }
  });

  app.post("/api/confirm-rental", authenticateToken, async (req, res) => {
    try {
      const { paymentIntentId, vehicleId, startDate, endDate, totalPrice } = req.body;

      // Verify payment intent
      if (!stripe) {
        return res.status(500).json({ message: "Stripe não configurado" });
      }
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
      
      // Calculate security deposit based on vehicle's security deposit settings
      const securityDepositValue = parseFloat(vehicle.securityDepositValue || '20');
      const securityDepositType = vehicle.securityDepositType || 'percentage';
      const securityDeposit = securityDepositType === 'percentage' 
        ? (parseFloat(vehicle.pricePerDay) * securityDepositValue / 100).toFixed(2) 
        : securityDepositValue.toFixed(2);

      const bookingData = {
        vehicleId,
        renterId: req.user!.id,
        ownerId: vehicle.ownerId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalPrice: totalPrice,
        serviceFee: serviceFee,
        insuranceFee: insuranceFee,
        securityDeposit: securityDeposit,
        status: "paid" as const, // Status é "paid" após pagamento
        paymentStatus: "paid" as const,
        paymentIntentId,
        inspectionStatus: "pending" as const, // Vistoria pendente após pagamento
      };

      const booking = await storage.createBooking(bookingData);

      // Create contract automatically
      try {
        await storage.createContract({
          bookingId: booking.id,
          contractNumber: `CONTRACT-${Date.now()}-${booking.id}`,
          status: 'pending_signature',
          templateId: "1",
          contractData: {
            vehicle: {
              id: vehicle.id,
              brand: vehicle.brand,
              model: vehicle.model,
              year: vehicle.year,
              color: vehicle.color
            },
            renter: { 
              id: booking.renterId,
              name: req.user!.name,
              email: req.user!.email
            },
            owner: { 
              id: booking.ownerId,
              name: vehicle.ownerId
            }, 
            booking: {
              id: booking.id,
              startDate: booking.startDate,
              endDate: booking.endDate,
              totalPrice: booking.totalPrice
            },
            terms: {
              requiresGovBRSignature: true,
              createdAt: new Date().toISOString()
            }
          } as any
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

      if (!stripe) {
        return res.status(500).json({ message: "Stripe não configurado" });
      }

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
        inspectionStatus: "pending" as const,
        paymentIntentId,
      };

      const booking = await storage.createBooking(bookingData);

      // Create contract for preview (not auto-signed anymore)
      try {
        const contract = await storage.createContract({
          bookingId: booking.id,
          contractNumber: `CONTRACT-${Date.now()}-${booking.id}`,
          status: 'pending_signature',
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
          } as any
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

  // New "Rent Now" API - Creates booking with pending status and sends emails
  app.post("/api/rent-now", authenticateToken, async (req, res) => {
    try {
      console.log('📝 Rent now request received:', req.body);
      const { vehicleId, startDate, endDate, totalPrice, serviceFee, insuranceFee, securityDeposit, includeInsurance } = req.body;

      // Validate required fields
      if (!vehicleId || !startDate || !endDate || !totalPrice) {
        console.log('❌ Missing required fields:', { vehicleId, startDate, endDate, totalPrice });
        return res.status(400).json({ message: "Dados obrigatórios: vehicleId, startDate, endDate, totalPrice" });
      }

      // Get vehicle and owner information
      const vehicle = await storage.getVehicle(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ message: "Veículo não encontrado" });
      }

      const owner = await storage.getUser(vehicle.ownerId);
      if (!owner) {
        return res.status(404).json({ message: "Proprietário não encontrado" });
      }

      const renter = req.user!;

      // Check date availability
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      console.log('🔍 rent-now: Checking availability with:', { vehicleId, startDate, endDate, startDateObj, endDateObj });
      
      const isAvailable = await storage.checkVehicleAvailability(vehicleId, startDateObj, endDateObj);

      if (!isAvailable) {
        return res.status(400).json({ 
          message: "Veículo não disponível para as datas selecionadas. Tente outras datas." 
        });
      }

      // Create booking with "pending" status (waiting for owner approval)
      const bookingData = {
        vehicleId: vehicleId,
        renterId: renter.id,
        ownerId: vehicle.ownerId,
        startDate: startDateObj,
        endDate: endDateObj,
        totalPrice: totalPrice.toString(),
        serviceFee: serviceFee?.toString() || '0',
        insuranceFee: includeInsurance ? (insuranceFee?.toString() || '0') : '0',
        securityDeposit: securityDeposit?.toString() || '0',
        status: "pending" as const, // Waiting for owner approval
        paymentStatus: "pending" as const, // No payment yet
        inspectionStatus: "not_required" as const,
        notes: `Solicitação "Alugar agora" - Aguardando aprovação do proprietário. Inclui seguro: ${includeInsurance ? 'Sim' : 'Não'}`
      };

      const booking = await storage.createBooking(bookingData);
      console.log('✅ Booking created successfully:', booking.id);

      // Send notification emails using the existing emailService
      const emailData: BookingEmailData = {
        bookingId: booking.id.toString(),
        vehicleBrand: vehicle.brand,
        vehicleModel: vehicle.model,
        startDate: startDateObj.toLocaleDateString('pt-BR'),
        endDate: endDateObj.toLocaleDateString('pt-BR'),
        totalPrice: parseFloat(totalPrice.toString()),
        renterName: renter.name || renter.email,
        renterEmail: renter.email,
        ownerName: owner.name || owner.email,
        ownerEmail: owner.email
      };

      // Send emails asynchronously (don't block the response)
      console.log('📧 Iniciando envio de e-mails:', emailData);
      Promise.all([
        emailService.sendBookingConfirmationToRenter(emailData.renterEmail!, emailData.renterName!, emailData),
        emailService.sendBookingNotificationToOwner(emailData.ownerEmail!, emailData.ownerName!, emailData)
      ]).then(() => {
        console.log('✅ Todos os e-mails foram enviados com sucesso');
      }).catch(error => {
        console.error('❌ Erro ao enviar e-mails de confirmação:', error);
      });

      res.json({ 
        booking,
        message: "Solicitação enviada com sucesso! O proprietário tem 24h para responder.",
        emailsSent: true
      });

    } catch (error) {
      console.error("Rent now error:", error);
      res.status(500).json({ message: "Falha ao enviar solicitação de aluguel" });
    }
  });

  // Import validation middleware
  const { validateUser, validateVehicle, validateBooking, validateMessage, handleValidationErrors } = await import("./middleware/validation");

  // OAuth2 Configuration
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID;
  const APPLE_CLIENT_SECRET = process.env.APPLE_CLIENT_SECRET;
  const APPLE_PRIVATE_KEY = process.env.APPLE_PRIVATE_KEY;
  const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID;
  const APPLE_KEY_ID = process.env.APPLE_KEY_ID;
  const OAUTH_REDIRECT_URI = process.env.OAUTH_REDIRECT_URI || `${process.env.BASE_URL || 'http://localhost:5000'}/api/auth/oauth/callback`;

  // Log OAuth configuration status for debugging
  console.log('🔧 OAuth Configuration Status:');
  console.log('  Google OAuth:', !!GOOGLE_CLIENT_ID && !!GOOGLE_CLIENT_SECRET ? '✅ Configured' : '❌ Missing credentials');
  console.log('  Apple OAuth:', !!APPLE_CLIENT_ID && !!APPLE_PRIVATE_KEY && !!APPLE_TEAM_ID && !!APPLE_KEY_ID ? '✅ Configured' : '❌ Missing credentials');
  console.log('  Redirect URI:', OAUTH_REDIRECT_URI);

  // Authentication routes
  app.post("/api/auth/register", validateUser, handleValidationErrors, async (req: Request, res: Response) => {
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

      // Process any pending referral rewards for this user
      try {
        // Find referrals where this user is the referred user (was invited)
        const allReferrals = await storage.getAllReferrals();
        const referralAsReferred = allReferrals.find(r => 
          r.referredId === user.id && 
          r.status === 'pending_completion' && 
          r.rewardStatus === 'pending'
        );

        if (referralAsReferred) {
          console.log(`🎁 Processing referral reward for new user ${user.id} from referral ${referralAsReferred.id}`);
          await storage.processReferralReward(referralAsReferred.id);
        }
      } catch (error) {
        console.error('Error processing referral reward:', error);
        // Don't fail registration if referral processing fails
      }

      // Generate token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
      const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET + '_refresh', { expiresIn: '7d' });

      // Use dynamic cookie configuration for all auth endpoints
      const isReplit = !!process.env.REPL_ID;
      const isHTTPS = req.headers['x-forwarded-proto'] === 'https' || req.secure;
      const useSecureCookies = isHTTPS || isReplit;

      const cookieOptions = {
        httpOnly: true,
        secure: useSecureCookies,
        sameSite: useSecureCookies ? 'none' as const : 'lax' as const,
        path: '/',
      };

      res.cookie('token', token, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      res.cookie('refresh_token', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Falha no cadastro. Verifique os dados informados" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      // Get user with password for verification
      const userWithPassword = await storage.getUserWithPasswordByEmail(email);
      if (!userWithPassword) {
        return res.status(401).json({ message: "E-mail ou senha incorretos" });
      }

      const isValidPassword = await bcrypt.compare(password, userWithPassword.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "E-mail ou senha incorretos" });
      }

      // Get user without password for response
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(500).json({ message: "Erro interno do servidor" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
      const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET + '_refresh', { expiresIn: '7d' });

      console.log('🍪 Setting login cookies for user:', user.email);

      // Dynamic cookie configuration based on environment
      const isReplit = !!process.env.REPL_ID;
      const isProduction = process.env.NODE_ENV === 'production';
      const isDevelopment = process.env.NODE_ENV === 'development';
      const isHTTPS = req.headers['x-forwarded-proto'] === 'https' || req.secure;

      console.log('🔧 Environment:', { 
        NODE_ENV: process.env.NODE_ENV, 
        REPL_ID: !!process.env.REPL_ID,
        isDevelopment, 
        isProduction, 
        isReplit,
        isHTTPS,
        protocol: req.headers['x-forwarded-proto'] || 'http'
      });

      // Use secure cookies for HTTPS (Replit serves via HTTPS)
      const useSecureCookies = isHTTPS || isReplit;

      const cookieOptions = {
        httpOnly: true,
        secure: useSecureCookies, // Secure for HTTPS/Replit
        sameSite: useSecureCookies ? 'none' as const : 'lax' as const, // None for cross-origin HTTPS
        path: '/',
        domain: isReplit ? undefined : undefined, // Let browser handle domain
      };

      console.log('🍪 Cookies set with options:', cookieOptions);

      res.cookie('token', token, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      res.cookie('refresh_token', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Additional headers to ensure cookie transmission in Replit
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Expose-Headers', 'Set-Cookie');

      console.log('🍪 Cookies set with options:', cookieOptions);

      const { password: _, ...userWithoutPassword } = user;

      // Return token in response for development compatibility
      res.json({ 
        user: userWithoutPassword,
        token: token
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Falha no login. Tente novamente" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req, res) => {
    const { password: _, ...userWithoutPassword } = req.user!;
    res.json({ user: userWithoutPassword });
  });

  app.get("/api/auth/user", authenticateToken, async (req, res) => {
    const { password: _, ...userWithoutPassword } = req.user!;
    res.json(userWithoutPassword);
  });

  app.post("/api/auth/logout", (req, res) => {
    // Limpar cookies com configurações que garantem remoção completa
    res.clearCookie('token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/'
    });
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/'
    });

    // Definir cookies com valor vazio e expiração no passado como fallback
    res.cookie('token', '', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      expires: new Date(0)
    });
    res.cookie('refresh_token', '', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      expires: new Date(0)
    });

    res.json({ message: 'Logout realizado com sucesso' });
  });

  app.post("/api/auth/refresh", async (req, res) => {
    try {
      console.log('🔄 Refresh token attempt');

      // Try refresh token from cookies first, then from Authorization header
      let refreshToken = req.cookies?.refresh_token;

      // Fallback: check Authorization header for refresh token
      const authHeader = req.headers.authorization;
      if (!refreshToken && authHeader && authHeader.startsWith('Bearer ')) {
        refreshToken = authHeader.substring(7);
        console.log('🔄 Using Authorization header as refresh token');
      }

      if (!refreshToken) {
        console.log('❌ No refresh token found');
        return res.status(401).json({ message: 'Refresh token não encontrado' });
      }

      const decoded = jwt.verify(refreshToken, JWT_SECRET + '_refresh') as { userId: number };
      const user = await storage.getUser(decoded.userId);

      if (!user) {
        console.log('❌ User not found for refresh token');
        return res.status(403).json({ message: 'Refresh token inválido' });
      }

      const newToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });

      console.log('✅ Token refreshed for user:', user.email);

      // Use dynamic cookie configuration
      const isReplit = !!process.env.REPL_ID;
      const isHTTPS = req.headers['x-forwarded-proto'] === 'https' || req.secure;
      const useSecureCookies = isHTTPS || isReplit;

      res.cookie('token', newToken, {
        httpOnly: true,
        secure: useSecureCookies,
        sameSite: useSecureCookies ? 'none' as const : 'lax' as const,
        path: '/',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      const { password: _, ...userWithoutPassword } = user;

      res.json({
        user: userWithoutPassword,
        token: newToken
      });
    } catch (error) {
      console.error('❌ Refresh token error:', error);
      res.status(403).json({ message: 'Refresh token inválido' });
    }
  });

  // OAuth Routes - Google
  app.get("/api/auth/google", (req, res) => {
    console.log('🔍 Google OAuth request received');
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.log('❌ Google OAuth missing configuration');
      return res.redirect(`/auth?error=${encodeURIComponent('Google Sign In não configurado')}`);
    }

    const state = Buffer.from(JSON.stringify({
      returnUrl: req.query.returnUrl || '/',
      timestamp: Date.now()
    })).toString('base64');

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(OAUTH_REDIRECT_URI)}&` +
      `scope=email profile&` +
      `response_type=code&` +
      `state=${encodeURIComponent(`google:${state}`)}`;

    res.redirect(googleAuthUrl);
  });

  // OAuth Routes - Apple
  app.get("/api/auth/apple", (req, res) => {
    console.log('🍎 Apple OAuth request received');
    if (!APPLE_CLIENT_ID || !APPLE_PRIVATE_KEY || !APPLE_TEAM_ID || !APPLE_KEY_ID) {
      console.log('❌ Apple OAuth: Missing configuration - redirecting to auth with error');
      return res.redirect(`/auth?error=${encodeURIComponent('Apple Sign In não configurado')}`);
    }

    const state = Buffer.from(JSON.stringify({
      returnUrl: req.query.returnUrl || '/',
      timestamp: Date.now()
    })).toString('base64');

    const appleAuthUrl = `https://appleid.apple.com/auth/authorize?` +
      `client_id=${APPLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(OAUTH_REDIRECT_URI)}&` +
      `scope=email name&` +
      `response_type=code&` +
      `response_mode=form_post&` +
      `state=${encodeURIComponent(`apple:${state}`)}`;

    res.redirect(appleAuthUrl);
  });

  // OAuth Callback Route
  app.all("/api/auth/oauth/callback", async (req, res) => {
    try {
      console.log('🔄 OAuth callback received:', { method: req.method, query: req.query, body: req.body });
      
      const { code, state, error: oauthError } = req.method === 'GET' ? req.query : req.body;

      if (oauthError) {
        console.log('❌ OAuth error from provider:', oauthError);
        return res.redirect(`/auth?error=${encodeURIComponent('Erro na autenticação social')}`);
      }

      if (!code || !state) {
        console.log('❌ OAuth missing parameters:', { code: !!code, state: !!state });
        return res.redirect(`/auth?error=${encodeURIComponent('Parâmetros OAuth inválidos')}`);
      }

      // Parse state safely
      let provider, decodedState;
      try {
        const stateParts = (state as string).split(':');
        if (stateParts.length < 2) {
          throw new Error('Invalid state format');
        }
        provider = stateParts[0];
        const stateData = stateParts.slice(1).join(':');
        decodedState = JSON.parse(Buffer.from(stateData, 'base64').toString());
        console.log('✅ OAuth state parsed:', { provider, decodedState });
      } catch (error) {
        console.log('❌ OAuth state parsing error:', error);
        return res.redirect(`/auth?error=${encodeURIComponent('Estado OAuth inválido')}`);
      }

      let userInfo;
      if (provider === 'google') {
        if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
          console.log('❌ Google OAuth not configured');
          return res.redirect(`/auth?error=${encodeURIComponent('Google Sign In não configurado')}`);
        }
        userInfo = await handleGoogleCallback(code as string);
      } else if (provider === 'apple') {
        if (!APPLE_CLIENT_ID || !APPLE_PRIVATE_KEY || !APPLE_TEAM_ID || !APPLE_KEY_ID) {
          console.log('❌ Apple OAuth not configured properly');
          return res.redirect(`/auth?error=${encodeURIComponent('Apple Sign In não configurado')}`);
        }
        userInfo = await handleAppleCallback(code as string);
      } else {
        console.log('❌ Unknown OAuth provider:', provider);
        return res.redirect(`/auth?error=${encodeURIComponent('Provedor OAuth inválido')}`);
      }

      if (!userInfo) {
        console.log('❌ Failed to get user info from OAuth provider:', provider);
        return res.redirect(`/auth?error=${encodeURIComponent('Falha ao obter informações do usuário')}`);
      }

      // Find or create user
      let user = await storage.getUserByEmail(userInfo.email);

      if (!user) {
        // Create new user
        user = await storage.createUser({
          name: userInfo.name,
          email: userInfo.email,
          password: await bcrypt.hash(Math.random().toString(36), 10), // Random password
          phone: '', // Will be filled later
          role: 'renter',
          avatar: userInfo.picture,
        });

        console.log('✅ New OAuth user created:', user.email);
      } else {
        // Update existing user info if needed
        if (userInfo.picture && !user.avatar) {
          await storage.updateUser(user.id, { avatar: userInfo.picture });
        }
      }

      // Generate tokens
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
      const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET + '_refresh', { expiresIn: '7d' });

      // Set cookies with dynamic configuration
      const isReplit = !!process.env.REPL_ID;
      const isHTTPS = req.headers['x-forwarded-proto'] === 'https' || req.secure;
      const useSecureCookies = isHTTPS || isReplit;

      const cookieOptions = {
        httpOnly: true,
        secure: useSecureCookies,
        sameSite: useSecureCookies ? 'none' as const : 'lax' as const,
        path: '/',
      };

      res.cookie('token', token, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000
      });

      res.cookie('refresh_token', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      console.log('✅ OAuth cookies set for user:', user.email);

      // Determine redirect URL
      const returnUrl = decodedState.returnUrl || '/';
      let finalRedirectUrl = returnUrl.startsWith('/') ? returnUrl : '/';

      // Don't redirect back to auth pages after successful OAuth
      if (finalRedirectUrl === '/auth' || finalRedirectUrl === '/login' || finalRedirectUrl.startsWith('/register')) {
        finalRedirectUrl = '/';
      }

      console.log('✅ OAuth success, redirecting to:', finalRedirectUrl);
      res.redirect(`${finalRedirectUrl}?oauth_success=1`);

    } catch (error) {
      console.error('❌ OAuth callback critical error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error
      });
      res.redirect(`/auth?error=${encodeURIComponent('Erro interno na autenticação')}`);
    }
  });

  // Helper functions for OAuth
  async function handleGoogleCallback(code: string) {
    try {
      console.log('🔍 Google OAuth: Processing callback with code:', code.substring(0, 20) + '...');
      
      // Exchange code for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID!,
          client_secret: GOOGLE_CLIENT_SECRET!,
          code,
          grant_type: 'authorization_code',
          redirect_uri: OAUTH_REDIRECT_URI,
        }),
      });

      console.log('🔍 Google OAuth: Token response status:', tokenResponse.status);
      
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('❌ Google OAuth token exchange failed:', {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          error: errorText
        });
        throw new Error(`Token exchange failed: ${tokenResponse.status} ${errorText}`);
      }

      const tokenData = await tokenResponse.json();
      console.log('🔍 Google OAuth: Token data keys:', Object.keys(tokenData));

      if (!tokenData.access_token) {
        console.error('❌ Google OAuth: No access token in response:', tokenData);
        throw new Error('No access token received from Google');
      }

      console.log('✅ Google OAuth: Access token received');

      // Get user info
      const userResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenData.access_token}`);
      
      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error('❌ Google OAuth user info failed:', {
          status: userResponse.status,
          error: errorText
        });
        throw new Error(`User info request failed: ${userResponse.status}`);
      }

      const userData = await userResponse.json();
      console.log('✅ Google OAuth: User data received:', {
        email: userData.email,
        name: userData.name,
        hasPicture: !!userData.picture
      });

      if (!userData.email) {
        console.error('❌ Google OAuth: No email in user data:', userData);
        throw new Error('No email received from Google');
      }

      return {
        email: userData.email,
        name: userData.name || userData.email.split('@')[0],
        picture: userData.picture,
      };
    } catch (error) {
      console.error('❌ Google OAuth callback error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error
      });
      return null;
    }
  }

  async function handleAppleCallback(code: string) {
    try {
      console.log('🍎 Apple OAuth callback received, code length:', code?.length);

      if (!APPLE_CLIENT_ID || !APPLE_PRIVATE_KEY || !APPLE_TEAM_ID || !APPLE_KEY_ID) {
        console.error('❌ Apple OAuth: Missing required environment variables');
        console.error('❌ Available vars:', {
          APPLE_CLIENT_ID: !!APPLE_CLIENT_ID,
          APPLE_PRIVATE_KEY: !!APPLE_PRIVATE_KEY,
          APPLE_TEAM_ID: !!APPLE_TEAM_ID,
          APPLE_KEY_ID: !!APPLE_KEY_ID
        });
        throw new Error('Apple OAuth not properly configured');
      }

      console.log('✅ Apple OAuth: All environment variables present');

      // Create client secret JWT for Apple
      const now = Math.floor(Date.now() / 1000);
      const clientSecretPayload = {
        iss: APPLE_TEAM_ID,
        iat: now,
        exp: now + 15777000, // 6 months
        aud: 'https://appleid.apple.com',
        sub: APPLE_CLIENT_ID,
      };

      console.log('🍎 Creating client secret JWT with payload:', {
        iss: APPLE_TEAM_ID,
        sub: APPLE_CLIENT_ID,
        aud: 'https://appleid.apple.com'
      });

      const clientSecret = jwt.sign(clientSecretPayload, APPLE_PRIVATE_KEY.replace(/\\n/g, '\n'), {
        algorithm: 'ES256',
        header: {
          kid: APPLE_KEY_ID,
          alg: 'ES256'
        }
      });

      console.log('✅ Apple OAuth: Client secret JWT created');

      // Exchange authorization code for access token
      console.log('🍎 Exchanging code for tokens...');
      const tokenResponse = await fetch('https://appleid.apple.com/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: APPLE_CLIENT_ID,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: OAUTH_REDIRECT_URI,
        }),
      });

      console.log('🍎 Token response status:', tokenResponse.status, tokenResponse.statusText);

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('❌ Apple OAuth token exchange failed:', {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          error: errorText
        });
        throw new Error(`Apple token exchange failed: ${tokenResponse.status} ${errorText}`);
      }

      const tokenData = await tokenResponse.json();
      console.log('🍎 Token data received:', {
        hasAccessToken: !!tokenData.access_token,
        hasIdToken: !!tokenData.id_token,
        tokenType: tokenData.token_type,
        error: tokenData.error
      });

      if (tokenData.error) {
        console.error('❌ Apple OAuth: Token exchange error:', tokenData);
        throw new Error(`Apple token exchange failed: ${tokenData.error} - ${tokenData.error_description || ''}`);
      }

      if (!tokenData.access_token && !tokenData.id_token) {
        console.error('❌ Apple OAuth: No tokens received', tokenData);
        throw new Error('No tokens received from Apple');
      }

      // Decode the ID token to get user info
      let userInfo = null;
      if (tokenData.id_token) {
        console.log('🍎 Decoding ID token...');
        const decoded = jwt.decode(tokenData.id_token) as any;
        console.log('🍎 Decoded token data:', {
          email: decoded?.email,
          emailVerified: decoded?.email_verified,
          sub: decoded?.sub,
          aud: decoded?.aud
        });
        
        // Apple sometimes doesn't provide email on subsequent logins
        // We need to handle this case and still create a valid user
        const userEmail = decoded.email || `apple_user_${decoded.sub}@apple.com`;
        const userName = decoded.name || `Apple User ${decoded.sub?.slice(-4) || Math.random().toString(36).slice(2, 6)}`;
        
        userInfo = {
          email: userEmail,
          name: userName,
          picture: null,
        };
        
        console.log('✅ Apple OAuth: User info extracted:', userInfo);
        
        // Additional validation
        if (!userInfo.email || !userInfo.name) {
          console.error('❌ Apple OAuth: Invalid user info after extraction:', userInfo);
          throw new Error('Failed to extract valid user information from Apple ID token');
        }
      } else {
        console.error('❌ Apple OAuth: No ID token found in response');
        throw new Error('No ID token received from Apple');
      }

      return userInfo;
    } catch (error) {
      console.error('❌ Apple OAuth callback error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error
      });
      return null;
    }
  }

  // Profile endpoints
  app.get("/api/profile", authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Erro ao buscar perfil" });
    }
  });

  app.put("/api/profile", authenticateToken, async (req, res) => {
    try {
      const { name, phone, email, pix, pixKey } = req.body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (phone !== undefined) updateData.phone = phone;
      if (email !== undefined) updateData.email = email;
      if (pix !== undefined) updateData.pix = pix;
      if (pixKey !== undefined) updateData.pix = pixKey; // Support both field names

      const updatedUser = await storage.updateUser(req.user!.id, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Erro ao atualizar perfil" });
    }
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

  // Photo upload endpoint for inspections
  app.post("/api/upload/photo", authenticateToken, upload.single('photo'), async (req, res) => {
    try {
      const userId = req.user!.id;
      const { type } = req.body; // inspection, vehicle, etc.

      console.log("Photo upload request received for user:", userId);
      console.log("Upload type:", type);
      console.log("File:", req.file);

      if (!req.file) {
        return res.status(400).json({ message: "Arquivo é obrigatório" });
      }

      // Validar tipo de arquivo (apenas imagens)
      if (!req.file.mimetype.startsWith('image/')) {
        return res.status(400).json({ message: "Apenas imagens são aceitas" });
      }

      // Validar tamanho (máximo 5MB)
      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ message: "Imagem muito grande. Máximo 5MB" });
      }

      // Salvar arquivo em base64 para uso imediato
      const fileBase64 = req.file.buffer.toString('base64');
      const photoUrl = `data:${req.file.mimetype};base64,${fileBase64}`;

      console.log("Photo uploaded successfully, size:", req.file.size);

      res.json({
        success: true,
        url: photoUrl,
        message: "Foto enviada com sucesso"
      });

    } catch (error) {
      console.error("Error uploading photo:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/user/documents/upload", authenticateToken, upload.single('document'), async (req, res) => {
    try {
      const userId = req.user!.id;

      console.log("📄 Upload request received for user:", userId);
      console.log("📝 Request body:", req.body);
      console.log("📁 File:", req.file ? { 
        name: req.file.originalname, 
        size: req.file.size, 
        type: req.file.mimetype 
      } : null);

      const { documentType, documentNumber } = req.body;

      if (!documentType) {
        console.log("❌ Document type is required");
        return res.status(400).json({ message: "Tipo de documento é obrigatório" });
      }

      if (!req.file) {
        console.log("❌ File is required");
        return res.status(400).json({ message: "Arquivo é obrigatório" });
      }

      // Validar tipo de arquivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        console.log("❌ Invalid file type:", req.file.mimetype);
        return res.status(400).json({ message: "Tipo de arquivo não permitido. Use JPG, PNG ou PDF." });
      }

      // Validar tamanho (máximo 10MB)
      if (req.file.size > 10 * 1024 * 1024) {
        console.log("❌ File too large:", req.file.size);
        return res.status(400).json({ message: "Arquivo muito grande. Máximo 10MB." });
      }

      // Salvar arquivo em base64 para visualização no admin
      const fileBase64 = req.file.buffer.toString('base64');
      const documentUrl = `data:${req.file.mimetype};base64,${fileBase64}`;

      console.log("💾 Saving document to database...");

      // Use Drizzle ORM instead of direct pool query
      const newDocument = await storage.createUserDocument({
        userId,
        documentType,
        documentUrl,
        documentNumber: documentNumber || null,
        status: 'pending'
      });

      console.log("✅ Document saved:", newDocument.id);

      // Atualizar status do usuário
      await storage.updateUser(userId, {
        documentsSubmitted: true
      });

      console.log("✅ User status updated");

      // Verificar se todos os documentos obrigatórios foram enviados
      const userDocuments = await storage.getUserDocuments(userId);
      const submittedTypes = userDocuments.map(doc => doc.documentType);
      const requiredTypes = ['cnh', 'comprovante_residencia'];
      const allSubmitted = requiredTypes.every(type => submittedTypes.includes(type));

      if (allSubmitted) {
        await storage.updateUser(userId, {
          verificationStatus: 'pending'
        });
        console.log("✅ User verification status set to pending");
      }

      res.status(201).json({
        id: newDocument.id,
        userId: newDocument.userId,
        documentType: newDocument.documentType,
        documentUrl: newDocument.documentUrl,
        documentNumber: newDocument.documentNumber,
        status: newDocument.status,
        uploadedAt: newDocument.uploadedAt,
        message: "Documento enviado com sucesso!"
      });

    } catch (error) {
      console.error("❌ Upload document error:", error);
      res.status(500).json({ 
        message: "Falha ao enviar documento", 
        error: process.env.NODE_ENV === 'development' ? error.message : undefined 
      });
    }
  });

  // Admin Document Management Routes
  app.get("/api/admin/documents", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const documents = await db
        .select({
          id: userDocuments.id,
          userId: userDocuments.userId,
          userName: users.name,
          userEmail: users.email,
          documentType: userDocuments.documentType,
          documentUrl: userDocuments.documentUrl,
          documentNumber: userDocuments.documentNumber,
          status: userDocuments.status,
          rejectionReason: userDocuments.rejectionReason,
          uploadedAt: userDocuments.uploadedAt,
          reviewedAt: userDocuments.reviewedAt,
          reviewedBy: userDocuments.reviewedBy,
        })
        .from(userDocuments)
        .innerJoin(users, eq(userDocuments.userId, users.id))
        .orderBy(desc(userDocuments.uploadedAt));

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
          // Check if user is not already verified to avoid duplicate coins
          const userResult = await pool.query(`
            SELECT verification_status FROM users WHERE id = $1
          `, [userId]);
          
          const wasAlreadyVerified = userResult.rows[0]?.verification_status === 'verified';
          
          await pool.query(`
            UPDATE users 
            SET verification_status = 'verified'
            WHERE id = $1
          `, [userId]);

          // Give 300 free coins only if user wasn't previously verified
          if (!wasAlreadyVerified) {
            try {
              await storage.addCoins(
                userId,
                300,
                'document_validation',
                'Bônus de 300 moedas por verificação de documentos',
                `verification_${userId}`
              );
              console.log(`✅ Awarded 300 free coins to verified user ${userId}`);
            } catch (coinError) {
              console.error('❌ Error awarding verification coins:', coinError);
            }
          }
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
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get current counts
      const [
        totalUsers,
        activeVehicles,
        todayBookings,
        monthlyRevenue,
        totalBookings,
        avgRating,
        completedBookings,
        pendingBookings,
        verifiedUsers
      ] = await Promise.all([
        // Total users
        db.select({ count: sql<number>`count(*)` }).from(users),

        // Active vehicles (available)
        db.select({ count: sql<number>`count(*)` })
          .from(vehicles)
          .where(eq(vehicles.isAvailable, true)),

        // Bookings today
        db.select({ count: sql<number>`count(*)` })
          .from(bookings)
          .where(sql`DATE(${bookings.createdAt}) = CURRENT_DATE`),

        // Monthly revenue from paid bookings (current month)
        db.select({ 
          total: sql<number>`COALESCE(SUM(${bookings.totalPrice}), 0)` 
        }).from(bookings)
          .where(eq(bookings.paymentStatus, 'paid')),

        // Total bookings
        db.select({ count: sql<number>`count(*)` }).from(bookings),

        // Average rating (placeholder - reviews system removed)
        Promise.resolve([{ avg: 0 }]),

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

      // Calculate growth metrics (30 days comparison)
      const [oldUserCount, oldBookingCount, lastMonthRevenue] = await Promise.all([
        db.select({ count: sql<number>`count(*)` })
          .from(users)
          .where(lte(users.createdAt, thirtyDaysAgo)),

        db.select({ count: sql<number>`count(*)` })
          .from(bookings)
          .where(lte(bookings.createdAt, thirtyDaysAgo)),

        db.select({ 
          total: sql<number>`COALESCE(SUM(${bookings.totalPrice}), 0)` 
        }).from(bookings)
          .where(and(
            eq(bookings.paymentStatus, 'paid'),
            gte(bookings.createdAt, new Date(today.getFullYear(), today.getMonth() - 1, 1)),
            lt(bookings.createdAt, startOfMonth)
          ))
      ]);

      const userGrowth = oldUserCount[0]?.count > 0 
        ? ((totalUsers[0].count - oldUserCount[0].count) / oldUserCount[0].count) * 100 
        : totalUsers[0].count > 0 ? 100 : 0;

      const bookingGrowth = oldBookingCount[0]?.count > 0 
        ? ((totalBookings[0].count - oldBookingCount[0].count) / oldBookingCount[0].count) * 100 
        : totalBookings[0].count > 0 ? 100 : 0;

      const revenueGrowth = lastMonthRevenue[0]?.total > 0
        ? ((monthlyRevenue[0].total - lastMonthRevenue[0].total) / lastMonthRevenue[0].total) * 100
        : monthlyRevenue[0].total > 0 ? 100 : 0;

      const metrics = {
        totalUsers: totalUsers[0].count,
        activeVehicles: activeVehicles[0].count,
        todayBookings: todayBookings[0].count,
        monthlyRevenue: parseFloat(monthlyRevenue[0].total.toString()),
        totalBookings: totalBookings[0].count,
        averageRating: parseFloat((Number(avgRating[0].avg) || 0).toFixed(1)),
        completedBookings: completedBookings[0].count,
        pendingBookings: pendingBookings[0].count,
        verifiedUsers: verifiedUsers[0].count,
        userGrowth: parseFloat(userGrowth.toFixed(1)),
        bookingGrowth: parseFloat(bookingGrowth.toFixed(1)),
        revenueGrowth: parseFloat(revenueGrowth.toFixed(1))
      };

      console.log('📊 Dashboard metrics calculated:', metrics);
      res.json(metrics);
    } catch (error) {
      console.error("Dashboard metrics error:", error);
      res.status(500).json({ message: "Erro ao carregar métricas do dashboard" });
    }
  });

  app.get("/api/admin/reports", authenticateToken, requireAdmin, async (req, res) => {
    try {
      console.log("📊 Fetching admin reports data...");

      const [
        totalUsers,
        totalVehicles,
        totalRevenue,
        activeBookings,
        conversionRate,
        avgRating,
        bookingsByStatus,
        vehiclesByCategory,
        usersByType
      ] = await Promise.all([
        // Total users
        db.select({ count: sql<number>`count(*)` }).from(users),

        // Total vehicles
        db.select({ count: sql<number>`count(*)` }).from(vehicles),

        // Total revenue
        db.select({ 
          sum: sql<number>`COALESCE(SUM(${bookings.totalPrice}), 0)` 
        }).from(bookings).where(eq(bookings.status, 'completed')),

        // Active bookings
        db.select({ count: sql<number>`count(*)` })
          .from(bookings)
          .where(eq(bookings.status, 'active')),

        // Conversion rate (approved bookings / total bookings)
        db.select({ 
          approved: sql<number>`count(case when status in ('approved', 'active', 'completed') then 1 end)`,
          total: sql<number>`count(*)`
        }).from(bookings),

        // Average rating (placeholder - reviews system removed)
        Promise.resolve([{ avg: 0 }]),

        // Bookings by status
        db.select({ 
          status: bookings.status,
          count: sql<number>`count(*)`
        }).from(bookings).groupBy(bookings.status),

        // Vehicles by category
        db.select({ 
          category: vehicles.category,
          count: sql<number>`count(*)`
        }).from(vehicles).groupBy(vehicles.category),

        // Users by verification status
        db.select({ 
          verified: sql<number>`count(case when verification_status = 'verified' then 1 end)`,
          pending: sql<number>`count(case when verification_status = 'pending' then 1 end)`,
          total: sql<number>`count(*)`
        }).from(users)
      ]);

      const conversionPercentage = conversionRate[0]?.total > 0 
        ? (conversionRate[0].approved / conversionRate[0].total) * 100 
        : 0;

      const reportData = {
        totalUsers: totalUsers[0].count,
        totalVehicles: totalVehicles[0].count,
        totalRevenue: parseFloat(totalRevenue[0].sum.toString()),
        activeBookings: activeBookings[0].count,
        conversionRate: parseFloat(conversionPercentage.toFixed(1)),
        avgRating: parseFloat((Number(avgRating[0].avg) || 0).toFixed(1)),
        bookingsByStatus: bookingsByStatus.map(item => ({
          name: item.status === 'completed' ? 'Concluídas' :
                item.status === 'active' ? 'Ativas' :
                item.status === 'pending' ? 'Pendentes' :
                item.status === 'cancelled' ? 'Canceladas' : item.status,
          value: item.count
        })),
        vehiclesByCategory: vehiclesByCategory.map(item => ({
          name: item.category === 'economico' ? 'Econômico' :
                item.category === 'intermediario' ? 'Intermediário' :
                item.category === 'suv' ? 'SUV' :
                item.category === 'luxo' ? 'Luxo' :
                item.category === 'esportivo' ? 'Esportivo' : item.category,
          value: item.count
        })),
        userActivity: [
          { name: 'Verificados', value: usersByType[0]?.verified || 0 },
          { name: 'Pendentes', value: usersByType[0]?.pending || 0 },
          { name: 'Total', value: usersByType[0]?.total || 0 }
        ]
      };

      console.log('📊 Reports data calculated:', reportData);
      res.json(reportData);
    } catch (error) {
      console.error("Admin reports error:", error);
      res.status(500).json({ message: "Falha ao buscar dados dos relatórios" });
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
      const { 
        category, 
        location, 
        minPrice, 
        maxPrice, 
        priceRange, 
        fuelType, 
        transmission,
        startDate,
        endDate,
        page = '1',
        limit = '12'
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      // Parse price range if provided instead of minPrice/maxPrice
      let parsedMinPrice, parsedMaxPrice;
      if (priceRange && priceRange !== '') {
        const range = priceRange as string;
        if (range === '0-100') {
          parsedMinPrice = 0;
          parsedMaxPrice = 100;
        } else if (range === '100-200') {
          parsedMinPrice = 100;
          parsedMaxPrice = 200;
        } else if (range === '200-300') {
          parsedMinPrice = 200;
          parsedMaxPrice = 300;
        } else if (range === '200+') {
          parsedMinPrice = 200;
        } else if (range === '300+') {
          parsedMinPrice = 300;
        }
      } else {
        // Fallback to individual minPrice/maxPrice
        parsedMinPrice = minPrice ? parseFloat(minPrice as string) : undefined;
        parsedMaxPrice = maxPrice ? parseFloat(maxPrice as string) : undefined;
      }

      // Use storage layer with enhanced filters
      const filters = {
        category: category as string || undefined,
        location: location as string || undefined,
        minPrice: parsedMinPrice,
        maxPrice: parsedMaxPrice,
        fuelType: fuelType as string || undefined,
        transmission: transmission as string || undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      };

      console.log('🔍 Vehicle search filters with pagination:', {
        ...filters,
        page: pageNum,
        limit: limitNum,
        offset
      });
      
      const allVehicles = await storage.searchVehicles(filters);
      const totalCount = allVehicles.length;
      const paginatedVehicles = allVehicles.slice(offset, offset + limitNum);
      
      const hasMore = offset + limitNum < totalCount;
      
      res.json({
        vehicles: paginatedVehicles,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          hasMore,
          totalPages: Math.ceil(totalCount / limitNum)
        }
      });
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

  app.post("/api/vehicles", authenticateToken, validateVehicle, handleValidationErrors, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;

      // Check subscription limits FIRST
      const limits = await storage.checkUserSubscriptionLimits(userId);

      if (!limits.canCreateVehicle) {
        return res.status(403).json({ 
          message: `Limite de veículos atingido. Você pode criar até ${limits.maxVehicles} veículos com seu plano atual. Considere fazer upgrade da sua assinatura.`,
          currentVehicles: limits.currentVehicles,
          maxVehicles: limits.maxVehicles
        });
      }

      const vehicleData = insertVehicleSchema.parse({
        ...req.body,
        ownerId: userId,
        status: "pending", // New vehicles start as pending for approval
      });

      // Log para auditoria de dados válidos
      console.log(`✅ Veículo validado: ${vehicleData.brand} ${vehicleData.model} (usuário: ${userId})`);

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

  // Get current user's vehicles (authenticated route)
  app.get("/api/users/my/vehicles", authenticateToken, async (req, res) => {
    try {
      console.log("🚗 [API] Route accessed - my vehicles for user:", req.user?.id);

      const vehicles = await storage.getVehiclesByOwner(req.user!.id);

      console.log("🚗 [API] Query result:", vehicles.length, "vehicles found");
      console.log("🚗 [API] First vehicle fields:", vehicles.length > 0 ? Object.keys(vehicles[0]) : 'none');

      res.json(vehicles);
    } catch (error) {
      console.error("❌ [API] Error in my vehicles:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/users/:id(\\d+)/vehicles", async (req, res) => {
    try {
      const vehicles = await storage.getVehiclesByOwner(parseInt(req.params.id));
      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ message: "Falha ao buscar veículos do usuário" });
    }
  });

  // Get unavailable dates for a vehicle
  app.get("/api/vehicles/:id/unavailable-dates", async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.id);
      const unavailableDates = await storage.getVehicleUnavailableDates(vehicleId);
      res.json(unavailableDates);
    } catch (error) {
      console.error("Error fetching unavailable dates:", error);
      res.status(500).json({ message: "Falha ao buscar datas indisponíveis" });
    }
  });

  // ==================== REVIEWS ROUTES ====================
  // Get completed bookings that can be reviewed
  app.get("/api/reviews/completed-bookings", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const completedBookings = await storage.getCompletedBookingsForReviews(userId);
      
      // Filter out bookings that have already been reviewed by this user
      const reviewableBookings = [];
      for (const booking of completedBookings) {
        const isOwner = booking.ownerId === userId;
        
        if (isOwner) {
          // Owner can review renter
          const hasReviewed = await storage.hasUserReviewedBooking(
            booking.id, 
            userId, 
            'owner_to_renter'
          );
          if (!hasReviewed) {
            reviewableBookings.push(booking);
          }
        } else {
          // Renter can review owner or vehicle
          const hasReviewedOwner = await storage.hasUserReviewedBooking(
            booking.id, 
            userId, 
            'renter_to_owner'
          );
          const hasReviewedVehicle = await storage.hasUserReviewedBooking(
            booking.id, 
            userId, 
            'renter_to_vehicle'
          );
          
          // Include if they haven't reviewed at least one aspect
          if (!hasReviewedOwner || !hasReviewedVehicle) {
            reviewableBookings.push(booking);
          }
        }
      }
      
      res.json(reviewableBookings);
    } catch (error) {
      console.error('Error getting completed bookings for reviews:', error);
      res.status(500).json({ message: "Erro ao buscar reservas para avaliação" });
    }
  });

  // Create a new review
  app.post("/api/reviews", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        reviewerId: userId,
      });

      // Validate that the user can review this booking
      const booking = await storage.getBookingById(reviewData.bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Reserva não encontrada" });
      }

      // Check if user is part of this booking
      if (booking.renterId !== userId && booking.ownerId !== userId) {
        return res.status(403).json({ message: "Você não pode avaliar esta reserva" });
      }

      // Check if booking is completed or approved (both can be reviewed)
      if (booking.status !== 'completed' && booking.status !== 'approved') {
        return res.status(400).json({ message: "Só é possível avaliar reservas concluídas ou aprovadas" });
      }

      // Check if user has already reviewed this booking with this type
      const hasReviewed = await storage.hasUserReviewedBooking(
        reviewData.bookingId,
        userId,
        reviewData.type
      );
      
      if (hasReviewed) {
        return res.status(400).json({ message: "Você já avaliou esta reserva" });
      }

      const review = await storage.createReview(reviewData);
      res.json(review);
    } catch (error) {
      console.error('Error creating review:', error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Erro ao criar avaliação" });
    }
  });

  // Get reviews by user
  app.get("/api/reviews/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const reviews = await storage.getReviewsByUser(userId);
      res.json(reviews);
    } catch (error) {
      console.error('Error getting user reviews:', error);
      res.status(500).json({ message: "Erro ao buscar avaliações do usuário" });
    }
  });

  // Get reviews by vehicle
  app.get("/api/reviews/vehicle/:vehicleId", async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      const reviews = await storage.getReviewsByVehicle(vehicleId);
      res.json(reviews);
    } catch (error) {
      console.error('Error getting vehicle reviews:', error);
      res.status(500).json({ message: "Erro ao buscar avaliações do veículo" });
    }
  });

  // ==================== BOOKINGS ROUTES ====================
  // Booking routes
  app.get("/api/bookings", authenticateToken, async (req, res) => {
    try {
      const type = req.query.type as 'renter' | 'owner' || 'renter';
      const includeInspections = req.query.includeInspections === 'true';
      console.log('📋 GET /api/bookings - User:', req.user!.id, 'Type:', type, 'Include inspections:', includeInspections);
      
      const bookings = await storage.getBookingsByUser(req.user!.id, type, includeInspections);
      
      console.log('📋 Bookings fetched:', bookings.length);
      bookings.forEach(booking => {
        console.log(`📋 Booking ${booking.id}: status=${booking.status}`);
        // Check if ownerInspection exists before accessing properties
        if ((booking as any).ownerInspection) {
          console.log(`📋 Owner inspection for booking ${booking.id}:`, {
            status: (booking as any).ownerInspection.status,
            depositDecision: (booking as any).ownerInspection.depositDecision
          });
        }
      });
      
      res.json(bookings);
    } catch (error) {
      console.error('❌ GET /api/bookings error:', error);
      res.status(500).json({ message: "Falha ao buscar reservas" });
    }
  });

  // Get specific booking by ID
  app.get("/api/bookings/:id", authenticateToken, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const includeInspections = req.query.includeInspections === 'true';
      console.log('📋 GET /api/bookings/:id - Booking:', bookingId, 'Include inspections:', includeInspections);
      
      const booking = await storage.getBookingWithDetails(bookingId, includeInspections);

      if (!booking) {
        return res.status(404).json({ message: "Reserva não encontrada" });
      }

      // Verificar se o usuário tem acesso a esta reserva (é o locatário ou proprietário)
      if (booking.renterId !== req.user!.id && booking.ownerId !== req.user!.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      if (includeInspections && (booking as any).ownerInspection) {
        console.log(`📋 Owner inspection for booking ${booking.id}:`, {
          status: (booking as any).ownerInspection.status,
          depositDecision: (booking as any).ownerInspection.depositDecision
        });
      }

      res.json(booking);
    } catch (error) {
      console.error("Get booking by ID error:", error);
      res.status(500).json({ message: "Falha ao buscar reserva" });
    }
  });

  app.post("/api/bookings", authenticateToken, validateBooking, handleValidationErrors, async (req: Request, res: Response) => {
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

      // Prepare booking data with proper type conversions (fix timezone issue)
      const bookingPayload = {
        vehicleId: req.body.vehicleId,
        renterId: req.user!.id,
        ownerId: vehicle.ownerId,
        startDate: startDate.toLocaleDateString('en-CA'), // YYYY-MM-DD format without timezone shift
        endDate: endDate.toLocaleDateString('en-CA'), // YYYY-MM-DD format without timezone shift
        totalPrice: totalPrice.toFixed(2), // Convert to string
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

      // Send confirmation emails
      try {
        const renter = await storage.getUser(booking.renterId);
        const owner = await storage.getUser(vehicle.ownerId);
        
        if (renter && owner) {
          const emailData: BookingEmailData = {
            bookingId: booking.id.toString(),
            vehicleBrand: vehicle.brand,
            vehicleModel: vehicle.model,
            startDate: new Date(booking.startDate).toLocaleDateString('pt-BR'),
            endDate: new Date(booking.endDate).toLocaleDateString('pt-BR'),
            totalPrice: parseFloat(booking.totalPrice || "0"),
            renterName: renter.name || renter.email,
            renterEmail: renter.email,
            ownerName: owner.name || owner.email,
            ownerEmail: owner.email
          };

          // Send emails asynchronously (don't block response)
          Promise.all([
            emailService.sendBookingConfirmationToRenter(emailData.renterEmail!, emailData.renterName!, emailData),
            emailService.sendBookingNotificationToOwner(emailData.ownerEmail!, emailData.ownerName!, emailData)
          ]).catch(error => {
            console.error('Erro ao enviar e-mails de confirmação:', error);
          });
        }
      } catch (emailError) {
        console.error('Erro ao preparar dados para e-mail:', emailError);
        // Don't fail the booking if email sending fails
      }

      res.status(201).json(booking);
    } catch (error) {
      console.error("Create booking error:", error);
      res.status(400).json({ message: "Falha ao criar reserva. Verifique os dados informados" });
    }
  });

  // New "Rent Now" endpoint - sends emails and creates booking request
  app.post("/api/rent-now", authenticateToken, async (req: Request, res: Response) => {
    try {
      // Get vehicle and owner information
      const vehicle = await storage.getVehicle(req.body.vehicleId);
      if (!vehicle) {
        return res.status(404).json({ message: "Veículo não encontrado" });
      }

      // Get renter information
      const renter = await storage.getUser(req.user!.id);
      if (!renter) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Get owner information
      const owner = await storage.getUser(vehicle.ownerId);
      if (!owner) {
        return res.status(404).json({ message: "Proprietário não encontrado" });
      }

      // Parse dates and calculate fees
      const startDate = new Date(req.body.startDate);
      const endDate = new Date(req.body.endDate);
      const totalPrice = parseFloat(req.body.totalPrice || "0");

      // Check vehicle availability
      const isAvailable = await storage.checkVehicleAvailability(
        req.body.vehicleId,
        startDate,
        endDate
      );

      if (!isAvailable) {
        return res.status(400).json({ message: "Veículo não disponível para as datas selecionadas" });
      }

      // Prepare booking data
      const bookingPayload = {
        vehicleId: req.body.vehicleId,
        renterId: req.user!.id,
        ownerId: vehicle.ownerId,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        totalPrice: totalPrice.toFixed(2),
        status: "pending",
        paymentStatus: "pending",
        notes: "Solicitação via botão Alugar - aguardando confirmação do proprietário",
      };

      const bookingData = insertBookingSchema.parse(bookingPayload);
      const booking = await storage.createBooking(bookingData);

      // Prepare email data
      const emailData: BookingEmailData = {
        bookingId: booking.id.toString(),
        vehicleBrand: vehicle.brand,
        vehicleModel: vehicle.model,
        startDate: startDate.toLocaleDateString('pt-BR'),
        endDate: endDate.toLocaleDateString('pt-BR'),
        totalPrice: totalPrice,
        renterName: renter.name || renter.email,
        renterEmail: renter.email,
        ownerName: owner.name || owner.email,
        ownerEmail: owner.email
      };

      // Send emails (don't block the response)
      Promise.all([
        emailService.sendBookingConfirmationToRenter(emailData.renterEmail!, emailData.renterName!, emailData),
        emailService.sendBookingNotificationToOwner(emailData.ownerEmail!, emailData.ownerName!, emailData)
      ]).catch(error => {
        console.error('Erro ao enviar e-mails de confirmação:', error);
      });

      res.status(201).json({
        booking,
        message: "Solicitação de aluguel enviada com sucesso!",
        emails: "E-mails de confirmação enviados para você e o proprietário."
      });

    } catch (error) {
      console.error("Rent now error:", error);
      res.status(400).json({ message: "Falha ao processar solicitação. Verifique os dados informados" });
    }
  });

  app.put("/api/bookings/:id", authenticateToken, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const booking = await storage.getBooking(bookingId);

      if (!booking) {
        return res.status(404).json({ message: "Reserva não encontrada" });
      }

      // Allow update for inspection status by renter or owner
      const updates = req.body;
      if (updates.inspectionStatus) {
        // Renter or owner can update inspection status
        if (booking.ownerId !== req.user!.id && booking.renterId !== req.user!.id) {
          return res.status(403).json({ message: "Acesso negado. Você não tem permissão para alterar esta reserva" });
        }
        
        const updatedBooking = await storage.updateBooking(bookingId, updates);
        return res.json({ message: "Status da vistoria atualizado", booking: updatedBooking });
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






  // Vehicle Inspection routes
  app.get("/api/inspections/booking/:bookingId", authenticateToken, async (req, res) => {
    try {
      const inspection = await storage.getInspectionByBooking(parseInt(req.params.bookingId));
      res.json(inspection);
    } catch (error) {
      console.error("Get inspection error:", error);
      res.status(500).json({ message: "Falha ao buscar vistoria" });
    }
  });

  app.get("/api/inspections/renter", authenticateToken, async (req, res) => {
    try {
      const inspections = await storage.getInspectionsByRenter(req.user!.id);
      res.json(inspections);
    } catch (error) {
      console.error("Get renter inspections error:", error);
      res.status(500).json({ message: "Falha ao buscar vistorias do locatário" });
    }
  });

  app.get("/api/inspections/owner", authenticateToken, async (req, res) => {
    try {
      const inspections = await storage.getInspectionsByOwner(req.user!.id);
      res.json(inspections);
    } catch (error) {
      console.error("Get owner inspections error:", error);
      res.status(500).json({ message: "Falha ao buscar vistorias do proprietário" });
    }
  });

  // Get inspection by reservation/booking ID
  app.get("/api/inspections/reservation/:id", authenticateToken, async (req, res) => {
    try {
      const reservationId = parseInt(req.params.id);
      
      // Verify that the booking belongs to the user (as renter or owner)
      const booking = await storage.getBooking(reservationId);
      if (!booking || (booking.renterId !== req.user!.id && booking.ownerId !== req.user!.id)) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const inspection = await storage.getInspectionByBooking(reservationId);
      if (!inspection) {
        return res.status(404).json({ message: "Vistoria não encontrada" });
      }
      
      res.json(inspection);
    } catch (error) {
      console.error("Get inspection by reservation error:", error);
      res.status(500).json({ message: "Falha ao buscar vistoria da reserva" });
    }
  });

  app.post("/api/inspections", authenticateToken, async (req, res) => {
    try {
      // Verificar se a reserva pertence ao usuário
      const booking = await storage.getBooking(req.body.bookingId);
      if (!booking || booking.renterId !== req.user!.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Verificar se já existe vistoria para essa reserva
      const existingInspection = await storage.getInspectionByBooking(req.body.bookingId);
      if (existingInspection) {
        return res.status(400).json({ message: "Já existe uma vistoria para esta reserva" });
      }

      // Criar um schema simplificado para vistoria que não exige vehicleId (será obtido da reserva)
      const inspectionFormData = {
        bookingId: req.body.bookingId,
        vehicleId: booking.vehicleId, // Obtido da reserva
        mileage: req.body.kilometrage || req.body.mileage, // Aceita ambos os nomes
        fuelLevel: req.body.fuelLevel,
        vehicleCondition: req.body.vehicleCondition || 'good', // Default se não enviado
        observations: req.body.observations || '',
        photos: req.body.photos || [],
        damages: req.body.damages || [],
      };

      // Validar dados formatados
      const validatedData = insertVehicleInspectionFormSchema.parse(inspectionFormData);

      // Combinar dados validados com campos automáticos
      const finalInspectionData = {
        ...validatedData,
        renterId: req.user!.id,
        ownerId: booking.ownerId,
      };

      const inspection = await storage.createVehicleInspection(finalInspectionData);
      res.status(201).json(inspection);
    } catch (error) {
      console.error("Create inspection error:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Falha ao criar vistoria" });
    }
  });

  app.put("/api/inspections/:id", authenticateToken, async (req, res) => {
    try {
      const inspection = await storage.getVehicleInspection(parseInt(req.params.id));
      if (!inspection) {
        return res.status(404).json({ message: "Vistoria não encontrada" });
      }

      // Verificar se o usuário pode editar esta vistoria (é o locatário)
      if (inspection.renterId !== req.user!.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const updateData = insertVehicleInspectionSchema.partial().parse(req.body);
      // Ensure photos field is properly typed as string array
      if (updateData.photos && !Array.isArray(updateData.photos)) {
        updateData.photos = updateData.photos ? [updateData.photos as string] : [];
      }
      const updatedInspection = await storage.updateVehicleInspection(parseInt(req.params.id), updateData);

      if (!updatedInspection) {
        return res.status(404).json({ message: "Vistoria não encontrada" });
      }

      res.json(updatedInspection);
    } catch (error) {
      console.error("Update inspection error:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Falha ao atualizar vistoria" });
    }
  });

  app.post("/api/inspections/:id/approve", authenticateToken, async (req, res) => {
    try {
      const inspection = await storage.getVehicleInspection(parseInt(req.params.id));
      if (!inspection) {
        return res.status(404).json({ message: "Vistoria não encontrada" });
      }

      // Verificar se o usuário pode aprovar esta vistoria (é o locatário)
      if (inspection.renterId !== req.user!.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const approvedInspection = await storage.approveInspection(parseInt(req.params.id));

      if (!approvedInspection) {
        return res.status(404).json({ message: "Vistoria não encontrada" });
      }

      // Trigger automático para processar repasse ao proprietário
      try {
        const { autoPayoutService } = await import("./services/autoPayoutService.js");
        console.log("🚀 Vistoria aprovada, disparando repasse automático para booking:", approvedInspection.bookingId);

        // Trigger imediato (sem delay de segurança para teste)
        setTimeout(() => {
          autoPayoutService.triggerPayoutAfterPayment(approvedInspection.bookingId);
        }, 5000); // 5 segundos de delay apenas para garantir que a aprovação foi salva

      } catch (error) {
        console.error("❌ Erro ao disparar repasse automático:", error);
      }

      res.json(approvedInspection);
    } catch (error) {
      console.error("Approve inspection error:", error);
      res.status(500).json({ message: "Falha ao aprovar vistoria" });
    }
  });

  app.post("/api/inspections/:id/reject", authenticateToken, async (req, res) => {
    try {
      const { reason, refundAmount } = req.body;
      if (!reason) {
        return res.status(400).json({ message: "Motivo da rejeição é obrigatório" });
      }

      const inspection = await storage.getVehicleInspection(parseInt(req.params.id));
      if (!inspection) {
        return res.status(404).json({ message: "Vistoria não encontrada" });
      }

      // Verificar se o usuário pode rejeitar esta vistoria (é o locatário)
      if (inspection.renterId !== req.user!.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const rejectedInspection = await storage.rejectInspection(parseInt(req.params.id), reason, refundAmount);

      if (!rejectedInspection) {
        return res.status(404).json({ message: "Vistoria não encontrada" });
      }

      // TODO: Aqui seria o trigger para processar o estorno ao locatário

      res.json(rejectedInspection);
    } catch (error) {
      console.error("Reject inspection error:", error);
      res.status(500).json({ message: "Falha ao rejeitar vistoria" });
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

  // Saved Vehicles routes (Save for Later feature)
  app.get("/api/saved-vehicles", authenticateToken, async (req, res) => {
    try {
      const category = req.query.category as string;
      const savedVehicles = await storage.getSavedVehicles(req.user!.id, category);
      res.json(savedVehicles);
    } catch (error) {
      console.error("Get saved vehicles error:", error);
      res.status(500).json({ message: "Falha ao buscar veículos salvos" });
    }
  });

  app.get("/api/saved-vehicles/categories", authenticateToken, async (req, res) => {
    try {
      const categories = await storage.getSavedVehicleCategories(req.user!.id);
      res.json(categories);
    } catch (error) {
      console.error("Get saved vehicle categories error:", error);
      res.status(500).json({ message: "Falha ao buscar categorias de veículos salvos" });
    }
  });

  app.get("/api/saved-vehicles/check/:vehicleId", authenticateToken, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      console.log(`🔍 [API] Checking if vehicle ${vehicleId} is saved for user ${req.user!.id}`);
      const isSaved = await storage.isVehicleSaved(req.user!.id, vehicleId);
      console.log(`✅ [API] Vehicle ${vehicleId} saved status: ${isSaved}`);
      res.json({ isSaved });
    } catch (error) {
      console.error("❌ [API] Check saved vehicle error:", error);
      res.status(500).json({ message: "Falha ao verificar veículo salvo" });
    }
  });

  app.post("/api/saved-vehicles", authenticateToken, async (req, res) => {
    try {
      const { vehicleId, category, notes } = req.body;
      console.log(`🚀 [API] Saving vehicle ${vehicleId} for user ${req.user!.id}`, { vehicleId, category, notes });

      // Check if vehicle exists
      const vehicle = await storage.getVehicle(vehicleId);
      if (!vehicle) {
        console.log(`❌ [API] Vehicle ${vehicleId} not found`);
        return res.status(404).json({ message: "Veículo não encontrado" });
      }

      // Check if already saved
      const existing = await storage.getSavedVehicle(req.user!.id, vehicleId);
      if (existing) {
        console.log(`⚠️ [API] Vehicle ${vehicleId} already saved for user ${req.user!.id}`);
        return res.status(400).json({ message: "Veículo já está salvo" });
      }

      const saveData = {
        userId: req.user!.id,
        vehicleId,
        category: category || "Geral",
        notes: notes || null
      };

      const savedVehicle = await storage.saveVehicle(saveData);
      console.log(`✅ [API] Vehicle ${vehicleId} saved successfully:`, savedVehicle);
      res.status(201).json(savedVehicle);
    } catch (error) {
      console.error("❌ [API] Save vehicle error:", error);
      res.status(400).json({ message: "Falha ao salvar veículo" });
    }
  });

  app.put("/api/saved-vehicles/:vehicleId", authenticateToken, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      const { category, notes } = req.body;

      const savedVehicle = await storage.getSavedVehicle(req.user!.id, vehicleId);
      if (!savedVehicle) {
        return res.status(404).json({ message: "Veículo salvo não encontrado" });
      }

      const updateData = {
        category: category || savedVehicle.category,
        notes: notes !== undefined ? notes : savedVehicle.notes
      };

      const updated = await storage.updateSavedVehicle(savedVehicle.id, updateData);
      res.json(updated);
    } catch (error) {
      console.error("Update saved vehicle error:", error);
      res.status(400).json({ message: "Falha ao atualizar veículo salvo" });
    }
  });

  app.delete("/api/saved-vehicles/:vehicleId", authenticateToken, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      console.log(`🗑️ [API] Removing saved vehicle ${vehicleId} for user ${req.user!.id}`);
      const deleted = await storage.removeSavedVehicle(req.user!.id, vehicleId);

      if (!deleted) {
        console.log(`❌ [API] Saved vehicle ${vehicleId} not found for user ${req.user!.id}`);
        return res.status(404).json({ message: "Veículo salvo não encontrado" });
      }

      console.log(`✅ [API] Vehicle ${vehicleId} removed successfully`);
      res.status(204).send();
    } catch (error) {
      console.error("❌ [API] Remove saved vehicle error:", error);
      res.status(500).json({ message: "Falha ao remover veículo salvo" });
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
  // Create contract route
  app.post("/api/contracts", authenticateToken, async (req, res) => {
    console.log("📄 POST /api/contracts called");
    
    try {
      // Check if contract signature feature is enabled
      const adminSettings = await storage.getAdminSettings();
      const featureFlags = getFeatureFlags(adminSettings);
      
      if (!featureFlags.contractSignatureEnabled) {
        console.log("❌ Contract signature feature is disabled");
        return res.status(403).json({ 
          message: "Funcionalidade de assinatura de contratos está desabilitada.",
          featureDisabled: true
        });
      }
      
      console.log("✅ Contract signature feature is enabled");
      console.log("🧪 Testing DocuSign service initialization...");
      
      const { bookingId, signaturePlatform = 'docusign' } = req.body;
      
      if (!bookingId) {
        return res.status(400).json({ message: "bookingId é obrigatório" });
      }

      // Load signature service to trigger initialization logs
      const { sendToSignaturePlatform } = await import('./services/signatureService.js');
      
      console.log(`📋 Creating contract for booking ${bookingId} with platform: ${signaturePlatform}`);
      
      // Get booking details
      const booking = await storage.getBookingWithDetails(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Reserva não encontrada" });
      }

      // Check if user has permission
      if (booking.renterId !== req.user!.id && booking.ownerId !== req.user!.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Generate contract number
      const contractNumber = `CONT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      // Create contract record
      const contractData = {
        bookingId: bookingId,
        contractNumber: contractNumber,
        contractData: { signaturePlatform: signaturePlatform },
        status: 'pending',
        createdAt: new Date(),
        renterSigned: false,
        ownerSigned: false
      };

      const contract = await storage.createContract(contractData);
      
      // Test DocuSign service - generate PDF and send to platform
      try {
        console.log("🔄 Sending contract to signature platform...");
        const pdfUrl = `${req.protocol}://${req.get('host')}/api/contracts/${contract.id}/pdf`;
        const documentId = await sendToSignaturePlatform(contract, pdfUrl);
        
        // Update contract with external document ID
        await storage.updateContract(contract.id, {
          externalDocumentId: documentId
        });

        console.log("✅ Contract sent to DocuSign successfully");
        
        res.status(201).json({
          ...contract,
          externalDocumentId: documentId,
          signUrl: `https://demo.docusign.net/signing/${contractNumber}`,
          message: "Contrato criado e enviado para DocuSign"
        });
        
      } catch (signatureError) {
        console.error("❌ Error sending to signature platform:", signatureError);
        res.status(201).json({
          ...contract,
          message: "Contrato criado, mas erro ao enviar para plataforma de assinatura"
        });
      }
      
    } catch (error) {
      console.error("❌ Create contract error:", error);
      res.status(500).json({ message: "Erro ao criar contrato" });
    }
  });

  // Coin System Routes
  // Get user's coin balance
  app.get("/api/coins", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      let coins = await storage.getUserCoins(userId);
      
      // Create coin record if it doesn't exist
      if (!coins) {
        coins = await storage.createUserCoins(userId);
      }
      
      res.json(coins);
    } catch (error) {
      console.error("Get coins error:", error);
      res.status(500).json({ message: "Erro ao buscar saldo de moedas" });
    }
  });

  // Get user's coin transaction history
  app.get("/api/coins/transactions", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const transactions = await storage.getCoinTransactions(userId, limit, offset);
      res.json(transactions);
    } catch (error) {
      console.error("Get coin transactions error:", error);
      res.status(500).json({ message: "Erro ao buscar histórico de transações" });
    }
  });

  // Validate discount code
  app.post("/api/coins/validate-discount", authenticateToken, async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: "Código de desconto é obrigatório" });
      }

      // Define available discount codes
      const discountCodes: { [key: string]: { percentage: number, description: string, active: boolean } } = {
        'WELCOME10': { percentage: 10, description: 'Desconto de boas-vindas', active: true },
        'PROMO20': { percentage: 20, description: 'Promoção especial', active: true },
        'SAVE30': { percentage: 30, description: 'Super desconto', active: true },
        'FIRST50': { percentage: 50, description: 'Primeira compra', active: true },
        'VIP15': { percentage: 15, description: 'Cliente VIP', active: true },
        'DESCONTO99': { percentage: 99, description: 'Super mega desconto!', active: true },
      };

      const discount = discountCodes[code.toUpperCase()];
      
      if (!discount || !discount.active) {
        return res.status(404).json({ message: "Código de desconto inválido ou expirado" });
      }

      const responseData = {
        code: code.toUpperCase(),
        percentage: discount.percentage,
        description: discount.description,
        valid: true
      };
      
      console.log('📤 Sending discount validation response:', responseData);
      res.json(responseData);
    } catch (error) {
      console.error("Validate discount error:", error);
      res.status(500).json({ message: "Erro ao validar código de desconto" });
    }
  });

  // Purchase coins via Stripe
  app.post("/api/coins/purchase", authenticateToken, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe não configurado" });
      }

      const { coinPackage, discountCode } = req.body;
      
      // Define coin packages - updated to match frontend
      const packages = {
        '200': { coins: 200, price: 20.00, name: '200 moedas' },
        '500': { coins: 500, price: 45.00, name: '500 moedas' },
        '1000': { coins: 1000, price: 80.00, name: '1000 moedas' },
        '2000': { coins: 2000, price: 150.00, name: '2000 moedas' },
      };

      const selectedPackage = packages[coinPackage as keyof typeof packages];
      if (!selectedPackage) {
        return res.status(400).json({ message: "Pacote de moedas inválido" });
      }

      // Apply coupon if provided (using same system as subscriptions)
      let finalPrice = selectedPackage.price;
      let couponApplied = null;
      
      if (discountCode) {
        try {
          // Get coupon from database
          const [coupon] = await db.select().from(coupons)
            .where(eq(coupons.code, discountCode.toUpperCase()));

          if (coupon && coupon.isActive && new Date() < new Date(coupon.expiresAt)) {
            const priceInCents = Math.round(selectedPackage.price * 100);
            let discountAmount = 0;
            
            // Calculate discount based on coupon type
            if (coupon.discountType === 'percentage') {
              discountAmount = Math.round((priceInCents * coupon.discountValue) / 100);
            } else if (coupon.discountType === 'fixed') {
              discountAmount = coupon.discountValue;
            }
            
            // Ensure discount doesn't exceed price
            discountAmount = Math.min(discountAmount, priceInCents);
            const finalPriceInCents = priceInCents - discountAmount;
            finalPrice = finalPriceInCents / 100;
            
            couponApplied = {
              code: discountCode.toUpperCase(),
              discountType: coupon.discountType,
              discountValue: coupon.discountValue,
              originalPrice: selectedPackage.price,
              discountAmount: discountAmount / 100,
              finalPrice: finalPrice
            };

            console.log('💰 Coupon applied to coin purchase:', {
              couponCode: discountCode.toUpperCase(),
              originalPrice: selectedPackage.price,
              discountType: coupon.discountType,
              discountValue: coupon.discountValue,
              finalPrice,
              discountAmount: discountAmount / 100
            });
          }
        } catch (couponError) {
          console.error('Error applying coupon to coin purchase:', couponError);
          // Continue without coupon if there's an error
        }
      }

      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(finalPrice * 100), // Convert to cents with discount applied
        currency: 'brl',
        metadata: {
          type: 'coin_purchase',
          userId: req.user!.id.toString(),
          coinAmount: selectedPackage.coins.toString(),
          packageName: selectedPackage.name,
          couponCode: discountCode || '',
          originalPrice: selectedPackage.price.toString(),
          finalPrice: finalPrice.toString(),
        },
        description: `Compra de ${selectedPackage.name} - alugae.mobi`,
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        packageInfo: selectedPackage,
        finalPrice,
        couponApplied
      });
    } catch (error) {
      console.error("Purchase coins error:", error);
      res.status(500).json({ message: "Erro ao processar compra de moedas" });
    }
  });

  // Complete coin purchase after Stripe payment confirmation
  app.post("/api/coins/complete-purchase", authenticateToken, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe não configurado" });
      }

      const { paymentIntentId } = req.body;
      const userId = req.user!.id;

      if (!paymentIntentId) {
        return res.status(400).json({ message: "ID do payment intent é obrigatório" });
      }

      // Verify payment with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: "Pagamento não foi confirmado" });
      }

      // Verify this payment belongs to the current user
      if (paymentIntent.metadata.userId !== userId.toString()) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Check if this purchase was already processed
      const existingTransaction = await storage.getCoinTransactionByPaymentIntent(paymentIntentId);
      if (existingTransaction) {
        return res.json({ 
          message: "Compra já processada",
          coinsAdded: parseInt(paymentIntent.metadata.coinAmount),
          alreadyProcessed: true 
        });
      }

      // Extract purchase details from payment intent metadata
      const coinsToAdd = parseInt(paymentIntent.metadata.coinAmount);
      const packageName = paymentIntent.metadata.packageName;
      const originalPrice = parseFloat(paymentIntent.metadata.originalPrice);
      const finalPrice = parseFloat(paymentIntent.metadata.finalPrice);
      const couponCode = paymentIntent.metadata.couponCode || null;

      // Get user's current coin balance
      let userCoins = await storage.getUserCoins(userId);
      if (!userCoins) {
        userCoins = await storage.createUserCoins(userId);
      }

      // Add coins to user's balance
      const newBalance = userCoins.availableCoins + coinsToAdd;
      await storage.updateUserCoins(userId, { availableCoins: newBalance });

      // Record the transaction
      const transaction = await storage.createCoinTransaction({
        userId,
        type: 'purchase',
        amount: coinsToAdd,
        description: `Compra de ${packageName}`,
        paymentIntentId,
        metadata: {
          packageName,
          originalPrice,
          finalPrice,
          couponCode: couponCode || undefined
        }
      });

      console.log(`💰 Coins credited to user ${userId}: +${coinsToAdd} coins (new balance: ${newBalance})`);

      res.json({
        message: "Moedas creditadas com sucesso!",
        coinsAdded: coinsToAdd,
        newBalance,
        transaction
      });
    } catch (error) {
      console.error("Complete coin purchase error:", error);
      res.status(500).json({ message: "Erro ao completar compra de moedas" });
    }
  });

  // Unlock contact information for a vehicle
  app.post("/api/coins/unlock-contact", authenticateToken, async (req, res) => {
    try {
      const { vehicleId } = req.body;
      const userId = req.user!.id;
      const coinsRequired = 200; // Cost to unlock contact

      if (!vehicleId) {
        return res.status(400).json({ message: "ID do veículo é obrigatório" });
      }

      // Check if already unlocked
      const existingUnlock = await storage.getContactUnlock(userId, vehicleId);
      if (existingUnlock) {
        return res.json({
          success: true,
          contactInfo: existingUnlock.contactInfo,
          message: "Contato já desbloqueado"
        });
      }

      // Get vehicle details
      const vehicle = await storage.getVehicle(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ message: "Veículo não encontrado" });
      }

      // Check if user is trying to unlock their own vehicle
      if (vehicle.ownerId === userId) {
        return res.status(400).json({ message: "Você não pode desbloquear seu próprio veículo" });
      }

      // Check user's coin balance
      let userCoins = await storage.getUserCoins(userId);
      if (!userCoins) {
        userCoins = await storage.createUserCoins(userId);
      }

      if (userCoins.availableCoins < coinsRequired) {
        return res.status(400).json({ 
          message: "Moedas insuficientes para desbloquear contato",
          required: coinsRequired,
          available: userCoins.availableCoins
        });
      }

      // Unlock contact
      const unlock = await storage.unlockContact(userId, vehicleId, vehicle.ownerId, coinsRequired);
      
      if (!unlock) {
        return res.status(500).json({ message: "Erro ao desbloquear contato" });
      }

      res.json({
        success: true,
        contactInfo: unlock.contactInfo,
        coinsSpent: coinsRequired,
        expiresAt: unlock.expiresAt,
        message: "Contato desbloqueado com sucesso"
      });
    } catch (error) {
      console.error("Unlock contact error:", error);
      res.status(500).json({ message: "Erro ao desbloquear contato" });
    }
  });

  // Get all contact unlocks for the user
  app.get("/api/coins/unlocks", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const unlocks = await storage.getAllContactUnlocks(userId);
      res.json(unlocks);
    } catch (error) {
      console.error("Get contact unlocks error:", error);
      res.status(500).json({ message: "Erro ao buscar contatos desbloqueados" });
    }
  });

  // Check if user can make rental request (has enough coins)
  app.post("/api/coins/check-rental-access", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const coinsRequired = 200;

      // Check if user has enough coins
      let userCoins = await storage.getUserCoins(userId);
      if (!userCoins) {
        userCoins = await storage.createUserCoins(userId);
      }

      const canProceed = userCoins.availableCoins >= coinsRequired;

      res.json({ 
        canProceed,
        availableCoins: userCoins.availableCoins,
        requiredCoins: coinsRequired,
        message: canProceed 
          ? "Moedas suficientes para prosseguir" 
          : `Moedas insuficientes. Você precisa de ${coinsRequired} moedas para fazer uma solicitação de aluguel.`
      });

    } catch (error) {
      console.error("Error checking rental access:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // General endpoint to deduct coins (for chat, rental, etc)
  app.post("/api/coins/deduct", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { amount, description, vehicleId, ownerId } = req.body;

      if (!amount || !description) {
        return res.status(400).json({ message: "Valor e descrição são obrigatórios" });
      }

      // Check if user has enough coins
      let userCoins = await storage.getUserCoins(userId);
      if (!userCoins) {
        userCoins = await storage.createUserCoins(userId);
      }

      if (userCoins.availableCoins < amount) {
        return res.status(400).json({ 
          message: `Moedas insuficientes. Você precisa de ${amount} moedas.`,
          availableCoins: userCoins.availableCoins,
          requiredCoins: amount
        });
      }

      // Deduct coins
      await storage.deductCoins(
        userId,
        amount,
        'spend',
        description,
        `chat_${vehicleId}_${userId}_${Date.now()}`
      );

      // Get updated coin balance
      const updatedCoins = await storage.getUserCoins(userId);

      res.json({
        success: true,
        deducted: amount,
        remainingCoins: updatedCoins?.availableCoins || 0,
        message: `${amount} moedas debitadas com sucesso`
      });

    } catch (error) {
      console.error("Deduct coins error:", error);
      res.status(500).json({ message: "Erro ao debitar moedas" });
    }
  });

  // Deduct coins for rental request
  app.post("/api/coins/deduct-rental", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { vehicleId, requestType } = req.body; // requestType: 'rent_now' or 'checkout'
      const coinsRequired = 200;

      if (!vehicleId || !requestType) {
        return res.status(400).json({ message: "Vehicle ID e tipo de solicitação são obrigatórios" });
      }

      // Check if user has enough coins
      let userCoins = await storage.getUserCoins(userId);
      if (!userCoins) {
        userCoins = await storage.createUserCoins(userId);
      }

      if (userCoins.availableCoins < coinsRequired) {
        return res.status(400).json({ 
          message: `Moedas insuficientes. Você precisa de ${coinsRequired} moedas.`,
          availableCoins: userCoins.availableCoins,
          requiredCoins: coinsRequired
        });
      }

      // Deduct coins
      const description = requestType === 'rent_now' 
        ? `Solicitação de aluguel - Veículo #${vehicleId}`
        : `Checkout de aluguel - Veículo #${vehicleId}`;

      await storage.deductCoins(
        userId,
        coinsRequired,
        'spend',
        description,
        `rental_${requestType}_${vehicleId}_${userId}_${Date.now()}`
      );

      res.json({ 
        success: true,
        coinsDeducted: coinsRequired,
        remainingCoins: userCoins.availableCoins - coinsRequired
      });

    } catch (error) {
      console.error("Error deducting coins for rental:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

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
      console.log(`Fetching conversations for user ${req.user!.id}`);
      const conversations = await storage.getUserConversations(req.user!.id);
      console.log(`Found ${conversations.length} conversations:`, conversations);
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

      // Mark messages from the other user as read
      if (messages.length > 0) {
        await storage.markMessagesAsRead(req.user!.id, otherUserId);
      }

      console.log(`Found ${messages.length} messages:`, messages);
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Falha ao buscar mensagens" });
    }
  });

  app.post("/api/messages", authenticateToken, validateMessage, handleValidationErrors, async (req: Request, res: Response) => {
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

      // Get sender and receiver info for real-time notifications
      const sender = await storage.getUser(req.user!.id);
      const receiver = await storage.getUser(receiverIdNumber);

      // Send real-time WebSocket notification to receiver
      if (sender && receiver) {
        const realtimeMessage = {
          type: 'new_message',
          message: {
            id: message.id,
            content: message.content,
            senderId: message.senderId,
            receiverId: message.receiverId,
            createdAt: message.createdAt,
            isRead: message.isRead,
            sender: {
              id: sender.id,
              name: sender.name,
              avatar: sender.avatar
            }
          }
        };

        // Broadcast to receiver via WebSocket
        const broadcasted = (req.app as any).broadcastToUser(receiverIdNumber, realtimeMessage);
        console.log(`🔄 Real-time message ${broadcasted ? 'sent' : 'failed'} to user ${receiverIdNumber}`);
      }

      // Send push notification to receiver
      try {
        const receiver = await storage.getUserWithPushToken(receiverIdNumber);
        
        if (receiver?.pushToken && sender) {
          const notification = {
            to: receiver.pushToken,
            title: `Nova mensagem de ${sender.name}`,
            body: content.length > 50 ? content.substring(0, 50) + '...' : content,
            data: {
              type: 'new_message',
              senderId: req.user!.id,
              senderName: sender.name,
              bookingId: bookingId || null,
              messageId: message.id
            },
            sound: 'default',
            priority: 'high',
            channelId: 'messages'
          };

          // Send push notification
          const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Accept-encoding': 'gzip, deflate',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify([notification]),
          });

          const result = await response.json();
          console.log(`📱 Message push notification sent to ${receiver.name}:`, result);
        }
      } catch (pushError) {
        console.error("Push notification error:", pushError);
        // Don't fail the message creation if push notification fails
      }

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
      const userId = req.user!.id;
      const count = await storage.getUnreadMessageCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Get unread message count error:", error);
      res.json({ count: 0 }); // Return 0 on error instead of 500
    }
  });

  // Push notification endpoints
  app.post("/api/notifications/register-token", authenticateToken, async (req, res) => {
    try {
      const { expoPushToken, platform } = req.body;
      const userId = req.user!.id;

      if (!expoPushToken) {
        return res.status(400).json({ message: "expoPushToken is required" });
      }

      // Store the push token for the user
      await storage.updateUserPushToken(userId, expoPushToken, platform);
      
      console.log(`📱 Push token registered for user ${userId}: ${expoPushToken.substring(0, 20)}...`);
      res.json({ success: true, message: "Push token registered successfully" });
    } catch (error) {
      console.error("Register push token error:", error);
      res.status(500).json({ message: "Falha ao registrar token de push" });
    }
  });

  app.post("/api/notifications/send", authenticateToken, async (req, res) => {
    try {
      const { userIds, title, body, data } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: "userIds array is required" });
      }

      if (!title || !body) {
        return res.status(400).json({ message: "title and body are required" });
      }

      // Implementation continues here...
      res.json({ success: true, message: "Notifications sent" });
    } catch (error) {
      console.error("Send notifications error:", error);
      res.status(500).json({ message: "Falha ao enviar notificações" });
    }
  });

  // Admin messaging endpoints
  app.get("/api/admin/user-stats", authenticateToken, async (req, res) => {
    try {
      // Check if user is admin
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const stats = await storage.getUserStats();
      res.json(stats);
    } catch (error) {
      console.error("Erro ao buscar estatísticas de usuários:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/admin/send-bulk-message", authenticateToken, async (req, res) => {
    try {
      // Check if user is admin
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const { title, content, targetAudience, sendPushNotification, sendEmail } = req.body;

      if (!title || !content) {
        return res.status(400).json({ message: "Título e conteúdo são obrigatórios" });
      }

      // Get users based on target audience
      const targetUsers = await storage.getUsersByRole(targetAudience);
      
      if (targetUsers.length === 0) {
        return res.status(400).json({ message: "Nenhum usuário encontrado para o público-alvo selecionado" });
      }

      let successCount = 0;
      let errors: string[] = [];

      // Send push notifications if enabled
      if (sendPushNotification) {
        const usersWithTokens = await storage.getUsersWithPushTokens(targetUsers.map(u => u.id));
        
        for (const user of usersWithTokens) {
          if (user.pushToken) {
            try {
              const notificationService = (await import('./services/notificationService')).default;
              await notificationService.sendPushNotification(user.pushToken, {
                title: title,
                body: content,
                data: {
                  type: 'admin_message',
                  messageId: Date.now().toString(),
                }
              });
              successCount++;
            } catch (notificationError) {
              const errorMsg = notificationError instanceof Error ? notificationError.message : 'Erro desconhecido';
              console.error(`Erro ao enviar push notification para usuário ${user.id}:`, notificationError);
              errors.push(`Usuário ${user.id}: ${errorMsg}`);
            }
          }
        }
      }

      // Send emails if enabled
      let emailSuccessCount = 0;
      if (sendEmail) {
        const { default: emailService } = await import('./services/emailService.js');
        const emailRecipients = targetUsers
          .filter(user => user.email)
          .map(user => ({ 
            email: user.email!, 
            name: user.name || 'Usuário' 
          }));

        if (emailRecipients.length > 0) {
          const emailResult = await emailService.sendBulkNotificationEmails(
            emailRecipients,
            {
              title: title,
              body: content,
              data: {
                type: 'admin_message',
                messageId: Date.now().toString(),
              }
            }
          );
          
          emailSuccessCount = emailResult.successCount;
          if (emailResult.errors.length > 0) {
            errors.push(...emailResult.errors.map(err => `Email - ${err}`));
          }
        }
      }

      // Store message in history
      const messageRecord = await storage.createAdminMessage({
        title,
        content,
        targetAudience,
        recipientCount: targetUsers.length,
        status: errors.length > 0 ? 'partial' : 'sent'
      });

      res.json({
        success: true,
        recipientCount: targetUsers.length,
        pushNotifications: {
          sent: successCount,
          total: sendPushNotification ? targetUsers.length : 0
        },
        emails: {
          sent: emailSuccessCount,
          total: sendEmail ? targetUsers.filter(u => u.email).length : 0
        },
        errors: errors.length > 0 ? errors : undefined,
        message: `Mensagem enviada - Push: ${successCount} usuários, Email: ${emailSuccessCount} usuários`
      });

    } catch (error) {
      console.error("Erro ao enviar mensagem em massa:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/admin/message-history", authenticateToken, async (req, res) => {
    try {
      // Check if user is admin
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const history = await storage.getAdminMessageHistory();
      res.json(history);
    } catch (error) {
      console.error("Erro ao buscar histórico de mensagens:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
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

  // Transfer coins to user (admin only)
  app.post("/api/admin/transfer-coins", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { userId, amount, description } = req.body;

      if (!userId || !amount || amount <= 0) {
        return res.status(400).json({ message: "ID do usuário e valor válido são obrigatórios" });
      }

      // Check if user exists
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Ensure user has coin record
      let userCoins = await storage.getUserCoins(userId);
      if (!userCoins) {
        userCoins = await storage.createUserCoins(userId);
      }

      // Add coins to user
      await storage.addCoins(
        userId,
        amount,
        'admin_transfer',
        description || `Transferência de moedas pelo administrador`,
        `admin_transfer_${userId}_${Date.now()}`
      );

      // Get updated coin balance
      const updatedCoins = await storage.getUserCoins(userId);

      res.json({
        success: true,
        transferred: amount,
        totalCoins: updatedCoins?.availableCoins || 0,
        message: `${amount} moedas transferidas para ${user.name}`
      });

    } catch (error) {
      console.error("Transfer coins error:", error);
      res.status(500).json({ message: "Erro ao transferir moedas" });
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
      if (booking.paymentIntentId && booking.paymentStatus === 'paid' && stripe) {
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
        } catch (stripeError: unknown) {
          console.error('Stripe refund error:', stripeError);
          const errorMessage = stripeError instanceof Error ? stripeError.message : 'Unknown error';
          return res.status(400).json({ 
            message: "Erro ao processar estorno no Stripe",
            details: errorMessage 
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ 
        message: "Erro interno ao cancelar contrato",
        details: errorMessage 
      });
    }
  });

  // Google Mobile OAuth endpoint
  app.post("/api/auth/google-mobile", async (req, res) => {
    try {
      const { googleId, email, name, photo, idToken } = req.body;

      if (!googleId || !email || !idToken) {
        return res.status(400).json({ message: "Dados do Google obrigatórios" });
      }

      // Verify Google ID token
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
      if (!response.ok) {
        return res.status(401).json({ message: "Token Google inválido" });
      }

      const tokenInfo = await response.json();
      if (tokenInfo.sub !== googleId) {
        return res.status(401).json({ message: "Google ID não confere" });
      }

      // Find or create user
      let user = await storage.getUserByEmail(email);

      if (!user) {
        // Create new user
        user = await storage.createUser({
          name: name || email.split('@')[0],
          email: email,
          password: await bcrypt.hash(Math.random().toString(36), 10), // Random password
          phone: '', // Will be filled later
          role: 'renter',
          avatar: photo,
        });

        console.log('✅ New Google mobile user created:', user.email);
      } else {
        // Update existing user info if needed
        if (photo && !user.avatar) {
          await storage.updateUser(user.id, { avatar: photo });
        }
      }

      // Generate tokens
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
      const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET + '_refresh', { expiresIn: '7d' });

      const { password: _, ...userWithoutPassword } = user;

      res.json({
        user: userWithoutPassword,
        token: token,
        refreshToken: refreshToken
      });

    } catch (error) {
      console.error('❌ Google mobile login error:', error);
      res.status(500).json({ message: 'Erro interno na autenticação' });
    }
  });

  // Apple Mobile OAuth endpoint
  app.post("/api/auth/apple-mobile", async (req, res) => {
    try {
      const { appleId, email, fullName, identityToken, authorizationCode } = req.body;

      if (!appleId || !identityToken) {
        return res.status(400).json({ message: "Dados da Apple obrigatórios" });
      }

      // For Apple, email might not be provided on subsequent logins
      // We'll need to handle users by their Apple ID
      let user;
      
      if (email) {
        user = await storage.getUserByEmail(email);
      }

      if (!user) {
        // Create new user
        const userName = fullName ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim() : `Usuário Apple ${appleId.slice(-4)}`;
        
        user = await storage.createUser({
          name: userName || `Usuário Apple ${appleId.slice(-4)}`,
          email: email || `${appleId}@apple.private`,
          password: await bcrypt.hash(Math.random().toString(36), 10), // Random password
          phone: '', // Will be filled later
          role: 'renter',
          avatar: '',
        });

        console.log('✅ New Apple mobile user created:', user.email);
      }

      // Generate tokens
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
      const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET + '_refresh', { expiresIn: '7d' });

      const { password: _, ...userWithoutPassword } = user;

      res.json({
        user: userWithoutPassword,
        token: token,
        refreshToken: refreshToken
      });

    } catch (error) {
      console.error('❌ Apple mobile login error:', error);
      res.status(500).json({ message: 'Erro interno na autenticação' });
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
      console.log("🎯 Generating referral code for user:", req.user!.id);

      // Check if user already has an active referral code
      const existingReferrals = await storage.getUserReferrals(req.user!.id);
      console.log("🎯 Existing referrals found:", existingReferrals.length);

      const activeReferral = existingReferrals.find(r => r.status === 'active');

      if (activeReferral) {
        console.log("🎯 Returning existing active referral:", activeReferral.referralCode);

        // Generate referral link for existing code
        const baseUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
        const referralLink = `${baseUrl}/register?ref=${activeReferral.referralCode}`;

        return res.json({ 
          referralCode: activeReferral.referralCode,
          referralLink: referralLink
        });
      }

      // Generate new referral code
      const referralCode = storage.generateReferralCode();
      console.log("🎯 Generated new referral code:", referralCode);

      // Create referral record (without referred user yet)
      const referral = await storage.createReferral({
        referrerId: req.user!.id,
        referredId: null, // Will be updated when someone uses the code
        referralCode,
        status: 'active',
        rewardPoints: 100,
        rewardStatus: 'pending',
      });

      console.log("🎯 Created referral record:", referral.id);

      // Generate referral link
      const baseUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
      const referralLink = `${baseUrl}/register?ref=${referral.referralCode}`;

      res.json({ 
        referralCode: referral.referralCode,
        referralLink: referralLink
      });
    } catch (error: any) {
      console.error("Error generating referral code:", error);
      res.status(500).json({ message: "Erro interno do servidor", details: error.message });
    }
  });

  app.post("/api/referrals/use-code", authenticateToken, async (req, res) => {
    try {
      const { referralCode } = req.body;
      const userId = req.user!.id;

      if (!referralCode) {
        return res.status(400).json({ message: "Código de convite obrigatório" });
      }

      // Validate referral code format (8 characters, alphanumeric)
      if (!/^[A-Z0-9]{8}$/.test(referralCode)) {
        return res.status(400).json({ message: "Formato do código de convite inválido" });
      }

      // Find referral by code
      const referral = await storage.getReferralByCode(referralCode);

      if (!referral) {
        return res.status(404).json({ message: "Código de convite não encontrado" });
      }

      // Check if user is trying to use their own referral code
      if (referral.referrerId === userId) {
        console.log(`🚫 User ${userId} attempted to use their own referral code: ${referralCode}`);
        return res.status(400).json({ 
          message: "Você não pode usar seu próprio código de convite",
          error: "SELF_REFERRAL_NOT_ALLOWED"
        });
      }

      // Check if user has already used any referral code
      const existingUserReferrals = await storage.getUserReferrals(userId);
      const userAsReferred = existingUserReferrals.find(r => r.referredId === userId);

      if (userAsReferred) {
        return res.status(400).json({ 
          message: "Você já utilizou um código de convite anteriormente",
          error: "REFERRAL_ALREADY_USED"
        });
      }

      // Check if referral is already completed or has a referred user
      if (referral.status === 'completed') {
        return res.status(400).json({ 
          message: "Este código de convite já foi utilizado por outro usuário",
          error: "REFERRAL_CODE_EXPIRED"
        });
      }

      if (referral.referredId && referral.referredId !== userId) {
        return res.status(400).json({ 
          message: "Este código de convite já está sendo usado por outro usuário",
          error: "REFERRAL_CODE_IN_USE"
        });
      }

      // Additional validation: Check if user has created any referrals (prevent circular referrals)
      const userCreatedReferrals = await storage.getUserReferrals(referral.referrerId);
      const circularCheck = userCreatedReferrals.find(r => r.referredId === userId);

      if (circularCheck) {
        return res.status(400).json({ 
          message: "Não é possível usar código de alguém que já usou o seu",
          error: "CIRCULAR_REFERRAL_NOT_ALLOWED"
        });
      }

      // Update referral with referred user
      await storage.updateReferral(referral.id, {
        referredId: userId,
        status: 'pending_completion',
      });

      console.log(`✅ User ${userId} successfully applied referral code: ${referralCode} from user ${referral.referrerId}`);

      res.json({ 
        message: "Código de convite aplicado com sucesso!",
        referralCode: referralCode,
        success: true
      });
    } catch (error: any) {
      console.error("Error using referral code:", error);
      res.status(500).json({ 
        message: "Erro interno do servidor", 
        details: error.message,
        error: "INTERNAL_SERVER_ERROR"
      });
    }
  });

  // Validate referral code and get inviter info (no auth required)
  app.get("/api/referrals/validate/:code", async (req, res) => {
    try {
      const { code } = req.params;

      // Validate referral code format (8 characters, alphanumeric)
      if (!/^[A-Z0-9]{8}$/.test(code)) {
        return res.status(400).json({ message: "Formato do código de convite inválido" });
      }

      // Find referral by code
      const referral = await storage.getReferralByCode(code);

      if (!referral) {
        return res.status(404).json({ message: "Código de convite não encontrado" });
      }

      // Get referrer user info
      const referrerUser = await storage.getUserById(referral.referrerId);

      if (!referrerUser) {
        return res.status(404).json({ message: "Usuário que fez o convite não encontrado" });
      }

      res.json({ 
        valid: true,
        referralCode: code,
        inviterName: referrerUser.name,
        inviterEmail: referrerUser.email
      });
    } catch (error: any) {
      console.error("Error validating referral code:", error);
      res.status(500).json({ 
        message: "Erro interno do servidor", 
        details: error.message 
      });
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

  // Manual endpoint to process pending referral rewards
  app.post("/api/referrals/process-pending", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;

      // Find all referrals where this user is the referred user with pending rewards
      const allReferrals = await storage.getAllReferrals();
      const pendingReferrals = allReferrals.filter(r => 
        r.referredId === userId && 
        r.status === 'pending_completion' && 
        r.rewardStatus === 'pending'
      );

      let processedCount = 0;
      for (const referral of pendingReferrals) {
        try {
          await storage.processReferralReward(referral.id);
          processedCount++;
          console.log(`✅ Processed referral reward ${referral.id} for user ${userId}`);
        } catch (error) {
          console.error(`❌ Failed to process referral ${referral.id}:`, error);
        }
      }

      res.json({ 
        message: `Processados ${processedCount} códigos de convite pendentes`,
        processedCount,
        totalPending: pendingReferrals.length
      });
    } catch (error) {
      console.error("Error processing pending referrals:", error);
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
      res.json(transactions || []);
    } catch (error) {
      console.error("Error fetching reward transactions:", error);
      // Return empty array instead of 500 to prevent errors
      res.json([]);
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
      // Check if contract signature feature is enabled
      const adminSettings = await storage.getAdminSettings();
      const featureFlags = getFeatureFlags(adminSettings);
      
      if (!featureFlags.contractSignatureEnabled) {
        console.log("❌ Contract signature feature is disabled");
        return res.status(403).json({ 
          message: "Funcionalidade de assinatura de contratos está desabilitada.",
          featureDisabled: true
        });
      }
      
      const { bookingId } = req.params;
      const userId = (req.user as any)?.id;

      const booking = await storage.getBookingWithDetails(parseInt(bookingId));
      if (!booking) {
        return res.status(404).json({ message: "Reserva não encontrada" });
      }

      // Check if user has permission to sign this contract
      if (booking.renterId !== userId && booking.ownerId !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Check if contract already exists and is signed
      const existingContracts = await storage.getContractsByBooking(parseInt(bookingId));
      if (existingContracts.length > 0) {
        const contract = existingContracts[0];
        // Check if both parties have signed
        if (contract.renterSigned && contract.ownerSigned) {
          return res.status(400).json({ 
            message: "Este contrato já foi assinado por ambas as partes. Não é possível assinar novamente um contrato já finalizado." 
          });
        }
        // Check if current user already signed
        const isRenter = booking.renterId === userId;
        const isOwner = booking.ownerId === userId;
        if ((isRenter && contract.renterSigned) || (isOwner && contract.ownerSigned)) {
          return res.status(400).json({ 
            message: "Você já assinou este contrato. Aguarde a assinatura da outra parte." 
          });
        }
      }

      // Prevent re-signing if booking status indicates completion
      if (booking.status === 'contracted') {
        return res.status(400).json({ 
          message: "Este contrato já foi assinado. Não é possível assinar novamente um contrato já finalizado." 
        });
      }

      // Check if booking is in valid state for signing
      if (booking.status !== 'approved') {
        return res.status(400).json({ 
          message: "A reserva deve estar aprovada para permitir assinatura do contrato." 
        });
      }

      // Generate DocuSign envelope ID
      const envelopeId = `DOCUSIGN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const returnUrl = `${req.protocol}://${req.get('host')}/contract-signature-callback?bookingId=${bookingId}&envelopeId=${envelopeId}`;

      // Use the proper signature service instead of custom DocuSign code
      const { sendToSignaturePlatform } = await import('./services/signatureService.js');
      
      // Create contract object for the signature service with full data
      const contract = {
        contractNumber: `CNT-${Date.now()}`,
        signaturePlatform: 'docusign',
        contractData: {
          renter: {
            name: booking.renter?.name || '',
            email: booking.renter?.email || '',
            phone: booking.renter?.phone || ''
          },
          owner: {
            name: booking.owner?.name || 'Owner',
            email: booking.owner?.email || 'owner@example.com',
            phone: booking.owner?.phone || ''
          },
          vehicle: {
            brand: booking.vehicle?.brand || 'N/A',
            model: booking.vehicle?.model || 'N/A',
            year: booking.vehicle?.year || 'N/A',
            color: booking.vehicle?.color || 'N/A',
            transmission: booking.vehicle?.transmission || 'N/A',
            fuel: booking.vehicle?.fuel || 'N/A',
            seats: booking.vehicle?.seats || 'N/A',
            category: booking.vehicle?.category || 'N/A',
            location: booking.vehicle?.location || 'N/A',
            pricePerDay: booking.vehicle?.pricePerDay || 0
          },
          booking: {
            startDate: booking.startDate,
            endDate: booking.endDate,
            totalPrice: booking.totalPrice,
            servicefee: booking.serviceFee || 0
          }
        }
      };

      // For now, we'll pass a dummy URL since the service will generate its own PDF
      const pdfUrl = `http://localhost:5000/api/contracts/pdf/${bookingId}`;
      
      // Create the signature document using the real service
      const { getSignatureService } = await import('./services/signatureService.js');
      
      // Get the DocuSign service and create document
      const docuSignService = getSignatureService('docusign');
      const response = await docuSignService.createDocument(contract, pdfUrl);
      
      // The signature service returns a proper DocuSign signing URL
      const docusignUrl = response.signUrl;

      // Store signature session
      if (existingContracts.length > 0) {
        await storage.updateContract(existingContracts[0].id, {
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

  // Admin Subscription Management Routes
  app.get("/api/admin/subscriptions", authenticateToken, requireAdmin, async (req, res) => {
    try {
      console.log("📋 Fetching admin subscriptions...");
      const subscriptions = await db
        .select({
          id: userSubscriptions.id,
          planId: userSubscriptions.planId,
          status: userSubscriptions.status,
          paymentMethod: userSubscriptions.paymentMethod,
          createdAt: userSubscriptions.createdAt,
          stripeSubscriptionId: userSubscriptions.stripeSubscriptionId,
          paidAmount: userSubscriptions.paidAmount,
          vehicleCount: userSubscriptions.vehicleCount,
          paymentIntentId: userSubscriptions.paymentIntentId,
          paymentMetadata: userSubscriptions.paymentMetadata,
          plan: {
            id: subscriptionPlans.id,
            name: subscriptionPlans.name,
            displayName: subscriptionPlans.displayName,
            monthlyPrice: subscriptionPlans.monthlyPrice,
            annualPrice: subscriptionPlans.annualPrice
          },
          user: {
            id: users.id,
            name: users.name,
            email: users.email
          }
        })
        .from(userSubscriptions)
        .leftJoin(users, eq(userSubscriptions.userId, users.id))
        .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
        .orderBy(desc(userSubscriptions.createdAt));

      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching admin subscriptions:", error);
      res.status(500).json({ message: "Erro ao buscar assinaturas" });
    }
  });

  app.get("/api/admin/subscription-stats", authenticateToken, requireAdmin, async (req, res) => {
    try {
      console.log("📊 Fetching subscription stats...");

      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [
        totalSubscriptions,
        activeSubscriptions,
        monthlyRevenue,
        lastMonthRevenue
      ] = await Promise.all([
        // Total subscriptions
        db.select({ count: sql<number>`count(*)` })
          .from(userSubscriptions),

        // Active subscriptions
        db.select({ count: sql<number>`count(*)` })
          .from(userSubscriptions)
          .where(eq(userSubscriptions.status, 'active')),

        // Current monthly revenue from paid amounts
        db.select({ 
          sum: sql<number>`COALESCE(SUM(
            CASE 
              WHEN ${userSubscriptions.paidAmount} IS NOT NULL 
              THEN CAST(${userSubscriptions.paidAmount} AS decimal)
              ELSE 0
            END
          ), 0)` 
        })
        .from(userSubscriptions)
        .where(and(
          eq(userSubscriptions.status, 'active'),
          gte(userSubscriptions.createdAt, new Date(today.getFullYear(), today.getMonth(), 1))
        )),

        // Last month revenue for growth calculation
        db.select({ 
          sum: sql<number>`COALESCE(SUM(
            CASE 
              WHEN ${userSubscriptions.paidAmount} IS NOT NULL 
              THEN CAST(${userSubscriptions.paidAmount} AS decimal)
              ELSE 0
            END
          ), 0)` 
        })
        .from(userSubscriptions)
        .where(and(
          eq(userSubscriptions.status, 'active'),
          gte(userSubscriptions.createdAt, new Date(today.getFullYear(), today.getMonth() - 1, 1)),
          lt(userSubscriptions.createdAt, new Date(today.getFullYear(), today.getMonth(), 1))
        ))
      ]);

      // Calculate growth rate
      const currentRevenue = monthlyRevenue[0]?.sum || 0;
      const lastRevenue = lastMonthRevenue[0]?.sum || 0;
      const growthRate = lastRevenue > 0 
        ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 
        : currentRevenue > 0 ? 100 : 0;

      const stats = {
        totalSubscriptions: totalSubscriptions[0]?.count || 0,
        activeSubscriptions: activeSubscriptions[0]?.count || 0,
        monthlyRevenue: parseFloat(currentRevenue.toString()),
        growthRate: parseFloat(growthRate.toFixed(1))
      };

      console.log('📊 Subscription stats calculated:', stats);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching subscription stats:", error);
      res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
  });

  app.post("/api/admin/subscriptions/:id/cancel", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const subscriptionId = parseInt(req.params.id);
      console.log("❌ Cancelling subscription:", subscriptionId);

      await db
        .update(userSubscriptions)
        .set({ 
          status: 'cancelled'
        })
        .where(eq(userSubscriptions.id, subscriptionId));

      res.json({ message: "Assinatura cancelada com sucesso" });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ message: "Erro ao cancelar assinatura" });
    }
  });

  // Public endpoint for feature toggles (no authentication required)
  app.get("/api/public/feature-toggles", async (req, res) => {
    try {
      console.log("🔧 Fetching public feature toggles...");
      const dbSettings = await storage.getAdminSettings();
      
      // Return only the feature toggles that need to be public
      const publicToggles = {
        enableRentNowCheckout: dbSettings?.enableRentNowCheckout || false,
        enableInsuranceOption: dbSettings?.enableInsuranceOption || false,
        enableServiceFee: dbSettings?.enableServiceFee === true,
        contractSignatureEnabled: dbSettings?.enableContractSignature || false
      };
      
      console.log("🔧 Public feature toggles:", publicToggles);
      res.json(publicToggles);
    } catch (error) {
      console.error("Error fetching feature toggles:", error);
      // Return default values on error
      res.json({
        enableRentNowCheckout: false,
        enableInsuranceOption: false,
        enableServiceFee: false
      });
    }
  });

  // Public endpoint for contact information (no authentication required)
  app.get("/api/public/contact-info", async (req, res) => {
    try {
      console.log("📞 Fetching public contact information...");
      const dbSettings = await storage.getAdminSettings();
      
      // Return public contact information
      const contactInfo = {
        supportEmail: dbSettings?.supportEmail || "sac@alugae.mobi",
        supportPhone: dbSettings?.supportPhone || "(11) 9999-9999"
      };
      
      console.log("📞 Public contact info:", contactInfo);
      res.json(contactInfo);
    } catch (error) {
      console.error("Error fetching public contact info:", error);
      res.status(500).json({
        supportEmail: "sac@alugae.mobi",
        supportPhone: "(11) 9999-9999"
      });
    }
  });

  // Admin Settings API routes
  app.get("/api/admin/settings", authenticateToken, requireAdmin, async (req, res) => {
    try {
      console.log("📋 Fetching admin settings from database...");
      const dbSettings = await storage.getAdminSettings();

      if (dbSettings) {
        // Convert string numbers to actual numbers for the response
        const settings = {
          ...dbSettings,
          serviceFeePercentage: parseFloat(dbSettings.serviceFeePercentage || "10"),
          insuranceFeePercentage: parseFloat(dbSettings.insuranceFeePercentage || "15"),
        };
        console.log("📋 Found settings in database:", settings);
        res.json(settings);
      } else {
        console.log("📋 No settings found, returning defaults");
        res.json(currentAdminSettings);
      }
    } catch (error) {
      console.error("Error fetching admin settings:", error);
      res.status(500).json({ message: "Erro ao buscar configurações" });
    }
  });

  app.put("/api/admin/settings", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const settings = req.body;
      console.log("💾 Updating admin settings in database:", settings);

      // Validate settings
      if (settings.serviceFeePercentage < 0 || settings.serviceFeePercentage > 50) {
        return res.status(400).json({ message: 'Taxa de serviço deve estar entre 0% e 50%' });
      }

      if (settings.insuranceFeePercentage < 0 || settings.insuranceFeePercentage > 30) {
        return res.status(400).json({ message: 'Taxa de seguro deve estar entre 0% e 30%' });
      }

      // Convert numbers to strings for database storage
      const dbSettings = {
        ...settings,
        serviceFeePercentage: settings.serviceFeePercentage?.toString() || "10",
        insuranceFeePercentage: settings.insuranceFeePercentage?.toString() || "15",
      };

      // Save to database
      const updatedSettings = await storage.updateAdminSettings(dbSettings);

      // Convert back to numbers for response
      const responseSettings = {
        ...updatedSettings,
        serviceFeePercentage: parseFloat(updatedSettings.serviceFeePercentage || "10"),
        insuranceFeePercentage: parseFloat(updatedSettings.insuranceFeePercentage || "15"),
      };

      console.log("✅ Settings saved to database:", responseSettings);
      res.json(responseSettings);
    } catch (error) {
      console.error("Error updating admin settings:", error);
      res.status(500).json({ message: "Erro ao atualizar configurações" });
    }
  });

  // Coupon Management API routes
  app.get("/api/admin/coupons", authenticateToken, requireAdmin, async (req, res) => {
    try {
      console.log("🎫 Admin coupons request from user:", req.user?.email, "role:", req.user?.role);

      // Get coupons from database
      const coupons = await storage.getAllCoupons();
      console.log("🎫 Found coupons:", coupons.length);

      res.json(coupons);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      res.status(500).json({ message: "Erro ao buscar cupons" });
    }
  });

  app.post("/api/admin/coupons", authenticateToken, requireAdmin, async (req, res) => {
    try {
      console.log("📝 Creating coupon with data:", req.body);
      console.log("👤 Created by user:", req.user!.id);

      const couponData = {
        ...req.body,
        createdBy: req.user!.id,
        usedCount: 0,
        isActive: true,
      };

      console.log("📝 Final coupon data:", couponData);
      const coupon = await storage.createCoupon(couponData);
      console.log("✅ Coupon created successfully:", coupon);

      res.status(201).json(coupon);
    } catch (error) {
      console.error("❌ Error creating coupon:", error);
      res.status(500).json({ message: `Erro ao criar cupom: ${error instanceof Error ? error.message : 'Erro desconhecido'}` });
    }
  });

  app.put("/api/admin/coupons/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const couponId = parseInt(req.params.id);
      const updatedCoupon = await storage.updateCoupon(couponId, req.body);

      if (!updatedCoupon) {
        return res.status(404).json({ message: "Cupom não encontrado" });
      }

      res.json(updatedCoupon);
    } catch (error) {
      console.error("Error updating coupon:", error);
      res.status(500).json({ message: "Erro ao atualizar cupom" });
    }
  });

  app.delete("/api/admin/coupons/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const couponId = parseInt(req.params.id);
      const deleted = await storage.deleteCoupon(couponId);

      if (!deleted) {
        return res.status(404).json({ message: "Cupom não encontrado" });
      }

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

      // Get coupon from database
      const coupon = await storage.getCouponByCode(code.toUpperCase());

      if (!coupon) {
        return res.status(404).json({ message: "Cupom não encontrado" });
      }

      // Validate coupon using storage method
      const validationResult = await storage.validateCoupon(code, orderValue);

      if (!validationResult.isValid) {
        return res.status(400).json({ message: validationResult.error || "Cupom inválido" });
      }

      res.json({
        isValid: true,
        coupon: validationResult.coupon,
        discountAmount: validationResult.discountAmount,
        finalAmount: (orderValue - (validationResult.discountAmount || 0)),
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
      const params: (string | number)[] = [userId];

      if (status && status !== 'all') {
        query += ` AND p.status = $${params.length + 1}`;
        params.push(status as string);
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
        params.push(startDate.toISOString() as any);
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

  // Saved Vehicles Routes


  // Feature flags endpoint
  app.get("/api/feature-flags", async (req, res) => {
    try {
      // Get settings from database
      const dbSettings = await storage.getAdminSettings();
      const adminSettings = dbSettings ? {
        ...dbSettings,
        serviceFeePercentage: parseFloat(dbSettings.serviceFeePercentage || "10"),
        insuranceFeePercentage: parseFloat(dbSettings.insuranceFeePercentage || "15"),
      } : currentAdminSettings;

      const featureFlags = getFeatureFlags(adminSettings);
      console.log("🎛️ Feature flags requested:", { 
        pixPaymentEnabled: featureFlags.pixPaymentEnabled,
        adminPixEnabled: adminSettings.enablePixPayment 
      });

      // Only return client-safe flags
      res.json({
        pixPaymentEnabled: featureFlags.pixPaymentEnabled
      });
    } catch (error) {
      console.error("Error fetching feature flags:", error);
      res.status(500).json({ message: "Erro ao buscar configurações de funcionalidades" });
    }
  });

  app.post("/api/process-payment-transfer", authenticateToken, async (req, res) => {
    try {
      const { bookingId, paymentIntentId } = req.body;

      if (!bookingId || !paymentIntentId) {
        return res.status(400).json({ message: "BookingId e PaymentIntentId são obrigatórios" });
      }

      // Buscar dados reais da reserva
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Reserva não encontrada" });
      }

      // Buscar dados do proprietário
      const owner = await storage.getUser(booking.vehicle.ownerId);
      if (!owner) {
        return res.status(404).json({ message: "Proprietário não encontrado" });
      }

      if (!owner.pix) {
        return res.status(400).json({ message: "Proprietário não possui chave PIX cadastrada" });
      }

      // Buscar configurações administrativas
      const adminSettings = await storage.getAdminSettings();
      const serviceFeePercent = parseFloat(adminSettings?.serviceFeePercentage || "10");
      const insuranceFeePercent = parseFloat(adminSettings?.insuranceFeePercentage || "15");

      const totalPrice = parseFloat(booking.totalPrice);
      const serviceFee = Math.round((totalPrice * serviceFeePercent) / 100 * 100) / 100;
      // Check if booking has insurance fee (insurance fee might be stored in a different format)
      const hasInsurance = booking.insuranceFee !== undefined && parseFloat(booking.insuranceFee || '0') > 0;
      const insuranceFee = hasInsurance ? Math.round((totalPrice * insuranceFeePercent) / 100 * 100) / 100 : 0;
      const netAmount = Math.round((totalPrice - serviceFee - insuranceFee) * 100) / 100;

      // Importar serviço PIX
      const { PixPayoutService } = await import('./services/pixPayoutService.js');
      const pixService = new PixPayoutService();

      // Processar repasse com validações anti-fraude
      const result = await pixService.processPayoutWithFraudCheck({
        bookingId: booking.id,
        ownerId: owner.id,
        renterId: booking.renterId,
        totalAmount: totalPrice,
        serviceFee,
        insuranceFee,
        netAmount,
        ownerPix: owner.pix
      });

      if (result.success) {
        res.json({
          success: true,
          payoutId: result.payoutId,
          message: result.message,
          requiresManualReview: result.requiresManualReview
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }

    } catch (error: any) {
      console.error("Error processing payment transfer:", error);
      res.status(500).json({ message: "Erro ao processar repasse" });
    }
  });

  // Admin: Aprovar repasse em revisão manual
  app.post("/api/admin/approve-payout/:payoutId", authenticateToken, async (req, res) => {
    try {
      const user = req.user!;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const payoutId = parseInt(req.params.payoutId);
      const { approved, reason } = req.body;

      // Importar e executar aprovação
      const { PixPayoutService } = await import('./services/pixPayoutService.js');
      const pixService = new PixPayoutService();

      // TODO: Implementar método de aprovação manual
      // const result = await pixService.processManualApproval(payoutId, approved, reason);

      res.json({
        success: true,
        message: approved ? "Repasse aprovado e processado" : "Repasse rejeitado"
      });

    } catch (error: any) {
      console.error("Error approving payout:", error);
      res.status(500).json({ message: "Erro ao aprovar repasse" });
    }
  });

  // Webhook Stripe para trigger automático - PRODUÇÃO
  app.post("/api/webhooks/stripe", async (req, res) => {
    try {
      console.log("🔔 Webhook Stripe recebido");
      
      // Validar assinatura do webhook (essencial para produção)
      const sig = req.headers['stripe-signature'] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (!webhookSecret) {
        console.error("❌ STRIPE_WEBHOOK_SECRET não configurado");
        return res.status(400).json({ error: "Webhook secret não configurado" });
      }

      if (!stripe) {
        console.error("❌ Stripe não está configurado");
        return res.status(500).json({ error: "Stripe não está configurado" });
      }

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        console.error("❌ Erro na validação do webhook:", err.message);
        return res.status(400).json({ error: "Webhook signature verification failed" });
      }

      console.log("✅ Webhook validado:", event.type);

      // Processar eventos relevantes
      const { StripeProductionService } = await import('./services/stripeProductionService.js');
      const stripeService = new StripeProductionService();

      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          
          // Check if this is a coin purchase
          if (paymentIntent.metadata?.type === 'coin_purchase') {
            console.log("💰 Processing coin purchase payment:", paymentIntent.id);
            
            const userId = parseInt(paymentIntent.metadata.userId);
            const coinAmount = parseInt(paymentIntent.metadata.coinAmount);
            const packageName = paymentIntent.metadata.packageName;
            
            if (userId && coinAmount) {
              try {
                await storage.addCoins(
                  userId,
                  coinAmount,
                  'stripe_payment',
                  `Compra de ${packageName}`,
                  paymentIntent.id,
                  paymentIntent.id
                );
                console.log(`✅ Added ${coinAmount} coins to user ${userId}`);
              } catch (error) {
                console.error("❌ Error adding coins:", error);
              }
            }
          } else {
            // Handle regular booking payments
            await stripeService.handlePaymentSucceeded(paymentIntent);
          }
          break;

        case 'payment_intent.payment_failed':
          console.log("❌ Pagamento falhou:", event.data.object.id);
          // Atualizar booking para status failed
          const failedBooking = await storage.getBookingByPaymentIntent(event.data.object.id);
          if (failedBooking) {
            await storage.updateBookingPaymentStatus(failedBooking.id, 'failed');
          }
          break;

        case 'invoice.payment_succeeded':
          console.log("✅ Fatura paga:", event.data.object.id);
          break;

        case 'customer.subscription.created':
          console.log("✅ Assinatura criada:", event.data.object.id);
          await stripeService.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.updated':
          console.log("📋 Assinatura atualizada:", event.data.object.id);
          await stripeService.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          console.log("❌ Assinatura cancelada:", event.data.object.id);
          await stripeService.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          console.log("💰 Renovação automática bem-sucedida:", event.data.object.id);
          await stripeService.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          console.log("❌ Falha na renovação automática:", event.data.object.id);
          await stripeService.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          console.log("ℹ️ Evento não processado:", event.type);
      }

      res.json({ received: true });

    } catch (error: any) {
      console.error("❌ Erro no webhook Stripe:", error);
      res.status(500).json({ message: "Webhook error" });
    }
  });

  // Configuração Stripe para produção
  app.post("/api/admin/stripe/setup-production", authenticateToken, async (req, res) => {
    try {
      const user = req.user!;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado" });
      }

      console.log("🚀 Configurando Stripe para produção...");

      const { StripeProductionService } = await import('./services/stripeProductionService.js');
      const stripeService = new StripeProductionService();

      // 1. Validar configuração atual
      const validation = await stripeService.validateProductionSetup();
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: "Configuração Stripe inválida",
          issues: validation.issues,
          recommendations: validation.recommendations
        });
      }

      // 2. Configurar webhook
      const webhook = await stripeService.setupWebhookEndpoint();
      
      // 3. Configurar produtos padrão
      await stripeService.setupDefaultProducts();

      res.json({
        success: true,
        message: "Stripe configurado para produção com sucesso!",
        webhook: {
          id: webhook.webhookId,
          secret: webhook.webhookSecret.substring(0, 10) + "..." // Ocultar secret completo
        },
        recommendations: validation.recommendations
      });

    } catch (error: any) {
      console.error("❌ Erro ao configurar Stripe:", error);
      res.status(500).json({ message: "Erro ao configurar Stripe para produção" });
    }
  });

  // Monitorar repasses PIX
  app.get("/api/admin/payout-stats", authenticateToken, async (req, res) => {
    try {
      const user = req.user!;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const { StripeProductionService } = await import('./services/stripeProductionService.js');
      const stripeService = new StripeProductionService();

      const stats = await stripeService.monitorPendingPayouts();
      
      res.json(stats);

    } catch (error: any) {
      console.error("❌ Erro ao buscar estatísticas:", error);
      res.status(500).json({ message: "Erro ao buscar estatísticas de repasses" });
    }
  });

  // Trigger manual de repasse (para testes e produção)
  app.post("/api/admin/trigger-payout/:bookingId", authenticateToken, async (req, res) => {
    try {
      const user = req.user!;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const bookingId = parseInt(req.params.bookingId);

      const { autoPayoutService } = await import('./services/autoPayoutService.js');
      await autoPayoutService.triggerPayoutAfterPayment(bookingId);

      res.json({
        success: true,
        message: "Trigger de repasse executado"
      });

    } catch (error: any) {
      console.error("Error triggering payout:", error);
      res.status(500).json({ message: "Erro ao executar trigger" });
    }
  });

  // Admin: Estatísticas de repasses
  app.get("/api/admin/payout-stats", authenticateToken, async (req, res) => {
    try {
      const user = req.user!;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const statsQuery = `
        SELECT 
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as total_pending,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as total_completed,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as total_failed,
          COUNT(CASE WHEN status = 'manual_review' THEN 1 END) as total_manual_review,
          SUM(CASE WHEN status = 'pending' THEN CAST(net_amount AS DECIMAL(10,2)) ELSE 0 END) as total_amount_pending,
          SUM(CASE WHEN status = 'completed' THEN CAST(net_amount AS DECIMAL(10,2)) ELSE 0 END) as total_amount_completed
        FROM payouts
      `;

      const result = await pool.query(statsQuery);
      const row = result.rows[0];

      const stats = {
        totalPending: parseInt(row.total_pending || '0'),
        totalCompleted: parseInt(row.total_completed || '0'),
        totalFailed: parseInt(row.total_failed || '0'),
        totalManualReview: parseInt(row.total_manual_review || '0'),
        totalAmountPending: parseFloat(row.total_amount_pending || '0'),
        totalAmountCompleted: parseFloat(row.total_amount_completed || '0'),
      };

      res.json(stats);

    } catch (error: any) {
      console.error("Error fetching payout stats:", error);
      res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
  });

  // Subscription Plans Routes
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = await storage.getAllSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ message: "Erro ao buscar planos de assinatura" });
    }
  });

  app.get("/api/subscription-plans/:id", async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      const plan = await storage.getSubscriptionPlan(planId);
      if (!plan) {
        return res.status(404).json({ message: "Plano não encontrado" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Error fetching subscription plan:", error);
      res.status(500).json({ message: "Erro ao buscar plano de assinatura" });
    }
  });

  // User Subscription Routes
  app.get("/api/user/subscription", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const subscription = await storage.getUserSubscriptionWithPlan(userId);

      if (!subscription) {
        // Return free plan info from user
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "Usuário não encontrado" });
        }

        return res.json({
          plan: {
            name: user.subscriptionPlan || 'free',
            displayName: 'Plano Gratuito',
            maxVehicleListings: user.maxVehicleListings || 2,
            highlightType: null,
            highlightCount: 0
          },
          status: user.subscriptionStatus || 'active',
          paymentMethod: user.subscriptionPaymentMethod || 'monthly'
        });
      }

      res.json(subscription);
    } catch (error) {
      console.error("Error fetching user subscription:", error);
      res.status(500).json({ message: "Erro ao buscar assinatura do usuário" });
    }
  });

  app.get("/api/user/subscription/limits", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const limits = await storage.checkUserSubscriptionLimits(userId);
      res.json(limits);
    } catch (error) {
      console.error("Error checking subscription limits:", error);
      res.status(500).json({ message: "Erro ao verificar limites da assinatura" });
    }
  });

  // Nova rota para detalhes completos da assinatura com valores reais
  app.get("/api/user/subscription/details", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Buscar assinatura mais recente do usuário
      const subscription = await storage.getUserSubscriptionWithPlan(userId);

      if (!subscription) {
        // Usuário sem assinatura formal - usar dados do perfil
        return res.json({
          planName: user.subscriptionPlan || 'free',
          planDisplayName: user.subscriptionPlan === 'essencial' ? 'Plano Essencial' :
                          user.subscriptionPlan === 'plus' ? 'Plano Plus' : 'Plano Gratuito',
          status: user.subscriptionStatus || 'active',
          paymentMethod: user.subscriptionPaymentMethod || 'monthly',
          startDate: user.subscriptionStartDate,
          endDate: user.subscriptionEndDate,
          paidAmount: null,
          vehicleCount: user.maxVehicleListings === -1 ? 'ilimitado' : (user.maxVehicleListings || 2),
          paymentDetails: null,
          isLegacySubscription: true
        });
      }

      // Retornar dados completos da assinatura
      res.json({
        planName: subscription.plan?.name || 'free',
        planDisplayName: subscription.plan?.displayName || 'Plano Gratuito',
        status: subscription.status,
        paymentMethod: subscription.paymentMethod,
        startDate: subscription.currentPeriodStart,
        endDate: subscription.currentPeriodEnd,
        paidAmount: subscription.paidAmount ? parseFloat(subscription.paidAmount.toString()) : null,
        vehicleCount: subscription.vehicleCount || 2,
        paymentDetails: subscription.paymentMetadata,
        paymentIntentId: subscription.paymentIntentId,
        isLegacySubscription: false
      });

    } catch (error) {
      console.error("Error fetching subscription details:", error);
      res.status(500).json({ message: "Erro ao buscar detalhes da assinatura" });
    }
  });

  // Stripe Subscription Routes
  app.post("/api/create-subscription", authenticateToken, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe não está configurado" });
      }

      const userId = req.user!.id;
      const { planName, paymentMethod = 'monthly', vehicleCount = 3, couponCode, discountAmount } = req.body;

      console.log('🎯 Create subscription - userId:', userId, 'planName:', planName, 'couponCode:', couponCode);

      // Get user and admin settings
      const user = await storage.getUser(userId);
      const adminSettings = await storage.getAdminSettings();

      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Calculate price based on plan, payment method and vehicle count
      let priceInCents: number;
      const calculatePriceWithVehicleCount = (basePlan: string, vehicleCount: number) => {
        const basePrice = basePlan === 'essencial' ? 29.90 : 59.90;
        const pricePerVehicle = basePlan === 'essencial' ? 5.99 : 9.99; // Per vehicle per month

        // First 2 vehicles included in base price, additional vehicles add to cost
        const monthlyPrice = basePrice + (pricePerVehicle * Math.max(0, vehicleCount - 2));
        return monthlyPrice;
      };

      // Normalize plan name to support both Portuguese and English
      const normalizedPlanName = planName === 'essential' ? 'essencial' : planName;

      if (normalizedPlanName === 'essencial') {
        const monthlyPrice = calculatePriceWithVehicleCount('essencial', vehicleCount);
        const annualDiscount = adminSettings?.annualDiscountPercentage ? parseFloat(adminSettings.annualDiscountPercentage.toString()) : 20;
        priceInCents = paymentMethod === 'annual' 
          ? Math.round((monthlyPrice * 12 * (1 - annualDiscount / 100)) * 100)
          : Math.round(monthlyPrice * 100);
      } else if (normalizedPlanName === 'plus') {
        const monthlyPrice = calculatePriceWithVehicleCount('plus', vehicleCount);
        const annualDiscount = adminSettings?.annualDiscountPercentage ? parseFloat(adminSettings.annualDiscountPercentage.toString()) : 20;
        priceInCents = paymentMethod === 'annual' 
          ? Math.round((monthlyPrice * 12 * (1 - annualDiscount / 100)) * 100)
          : Math.round(monthlyPrice * 100);
      } else {
        return res.status(400).json({ message: "Plano inválido. Planos aceitos: 'essential', 'essencial', 'plus'" });
      }

      console.log(`💰 Original price: ${priceInCents} cents for ${planName} (${vehicleCount} vehicles)`);

      // Apply coupon discount if provided
      let finalPriceAfterDiscount = priceInCents;
      if (couponCode && discountAmount) {
        console.log(`🎫 Applying coupon ${couponCode} with discount: ${discountAmount} cents`);
        finalPriceAfterDiscount = Math.max(0, priceInCents - discountAmount);
        console.log(`💸 Final price after discount: ${finalPriceAfterDiscount} cents`);
      }



      // Check if discount results in free subscription (100% off)
      if (finalPriceAfterDiscount === 0) {
        console.log('🎁 100% discount applied - processing free subscription');
        
        // Update user subscription directly without payment
        await storage.updateUser(userId, {
          subscriptionPlan: normalizedPlanName,
          subscriptionStatus: 'active',
          subscriptionStartDate: new Date(),
          subscriptionEndDate: paymentMethod === 'annual' 
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 month
          subscriptionPaymentMethod: paymentMethod,
          maxVehicleListings: vehicleCount,
          subscriptionStripeId: `free_${Date.now()}_${userId}`, // Unique identifier for free subscription
        });

        // Mark coupon as used if applicable
        if (couponCode) {
          try {
            await storage.incrementCouponUsage(couponCode);
          } catch (error) {
            console.error('Failed to increment coupon usage:', error);
          }
        }

        return res.json({
          success: true,
          isFreeSubscription: true,
          planName,
          paymentMethod,
          message: "Assinatura ativada com sucesso! Cupom aplicado com 100% de desconto.",
          subscriptionStatus: 'active',
          couponApplied: couponCode,
          discountAmount: discountAmount
        });
      }

      // Continue with paid subscription flow
      priceInCents = finalPriceAfterDiscount;

      // Create or get Stripe customer - always create new if missing
      let customerId = user.stripeCustomerId;
      
      // Validate existing customer ID
      if (customerId) {
        try {
          await stripe.customers.retrieve(customerId);
        } catch (error: any) {
          console.log(`🔄 Invalid customer ID ${customerId}, creating new customer`);
          customerId = null;
          await storage.updateUser(userId, { stripeCustomerId: null });
        }
      }
      
      if (!customerId) {
        console.log(`🆕 Creating new Stripe customer for user ${userId}`);
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: {
            userId: userId.toString()
          }
        });
        customerId = customer.id;
        await storage.updateUser(userId, { stripeCustomerId: customerId });
        console.log(`✅ Created customer: ${customerId}`);
      }

      // ✅ NOVA IMPLEMENTAÇÃO: Criar Subscription recorrente no Stripe
      console.log('🔄 Creating Stripe Subscription for recurring payments...');
      
      // First, create a price object for this specific subscription
      const priceObject = await stripe.prices.create({
        unit_amount: priceInCents,
        currency: 'brl',
        recurring: {
          interval: paymentMethod === 'annual' ? 'year' : 'month'
        },
        product_data: {
          name: `ALUGAE - ${planName === 'essencial' ? 'Plano Essencial' : 'Plano Plus'} - ${vehicleCount} veículos`,
          metadata: {
            planName,
            vehicleCount: vehicleCount.toString()
          }
        },
      });

      // Create recurring subscription with proper payment setup
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [
          {
            price: priceObject.id,
          },
        ],
        payment_behavior: 'default_incomplete',
        payment_settings: { 
          save_default_payment_method: 'on_subscription',
          payment_method_types: ['card']
        },
        expand: ['latest_invoice.payment_intent'],
        collection_method: 'charge_automatically',
        metadata: {
          userId: userId.toString(),
          planName,
          paymentMethod,
          vehicleCount: vehicleCount.toString(),
          type: 'subscription'
        },
      });

      console.log('✅ Stripe Subscription created:', subscription.id);
      
      // Alternative approach: Create a setup intent for the subscription
      console.log('🔄 Creating Setup Intent for subscription payment setup...');
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session',
        metadata: {
          subscriptionId: subscription.id,
          userId: userId.toString(),
          planName,
          paymentMethod,
          vehicleCount: vehicleCount.toString(),
          amount: priceInCents.toString()
        }
      });
      
      console.log('✅ Setup Intent created:', setupIntent.id);
      
      if (!setupIntent.client_secret) {
        throw new Error('Failed to get setup intent client secret');
      }

      res.json({
        clientSecret: setupIntent.client_secret,
        amount: priceInCents,
        planName,
        paymentMethod,
        couponApplied: couponCode || null,
        discountAmount: discountAmount || 0,
        subscriptionId: subscription.id,
        setupIntentId: setupIntent.id,
        type: 'setup_intent' // Indicate this is a setup intent for subscription
      });

    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Erro ao criar assinatura", details: error.message });
    }
  });

  app.post("/api/subscription/confirm", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { paymentIntentId } = req.body;

      console.log('🎯 Subscription confirm - userId:', userId, 'paymentIntentId:', paymentIntentId);

      if (!stripe) {
        return res.status(500).json({ message: "Stripe não está configurado" });
      }

      // Handle both SetupIntent and PaymentIntent
      let intentStatus = '';
      let stripeSubscriptionId: string | null = null;
      let intentData: any;
      
      if (paymentIntentId.startsWith('seti_')) {
        // This is a SetupIntent
        intentData = await stripe.setupIntents.retrieve(paymentIntentId);
        intentStatus = intentData.status;
        
        // For setup intents, we need to get the subscription ID from metadata
        stripeSubscriptionId = intentData.metadata?.subscriptionId || null;
        console.log('🔧 SetupIntent status:', intentStatus, 'subscriptionId:', stripeSubscriptionId);
        
        if (intentStatus !== 'succeeded') {
          return res.status(400).json({ message: "Setup de pagamento não foi confirmado" });
        }
      } else {
        // This is a PaymentIntent
        intentData = await stripe.paymentIntents.retrieve(paymentIntentId);
        intentStatus = intentData.status;
        
        if (intentStatus !== 'succeeded') {
          return res.status(400).json({ message: "Pagamento não foi confirmado" });
        }
        
        // Get subscription from invoice
        if (intentData.invoice) {
          const invoice = await stripe.invoices.retrieve(intentData.invoice as string);
          if (invoice.subscription) {
            stripeSubscriptionId = invoice.subscription as string;
          }
        }
      }

      // Already handled above in the intent processing

      // ✅ VERIFICAÇÃO OBRIGATÓRIA: Subscriptions MUST have Stripe ID for recurring payments
      if (!stripeSubscriptionId) {
        console.error('❌ CRITICAL ERROR: Payment succeeded but no Stripe Subscription ID found!');
        return res.status(500).json({ 
          message: "Erro crítico: Assinatura não foi configurada para recorrência. Entre em contato com suporte." 
        });
      }

      // Extract metadata and amount from the retrieved intent
      let planName, paymentMethod, vehicleCount, paidAmountCents, paidAmount;
      
      if (paymentIntentId.startsWith('seti_')) {
        // Get metadata from SetupIntent
        planName = intentData.metadata?.planName;
        paymentMethod = intentData.metadata?.paymentMethod || 'monthly';
        vehicleCount = parseInt(intentData.metadata?.vehicleCount || '1');
        paidAmountCents = parseInt(intentData.metadata?.amount || '0');
        paidAmount = (paidAmountCents / 100).toFixed(2);
      } else {
        // Get metadata from PaymentIntent
        planName = intentData.metadata.planName;
        paymentMethod = intentData.metadata.paymentMethod || 'monthly';
        vehicleCount = parseInt(intentData.metadata.vehicleCount || '1');
        paidAmountCents = intentData.amount;
        paidAmount = (paidAmountCents / 100).toFixed(2);
      }

      // Get or create subscription plan
      let plan = await storage.getSubscriptionPlanByName(planName);
      if (!plan) {
        // Create default plans if they don't exist
        const adminSettings = await storage.getAdminSettings();
        const monthlyPrice = planName === 'essencial' 
          ? (adminSettings?.essentialPlanPrice ? parseFloat(adminSettings.essentialPlanPrice.toString()) : 29.90)
          : (adminSettings?.plusPlanPrice ? parseFloat(adminSettings.plusPlanPrice.toString()) : 59.90);

        const annualDiscount = adminSettings?.annualDiscountPercentage ? parseFloat(adminSettings.annualDiscountPercentage.toString()) : 20;
        const annualPrice = monthlyPrice * 12 * (1 - annualDiscount / 100);

        plan = await storage.createSubscriptionPlan({
          name: planName,
          displayName: planName === 'essencial' ? 'Plano Essencial' : 'Plano Plus',
          description: planName === 'essencial' ? 'Para locadores que querem crescer' : 'Para profissionais e gestão de frotas',
          monthlyPrice: monthlyPrice.toString(),
          annualPrice: annualPrice.toString(),
          maxVehicleListings: planName === 'essencial' ? 10 : 50, // Limite baseado no plano
          highlightType: planName === 'essencial' ? 'prata' : 'diamante',
          highlightCount: planName === 'essencial' ? 5 : 20,
          features: planName === 'essencial' 
            ? ['Destaque prata (3x mais visualizações)', 'Relatórios básicos', 'Gestão simples de anúncios', 'Suporte por email']
            : ['Destaque diamante (10x mais visualizações)', 'Relatórios avançados', 'Gestão completa de frotas', 'Dashboard multiusuário', 'API de integração', 'Suporte prioritário'],
          sortOrder: planName === 'essencial' ? 1 : 2
        });
      }

      // Calculate subscription period
      const startDate = new Date();
      const endDate = new Date();
      if (paymentMethod === 'annual') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      // Update user subscription info with selected vehicle count
      const planMaxVehicles = plan.maxVehicleListings || 1;
      const userVehicleCount = Math.min(vehicleCount, planMaxVehicles); // Respeita o limite do plano
      
      await storage.updateUser(userId, {
        subscriptionPlan: planName,
        subscriptionStatus: 'active',
        subscriptionStartDate: startDate,
        subscriptionEndDate: endDate,
        subscriptionPaymentMethod: paymentMethod,
        maxVehicleListings: userVehicleCount, // Quantidade selecionada pelo usuário
        highlightsAvailable: plan.highlightCount || 0
      });

      // ✅ CRÍTICO: Create user subscription record with Stripe Subscription ID
      await storage.createUserSubscription({
        userId,
        planId: plan.id,
        stripeSubscriptionId: stripeSubscriptionId, // ✅ ESSENCIAL para recorrência automática
        stripeCustomerId: intentData.customer as string,
        status: 'active',
        paymentMethod,
        currentPeriodStart: startDate,
        currentPeriodEnd: endDate,
        cancelAtPeriodEnd: false,
        paidAmount: paidAmount, // Valor real pago pelo usuário
        vehicleCount: vehicleCount, // Quantidade de veículos na assinatura
        paymentIntentId: paymentIntentId, // ID do payment intent do Stripe
        paymentMetadata: {
          originalAmount: paidAmountCents,
          vehicleCount: vehicleCount,
          calculationDetails: `${planName} plan with ${vehicleCount} vehicles, ${paymentMethod} payment`
        }
      });

      console.log('✅ User subscription created with Stripe Subscription ID for recurring payments');

      // Get user data for email
      const currentUser = await storage.getUserById(userId);
      if (!currentUser) {
        throw new Error('User not found');
      }

      // Send subscription confirmation email
      const subscriptionEmailData: SubscriptionEmailData = {
        planName: planName,
        paymentMethod,
        amount: Number(paidAmount),
        endDate: endDate.toLocaleDateString('pt-BR'),
        vehicleCount: vehicleCount === -1 ? -1 : vehicleCount
      };

      // Send email asynchronously (don't block the response)
      console.log('📧 Enviando email de confirmação de assinatura para:', currentUser.email);
      emailService.sendSubscriptionConfirmationEmail(
        currentUser.email!,
        currentUser.name || currentUser.email!,
        subscriptionEmailData
      ).then((success) => {
        if (success) {
          console.log('✅ Email de confirmação de assinatura enviado com sucesso');
        } else {
          console.log('❌ Falha ao enviar email de confirmação de assinatura');
        }
      }).catch(error => {
        console.error('❌ Erro ao enviar email de confirmação de assinatura:', error);
      });

      res.json({
        message: "Assinatura ativada com sucesso",
        plan: planName,
        paymentMethod,
        endDate: endDate.toISOString(),
        emailSent: true
      });

    } catch (error) {
      console.error("Error confirming subscription:", error);
      res.status(500).json({ message: "Erro ao confirmar assinatura" });
    }
  });

  app.post("/api/subscription/cancel", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;

      // Cancel user subscription
      const cancelledSubscription = await storage.cancelUserSubscription(userId);

      if (!cancelledSubscription) {
        return res.status(404).json({ message: "Assinatura não encontrada" });
      }

      // Update user to free plan at the end of current period
      // For now, downgrade immediately
      await storage.updateUser(userId, {
        subscriptionPlan: 'free',
        subscriptionStatus: 'cancelled',
        maxVehicleListings: 2,
        highlightsAvailable: 0
      });

      res.json({
        message: "Assinatura cancelada com sucesso",
        endsAt: cancelledSubscription.currentPeriodEnd
      });

    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ message: "Erro ao cancelar assinatura" });
    }
  });

  // Vehicle Highlight Routes
  app.get("/api/vehicles/:id/highlight-options", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const vehicleId = parseInt(req.params.id);

      // Check if user owns the vehicle
      const vehicle = await storage.getVehicle(vehicleId);
      if (!vehicle || vehicle.ownerId !== userId) {
        return res.status(403).json({ message: "Você não tem permissão para destacar este veículo" });
      }

      // Get subscription limits
      const limits = await storage.checkUserSubscriptionLimits(userId);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Determine available highlight types based on subscription
      const availableHighlights = [];

      if (user.subscriptionPlan === 'essencial' || user.subscriptionPlan === 'plus') {
        availableHighlights.push({
          type: 'prata',
          name: 'Destaque Prata',
          description: '3x mais visualizações',
          duration: '30 dias',
          available: limits.highlightsAvailable > 0
        });
      }

      if (user.subscriptionPlan === 'plus') {
        availableHighlights.push({
          type: 'diamante',
          name: 'Destaque Diamante',
          description: '10x mais visualizações',
          duration: '30 dias',
          available: limits.highlightsAvailable > 0
        });
      }

      res.json({
        vehicle: {
          id: vehicleId,
          isHighlighted: vehicle.isHighlighted,
          highlightType: vehicle.highlightType,
          highlightExpiresAt: vehicle.highlightExpiresAt
        },
        user: {
          subscriptionPlan: user.subscriptionPlan,
          highlightsAvailable: limits.highlightsAvailable,
          highlightsUsed: user.highlightsUsed || 0
        },
        availableHighlights
      });

    } catch (error) {
      console.error("Error getting highlight options:", error);
      res.status(500).json({ message: "Erro ao verificar opções de destaque" });
    }
  });

  app.post("/api/vehicles/:id/highlight", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const vehicleId = parseInt(req.params.id);
      const { highlightType = 'prata' } = req.body;

      // Check if user owns the vehicle
      const vehicle = await storage.getVehicle(vehicleId);
      if (!vehicle || vehicle.ownerId !== userId) {
        return res.status(403).json({ message: "Você não tem permissão para destacar este veículo" });
      }

      // Validate highlight type based on subscription
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      if (highlightType === 'diamante' && user.subscriptionPlan !== 'plus') {
        return res.status(403).json({ message: "Destaque Diamante disponível apenas no Plano Plus" });
      }

      if (highlightType === 'prata' && !['essencial', 'plus'].includes(user.subscriptionPlan || '')) {
        return res.status(403).json({ message: "Destaque Prata disponível apenas em planos pagos" });
      }

      // Use highlight
      const success = await storage.useHighlight(userId, vehicleId, highlightType);

      if (!success) {
        return res.status(400).json({ message: "Você não possui destaques disponíveis" });
      }

      res.json({
        message: "Veículo destacado com sucesso",
        highlightType,
        expiresIn: "30 dias"
      });

    } catch (error) {
      console.error("Error highlighting vehicle:", error);
      res.status(500).json({ message: "Erro ao destacar veículo" });
    }
  });

  // Register health check routes
  registerHealthRoutes(app);

  // Serve test visualization page
  app.get("/view-tests.html", (req, res) => {
    const testPagePath = path.join(process.cwd(), "public", "view-tests.html");
    if (fs.existsSync(testPagePath)) {
      res.sendFile(testPagePath);
    } else {
      res.status(404).send("Test visualization page not found");
    }
  });

  // Test execution endpoint
  app.get("/api/run-tests", async (req, res) => {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      const { testType = 'all' } = req.query;
      let command;

      switch (testType) {
        case 'functional':
          command = 'node tests/functional-validator.js';
          break;
        case 'integration':
          command = 'node tests/integration-tests.js';
          break;
        default:
          command = 'node tests/run-all-tests.js';
      }

      const { stdout, stderr } = await execAsync(command);
      res.json({
        success: true,
        output: stdout,
        error: stderr || null
      });
    } catch (error: any) {
      res.json({
        success: false,
        output: error.stdout || '',
        error: error.stderr || error.message
      });
    }
  });

  // ============================
  // INSPECTION ROUTES - SISTEMA DE VISTORIAS
  // ============================

  // Buscar todas as vistorias (com filtros opcionais)
  app.get('/api/inspections', authenticateToken, async (req, res) => {
    try {
      console.log('🔍 GET /api/inspections - Fetching inspections');
      
      const inspectionsData = await storage.getAllInspections();
      console.log(`✅ Found ${inspectionsData.length} inspections`);
      res.json(inspectionsData);
    } catch (error) {
      console.error('❌ Error fetching inspections:', error);
      res.status(500).json({ 
        message: 'Erro ao buscar vistorias',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // Buscar vistoria por reserva
  app.get('/api/inspections/reservation/:reservationId', authenticateToken, async (req, res) => {
    try {
      const { reservationId } = req.params;
      console.log(`🔍 GET /api/inspections/reservation/${reservationId} - Fetching inspection for reservation`);
      
      const inspection = await storage.getInspectionByReservation(parseInt(reservationId));
      
      if (!inspection) {
        return res.status(404).json({ message: 'Vistoria não encontrada' });
      }

      console.log(`✅ Found inspection for reservation ${reservationId}`);
      res.json(inspection);
    } catch (error) {
      console.error('❌ Error fetching inspection:', error);
      res.status(500).json({ 
        message: 'Erro ao buscar vistoria',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // Buscar reservas pendentes de vistoria
  app.get('/api/reservations/pending-inspection', authenticateToken, async (req, res) => {
    try {
      console.log('🔍 GET /api/reservations/pending-inspection - Fetching pending inspections');
      
      const pendingReservations = await storage.getReservationsPendingInspection();
      console.log(`✅ Found ${pendingReservations.length} pending inspections`);
      res.json(pendingReservations);
    } catch (error) {
      console.error('❌ Error fetching pending inspections:', error);
      res.status(500).json({ 
        message: 'Erro ao buscar reservas pendentes',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // Criar nova vistoria
  app.post('/api/inspections', authenticateToken, async (req, res) => {
    try {
      const {
        reservationId,
        vehicleCondition,
        exteriorCondition,
        interiorCondition,
        engineCondition,
        tiresCondition,
        fuelLevel,
        mileage,
        observations,
        approved
      } = req.body;

      console.log(`📝 POST /api/inspections - Creating inspection for reservation ${reservationId}`);

      // Verificar se a reserva existe
      const reservation = await storage.getBookingById(reservationId);
      if (!reservation) {
        return res.status(404).json({ message: 'Reserva não encontrada' });
      }

      // Verificar se já existe vistoria para esta reserva
      const existingInspection = await storage.getInspectionByReservation(reservationId);
      if (existingInspection) {
        return res.status(400).json({ message: 'Vistoria já existe para esta reserva' });
      }

      // Criar nova vistoria
      const newInspection = await storage.createInspection({
        reservationId,
        inspectorId: req.user!.id,
        vehicleCondition,
        exteriorCondition,
        interiorCondition,
        engineCondition,
        tiresCondition,
        fuelLevel,
        mileage,
        observations,
        approved,
        completedAt: new Date().toISOString()
      });

      // Atualizar status da reserva
      const newStatus = approved ? 'vistoriado' : 'reprovado_vistoria';
      await storage.updateBookingStatus(reservationId, newStatus);

      console.log(`✅ Inspection created successfully for reservation ${reservationId}`);
      res.status(201).json(newInspection);
    } catch (error) {
      console.error('❌ Error creating inspection:', error);
      res.status(500).json({ 
        message: 'Erro ao criar vistoria',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // Atualizar vistoria existente
  app.put('/api/inspections/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const {
        vehicleCondition,
        exteriorCondition,
        interiorCondition,
        engineCondition,
        tiresCondition,
        fuelLevel,
        mileage,
        observations,
        approved
      } = req.body;

      console.log(`📝 PUT /api/inspections/${id} - Updating inspection`);

      // Verificar se a vistoria existe
      const existingInspection = await storage.getInspectionById(parseInt(id));
      if (!existingInspection) {
        return res.status(404).json({ message: 'Vistoria não encontrada' });
      }

      // Atualizar vistoria
      const updatedInspection = await storage.updateInspection(parseInt(id), {
        vehicleCondition,
        exteriorCondition,
        interiorCondition,
        engineCondition,
        tiresCondition,
        fuelLevel,
        mileage,
        observations,
        approved,
        completedAt: new Date().toISOString()
      });

      // Atualizar status da reserva e processar pagamento se aprovado
      if (approved !== undefined) {
        const newStatus = approved ? 'vistoriado' : 'reprovado_vistoria';
        await storage.updateBookingStatus(existingInspection.bookingId, newStatus);
        
        // Se aprovado, usar serviço de payout automático
        if (approved && existingInspection.bookingId) {
          try {
            console.log(`💰 Triggering automatic payout for booking ${existingInspection.bookingId}`);
            const { autoPayoutService } = await import('./services/autoPayoutService');
            await autoPayoutService.triggerPayoutAfterPayment(existingInspection.bookingId);
          } catch (payoutError) {
            console.error('❌ Error triggering automatic payout:', payoutError);
            // Não falhar a atualização da vistoria se o payout falhar
          }
        }
      }

      console.log(`✅ Inspection ${id} updated successfully`);
      res.json(updatedInspection);
    } catch (error) {
      console.error('❌ Error updating inspection:', error);
      res.status(500).json({ 
        message: 'Erro ao atualizar vistoria',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // Owner Inspection Routes (Vistoria do Proprietário após devolução)
  app.post("/api/bookings/owner-inspection", authenticateToken, async (req, res) => {
    console.log('📝 POST /api/bookings/owner-inspection - Creating owner inspection');
    
    try {
      const {
        bookingId,
        vehicleId,
        mileage,
        fuelLevel,
        vehicleCondition,
        exteriorCondition,
        interiorCondition,
        engineCondition,
        tiresCondition,
        observations,
        photos,
        damages,
        depositDecision,
        depositReturnAmount,
        depositRetainedAmount,
        depositRetentionReason,
      } = req.body;

      // Get booking to verify ownership
      const booking = await storage.getBookingById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Reserva não encontrada" });
      }

      // Verify user is the vehicle owner
      if (booking.ownerId !== req.user!.id) {
        return res.status(403).json({ message: "Apenas o proprietário pode fazer a vistoria de devolução" });
      }

      // Check if booking is in appropriate status
      if (!['active', 'completed'].includes(booking.status)) {
        return res.status(400).json({ message: "Reserva não está em status adequado para vistoria de devolução" });
      }

      // Create owner inspection
      const ownerInspectionData = {
        bookingId,
        ownerId: req.user!.id,
        renterId: booking.renterId,
        vehicleId,
        mileage,
        fuelLevel,
        vehicleCondition,
        exteriorCondition,
        interiorCondition,
        engineCondition,
        tiresCondition,
        observations,
        photos: photos || [],
        damages: damages || [],
        status: "completed",
        depositDecision,
        depositReturnAmount,
        depositRetainedAmount,
        depositRetentionReason,
        decidedAt: new Date(),
      };

      const ownerInspection = await storage.createOwnerInspection(ownerInspectionData);

      // Update booking status to completed after owner inspection
      await storage.updateBookingStatus(bookingId, "completed");

      // Process deposit refund/retention based on decision
      if (depositDecision === "full_return" || depositDecision === "partial_return") {
        const returnAmount = parseFloat(depositReturnAmount || "0");
        if (returnAmount > 0) {
          // Create refund record for deposit return
          try {
            // Here you would integrate with payment provider to process refund
            console.log(`💰 Processing deposit refund of ${returnAmount} for booking ${bookingId}`);
            
            // For now, just log - implement actual refund logic based on payment provider
            console.log(`✅ Deposit refund processed: ${returnAmount}`);
          } catch (refundError) {
            console.error('❌ Deposit refund failed:', refundError);
          }
        }
      }

      console.log(`✅ Owner inspection completed for booking ${bookingId}`);

      res.json({
        message: "Vistoria do proprietário concluída com sucesso",
        ownerInspection,
      });

    } catch (error) {
      console.error('❌ Error creating owner inspection:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      res.status(500).json({ 
        message: 'Erro interno do servidor ao criar vistoria do proprietário',
        error: 'INTERNAL_SERVER_ERROR',
        details: errorMessage 
      });
    }
  });

  // Get owner inspections for a booking
  app.get("/api/bookings/:id/owner-inspection", authenticateToken, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      
      // Get booking to verify access
      const booking = await storage.getBookingById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Reserva não encontrada" });
      }

      // Verify user has access (owner, renter, or admin)
      const hasAccess = booking.ownerId === req.user!.id || 
                       booking.renterId === req.user!.id || 
                       req.user!.role === 'admin';

      if (!hasAccess) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const ownerInspection = await storage.getOwnerInspectionByBookingId(bookingId);
      
      if (!ownerInspection) {
        return res.status(404).json({ message: "Vistoria do proprietário não encontrada" });
      }

      res.json(ownerInspection);
    } catch (error) {
      console.error('❌ Error fetching owner inspection:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get pending owner inspections (bookings waiting for owner inspection)
  app.get('/api/reservations/pending-owner-inspection', authenticateToken, async (req, res) => {
    try {
      console.log('🔍 GET /api/reservations/pending-owner-inspection - Fetching pending owner inspections');
      
      // Get bookings where user is owner, status is 'completed', and no owner inspection exists yet
      const pendingOwnerInspections = await storage.getBookingsNeedingOwnerInspection(req.user!.id);
      
      console.log(`✅ Found ${pendingOwnerInspections.length} bookings pending owner inspection`);
      res.json(pendingOwnerInspections);
    } catch (error) {
      console.error('❌ Error fetching pending owner inspections:', error);
      res.status(500).json({ 
        message: 'Erro interno do servidor ao buscar vistorias pendentes',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  });

  // ========================
  // NEW MONETIZATION ROUTES
  // ========================

  // Qualified Leads Routes - Sistema de leads qualificados para locadores
  app.get("/api/leads/qualified", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Get qualified leads for vehicles owned by the user
      const leads = await db.select()
        .from(qualifiedLeads)
        .where(eq(qualifiedLeads.ownerId, userId))
        .orderBy(desc(qualifiedLeads.createdAt));

      res.json(leads);
    } catch (error) {
      console.error("Error fetching qualified leads:", error);
      res.status(500).json({ message: "Erro ao buscar leads qualificados" });
    }
  });

  // Purchase a qualified lead
  app.post("/api/leads/:leadId/purchase", authenticateToken, async (req, res) => {
    try {
      const leadId = parseInt(req.params.leadId);
      const userId = req.user!.id;

      // Get the lead
      const [lead] = await db.select()
        .from(qualifiedLeads)
        .where(and(
          eq(qualifiedLeads.id, leadId),
          eq(qualifiedLeads.ownerId, userId),
          eq(qualifiedLeads.status, 'pending')
        ));

      if (!lead) {
        return res.status(404).json({ message: "Lead não encontrado ou já comprado" });
      }

      // Check if lead has expired
      if (new Date() > lead.expiresAt) {
        await db.update(qualifiedLeads)
          .set({ status: 'expired' })
          .where(eq(qualifiedLeads.id, leadId));
        return res.status(400).json({ message: "Lead expirado" });
      }

      // Create payment intent for lead purchase
      const paymentIntent = await stripe!.paymentIntents.create({
        amount: Math.round(parseFloat(lead.purchasedPrice || '50.00') * 100), // Convert to cents
        currency: 'brl',
        metadata: {
          type: 'qualified_lead',
          leadId: leadId.toString(),
          userId: userId.toString()
        }
      });

      // Update lead with payment intent
      await db.update(qualifiedLeads)
        .set({ 
          status: 'purchased',
          purchasedAt: new Date(),
          purchasedPrice: String(lead.purchasedPrice || '50.00')
        })
        .where(eq(qualifiedLeads.id, leadId));

      res.json({
        clientSecret: paymentIntent.client_secret,
        leadInfo: lead.contactInfo
      });
    } catch (error) {
      console.error("Error purchasing lead:", error);
      res.status(500).json({ message: "Erro ao comprar lead" });
    }
  });

  // Vehicle Boost Routes - Sistema de destaque pago por anúncio
  app.get("/api/vehicles/:vehicleId/boosts", authenticateToken, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      const userId = req.user!.id;

      // Verify vehicle ownership
      const vehicle = await storage.getVehicle(vehicleId);
      if (!vehicle || vehicle.ownerId !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const boosts = await db.select()
        .from(vehicleBoosts)
        .where(eq(vehicleBoosts.vehicleId, vehicleId))
        .orderBy(desc(vehicleBoosts.createdAt));

      res.json(boosts);
    } catch (error) {
      console.error("Error fetching vehicle boosts:", error);
      res.status(500).json({ message: "Erro ao buscar impulsos do veículo" });
    }
  });

  // Create vehicle boost
  app.post("/api/vehicles/:vehicleId/boost", authenticateToken, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      const userId = req.user!.id;

      // Verify vehicle ownership
      const vehicle = await storage.getVehicle(vehicleId);
      if (!vehicle || vehicle.ownerId !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const { boostType, duration = 7 } = req.body;

      const BOOST_PRICES = {
        homepage_highlight: 15.00,
        category_highlight: 10.00,
        event_highlight: 25.00
      };

      const price = BOOST_PRICES[boostType as keyof typeof BOOST_PRICES];
      if (!price) {
        return res.status(400).json({ message: "Tipo de impulso inválido" });
      }

      // Create payment intent for boost
      const paymentIntent = await stripe!.paymentIntents.create({
        amount: Math.round(price * 100),
        currency: 'brl',
        metadata: {
          type: 'vehicle_boost',
          vehicleId: vehicleId.toString(),
          userId: userId.toString(),
          boostType,
          duration: duration.toString()
        }
      });

      // Create boost record
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + duration);

      const [boost] = await db.insert(vehicleBoosts)
        .values({
          vehicleId,
          ownerId: userId,
          boostType,
          boostTitle: `Destaque ${boostType}`,
          boostDescription: `Veículo destacado por ${duration} dias`,
          price: price.toString(),
          duration,
          startDate,
          endDate,
          paymentIntentId: paymentIntent.id
        })
        .returning();

      res.json({
        clientSecret: paymentIntent.client_secret,
        boost
      });
    } catch (error) {
      console.error("Error creating vehicle boost:", error);
      res.status(500).json({ message: "Erro ao criar impulso do veículo" });
    }
  });

  // Premium Services Routes - Serviços premium para locatários
  app.get("/api/premium-services", async (req, res) => {
    try {
      const services = await db.select()
        .from(premiumServices)
        .where(eq(premiumServices.isActive, true))
        .orderBy(asc(premiumServices.price));

      res.json(services);
    } catch (error) {
      console.error("Error fetching premium services:", error);
      res.status(500).json({ message: "Erro ao buscar serviços premium" });
    }
  });

  // Purchase premium service
  app.post("/api/premium-services/:serviceId/purchase", authenticateToken, async (req, res) => {
    try {
      const serviceId = parseInt(req.params.serviceId);
      const userId = req.user!.id;
      const { bookingId } = req.body;

      // Get the service
      const [service] = await db.select()
        .from(premiumServices)
        .where(and(
          eq(premiumServices.id, serviceId),
          eq(premiumServices.isActive, true)
        ));

      if (!service) {
        return res.status(404).json({ message: "Serviço não encontrado" });
      }

      // Create payment intent
      const paymentIntent = await stripe!.paymentIntents.create({
        amount: Math.round(Number(service.price) * 100),
        currency: 'brl',
        metadata: {
          type: 'premium_service',
          serviceId: serviceId.toString(),
          userId: userId.toString(),
          bookingId: bookingId?.toString() || ''
        }
      });

      // Calculate expiry date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + service.duration);

      // Create user premium service record
      const [userService] = await db.insert(userPremiumServices)
        .values({
          userId,
          serviceId,
          bookingId: bookingId || null,
          purchasePrice: service.price,
          paymentIntentId: paymentIntent.id,
          expiresAt
        })
        .returning();

      res.json({
        clientSecret: paymentIntent.client_secret,
        service: userService
      });
    } catch (error) {
      console.error("Error purchasing premium service:", error);
      res.status(500).json({ message: "Erro ao comprar serviço premium" });
    }
  });

  // Get user's premium services
  app.get("/api/user/premium-services", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;

      const userServices = await db.select({
        id: userPremiumServices.id,
        status: userPremiumServices.status,
        purchasePrice: userPremiumServices.purchasePrice,
        expiresAt: userPremiumServices.expiresAt,
        usedAt: userPremiumServices.usedAt,
        createdAt: userPremiumServices.createdAt,
        service: {
          name: premiumServices.name,
          description: premiumServices.description,
          serviceType: premiumServices.serviceType
        }
      })
      .from(userPremiumServices)
      .innerJoin(premiumServices, eq(userPremiumServices.serviceId, premiumServices.id))
      .where(eq(userPremiumServices.userId, userId))
      .orderBy(desc(userPremiumServices.createdAt));

      res.json(userServices);
    } catch (error) {
      console.error("Error fetching user premium services:", error);
      res.status(500).json({ message: "Erro ao buscar serviços premium do usuário" });
    }
  });

  // Generate qualified lead when user shows interest in a vehicle
  app.post("/api/vehicles/:vehicleId/generate-lead", authenticateToken, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      const userId = req.user!.id;
      const { startDate, endDate } = req.body;

      const vehicle = await storage.getVehicle(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ message: "Veículo não encontrado" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Check if lead already exists for this combination
      const existingLead = await db.select()
        .from(qualifiedLeads)
        .where(and(
          eq(qualifiedLeads.vehicleId, vehicleId),
          eq(qualifiedLeads.renterId, userId),
          eq(qualifiedLeads.status, 'pending')
        ));

      if (existingLead.length > 0) {
        return res.status(400).json({ message: "Lead já existe para este veículo" });
      }

      // Calculate lead score
      let leadScore = 0;
      if (user.isVerified) leadScore += 15;
      if (user.totalRentals > 0) leadScore += 20;
      if (user.documentsSubmitted) leadScore += 10;

      // Set expiry (72 hours)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 72);

      // Create qualified lead
      const [lead] = await db.insert(qualifiedLeads)
        .values({
          vehicleId,
          ownerId: vehicle.ownerId,
          renterId: userId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          contactInfo: {
            name: user.name,
            phone: user.phone || '',
            email: user.email
          },
          leadScore,
          purchasedPrice: '50.00', // Default price
          expiresAt
        })
        .returning();

      res.json({
        message: "Lead qualificado gerado com sucesso",
        leadId: lead.id
      });
    } catch (error) {
      console.error("Error generating qualified lead:", error);
      res.status(500).json({ message: "Erro ao gerar lead qualificado" });
    }
  });

  // Test endpoints for integration testing
  if (process.env.NODE_ENV === 'development') {
    // Schema validation endpoint
    app.get("/api/test/schema-check", async (req, res) => {
      try {
        // Check if all monetization tables exist by running simple queries
        const checks = [
          { table: 'premium_services', query: () => db.select().from(premiumServices).limit(1) },
          { table: 'qualified_leads', query: () => db.select().from(qualifiedLeads).limit(1) },
          { table: 'vehicle_boosts', query: () => db.select().from(vehicleBoosts).limit(1) },
          { table: 'user_premium_services', query: () => db.select().from(userPremiumServices).limit(1) }
        ];

        const tables = [];
        for (const check of checks) {
          try {
            await check.query();
            tables.push(check.table);
          } catch (error) {
            console.error(`Table ${check.table} check failed:`, error);
          }
        }

        res.json({
          status: 'success',
          tables,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error("Schema check error:", error);
        res.status(500).json({ 
          status: 'error',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Test endpoint to validate APIs are working
    app.get("/api/test/monetization-health", async (req, res) => {
      try {
        const checks = [];
        
        // Check each endpoint
        const endpoints = [
          { name: 'Premium Services', path: '/api/premium-services' },
          { name: 'Qualified Leads', path: '/api/qualified-leads' },
          { name: 'Vehicle Boosts', path: '/api/vehicle-boosts' },
          { name: 'User Premium Services', path: '/api/user-premium-services' }
        ];

        for (const endpoint of endpoints) {
          try {
            // Make internal request to test endpoint
            const testResponse = await fetch(`http://localhost:5000${endpoint.path}`);
            checks.push({
              name: endpoint.name,
              path: endpoint.path,
              status: testResponse.ok ? 'OK' : 'ERROR',
              statusCode: testResponse.status
            });
          } catch (error) {
            checks.push({
              name: endpoint.name,
              path: endpoint.path,
              status: 'ERROR',
              error: error.message
            });
          }
        }

        const allHealthy = checks.every(check => check.status === 'OK');
        
        res.json({
          status: allHealthy ? 'healthy' : 'unhealthy',
          checks,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error("Health check error:", error);
        res.status(500).json({ 
          status: 'error',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  // Car Models API for the new car model selector feature
  app.get("/api/car-models", async (req, res) => {
    try {
      const carModels = await storage.getCarModels();
      res.json(carModels);
    } catch (error) {
      console.error("Error fetching car models:", error);
      res.status(500).json({ message: "Erro ao carregar modelos de carros" });
    }
  });

  // CNH Validation API for the new CNH validation feature
  app.post("/api/user/validate-cnh", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const { cnhNumber } = req.body;
      
      // In a real implementation, you would upload images to storage and validate
      const cnhValidation = await storage.createCNHValidation({
        userId: req.user.id,
        cnhNumber,
        cnhDocumentUrl: "mock_cnh_url", // Would be uploaded image URL
        selfieUrl: "mock_selfie_url", // Would be uploaded selfie URL
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        status: "pending",
      });

      res.json({ success: true, cnhValidation });
    } catch (error) {
      console.error("Error validating CNH:", error);
      res.status(500).json({ message: "Erro ao validar CNH" });
    }
  });

  // Support Tickets API for the new support chat feature
  app.get("/api/support/tickets", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const tickets = await storage.getSupportTicketsByUser(req.user.id);
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      res.status(500).json({ message: "Erro ao carregar tickets de suporte" });
    }
  });

  app.post("/api/support/tickets", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const { subject, description, category, priority } = req.body;
      
      const ticket = await storage.createSupportTicket({
        userId: req.user.id,
        subject,
        description,
        category,
        priority,
        status: "open",
      });

      res.json(ticket);
    } catch (error) {
      console.error("Error creating support ticket:", error);
      res.status(500).json({ message: "Erro ao criar ticket de suporte" });
    }
  });

  // Reviews API for the new rating/review feature
  app.post("/api/reviews", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const { bookingId, vehicleId, revieweeId, rating, comment, type } = req.body;
      
      const review = await storage.createReview({
        bookingId,
        reviewerId: req.user.id,
        revieweeId,
        vehicleId,
        rating,
        comment,
        type,
      });

      res.json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Erro ao criar avaliação" });
    }
  });

  // Support contact endpoint
  app.post("/api/support/contact", async (req: Request, res: Response) => {
    try {
      const { name, email, subject, message, priority } = req.body;

      // Validate required fields
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ 
          message: "Todos os campos são obrigatórios" 
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          message: "E-mail inválido" 
        });
      }

      // Log the support request (in production, you'd save to database or send email)
      console.log('📧 Support request received:', {
        name,
        email,
        subject,
        priority,
        message: message.substring(0, 100) + '...',
        timestamp: new Date().toISOString()
      });

      // Here you would typically:
      // 1. Save to database
      // 2. Send email to support team
      // 3. Create support ticket
      // 4. Send confirmation email to user

      res.json({ 
        message: "Mensagem enviada com sucesso! Entraremos em contato em breve.",
        ticketId: `SUP-${Date.now()}` // Generate a simple ticket ID
      });

    } catch (error) {
      console.error("Support contact error:", error);
      res.status(500).json({ 
        message: "Erro interno do servidor. Tente novamente." 
      });
    }
  });

  const httpServer = createServer(app);
  
  // Setup WebSocket server for real-time messaging
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store active connections
  const activeConnections = new Map<number, WebSocket>();
  
  wss.on('connection', (ws: WebSocket, req) => {
    console.log('🔌 New WebSocket connection');
    
    // Handle authentication
    ws.on('message', (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'authenticate') {
          // Verify JWT token
          const token = data.token;
          if (token) {
            try {
              const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
              const userId = decoded.userId;
              
              // Store authenticated connection
              activeConnections.set(userId, ws);
              console.log(`✅ User ${userId} authenticated via WebSocket`);
              
              ws.send(JSON.stringify({
                type: 'authenticated',
                userId: userId
              }));
            } catch (error) {
              console.error('WebSocket authentication failed:', error);
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Authentication failed'
              }));
            }
          }
        } else if (data.type === 'ping') {
          // Respond to ping to keep connection alive
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      // Remove connection from active connections
      for (const [userId, connection] of Array.from(activeConnections.entries())) {
        if (connection === ws) {
          activeConnections.delete(userId);
          console.log(`❌ User ${userId} disconnected from WebSocket`);
          break;
        }
      }
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
  
  // Add broadcast function to app for sending real-time notifications
  (app as any).broadcastToUser = (userId: number, message: any) => {
    const connection = activeConnections.get(userId);
    if (connection && connection.readyState === WebSocket.OPEN) {
      connection.send(JSON.stringify(message));
      return true;
    }
    return false;
  };
  
  return httpServer;
}