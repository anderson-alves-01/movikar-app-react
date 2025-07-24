import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertVehicleSchema, insertBookingSchema, insertReviewSchema, insertMessageSchema, insertContractSchema, type User } from "@shared/schema";
import { contractService } from "./services/contractService.js";
import { processSignatureWebhook } from "./services/signatureService.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

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
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
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
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Generate token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

      const { password, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword, token });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
      
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req, res) => {
    const { password, ...userWithoutPassword } = req.user;
    res.json({ user: userWithoutPassword });
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put("/api/users/:id", authenticateToken, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (req.user.id !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const userData = req.body;
      const user = await storage.updateUser(userId, userData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Failed to update user" });
    }
  });

  // Vehicle routes
  app.get("/api/vehicles", async (req, res) => {
    try {
      const filters = {
        location: req.query.location as string,
        category: req.query.category as string,
        priceMin: req.query.priceMin ? parseFloat(req.query.priceMin as string) : undefined,
        priceMax: req.query.priceMax ? parseFloat(req.query.priceMax as string) : undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        features: req.query.features ? (req.query.features as string).split(',') : undefined,
      };

      const vehicles = await storage.searchVehicles(filters);
      res.json(vehicles);
    } catch (error) {
      console.error("Search vehicles error:", error);
      res.status(500).json({ message: "Failed to search vehicles" });
    }
  });

  app.get("/api/vehicles/:id", async (req, res) => {
    try {
      const vehicle = await storage.getVehicle(parseInt(req.params.id));
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vehicle" });
    }
  });

  app.post("/api/vehicles", authenticateToken, async (req, res) => {
    try {
      const vehicleData = insertVehicleSchema.parse({
        ...req.body,
        ownerId: req.user.id,
      });

      const vehicle = await storage.createVehicle(vehicleData);
      res.status(201).json(vehicle);
    } catch (error) {
      console.error("Create vehicle error:", error);
      res.status(400).json({ message: "Failed to create vehicle" });
    }
  });

  app.put("/api/vehicles/:id", authenticateToken, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.id);
      const vehicle = await storage.getVehicle(vehicleId);
      
      if (!vehicle || vehicle.ownerId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const updatedVehicle = await storage.updateVehicle(vehicleId, req.body);
      if (!updatedVehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      res.json(updatedVehicle);
    } catch (error) {
      res.status(400).json({ message: "Failed to update vehicle" });
    }
  });

  app.delete("/api/vehicles/:id", authenticateToken, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.id);
      const vehicle = await storage.getVehicle(vehicleId);
      
      if (!vehicle || vehicle.ownerId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const deleted = await storage.deleteVehicle(vehicleId);
      if (!deleted) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete vehicle" });
    }
  });

  app.get("/api/users/:id/vehicles", async (req, res) => {
    try {
      const vehicles = await storage.getVehiclesByOwner(parseInt(req.params.id));
      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user vehicles" });
    }
  });

  // Booking routes
  app.get("/api/bookings", authenticateToken, async (req, res) => {
    try {
      const type = req.query.type as 'renter' | 'owner' || 'renter';
      const bookings = await storage.getBookingsByUser(req.user.id, type);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/bookings/:id", authenticateToken, async (req, res) => {
    try {
      const booking = await storage.getBooking(parseInt(req.params.id));
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Check if user is involved in this booking
      if (booking.renterId !== req.user.id && booking.ownerId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  app.post("/api/bookings", authenticateToken, async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        renterId: req.user.id,
      });

      // Check vehicle availability
      const isAvailable = await storage.checkVehicleAvailability(
        bookingData.vehicleId,
        bookingData.startDate,
        bookingData.endDate
      );

      if (!isAvailable) {
        return res.status(400).json({ message: "Vehicle not available for selected dates" });
      }

      const booking = await storage.createBooking(bookingData);
      res.status(201).json(booking);
    } catch (error) {
      console.error("Create booking error:", error);
      res.status(400).json({ message: "Failed to create booking" });
    }
  });

  app.put("/api/bookings/:id", authenticateToken, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Only owner can approve/reject, only renter can cancel
      if (booking.ownerId !== req.user.id && booking.renterId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const updatedBooking = await storage.updateBooking(bookingId, req.body);
      if (!updatedBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res.json(updatedBooking);
    } catch (error) {
      res.status(400).json({ message: "Failed to update booking" });
    }
  });

  // Review routes
  app.get("/api/vehicles/:id/reviews", async (req, res) => {
    try {
      const reviews = await storage.getReviewsByVehicle(parseInt(req.params.id));
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post("/api/reviews", authenticateToken, async (req, res) => {
    try {
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        reviewerId: req.user.id,
      });

      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      console.error("Create review error:", error);
      res.status(400).json({ message: "Failed to create review" });
    }
  });

  // Message routes
  app.get("/api/messages", authenticateToken, async (req, res) => {
    try {
      const otherUserId = parseInt(req.query.userId as string);
      const bookingId = req.query.bookingId ? parseInt(req.query.bookingId as string) : undefined;
      
      const messages = await storage.getMessagesBetweenUsers(req.user.id, otherUserId, bookingId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", authenticateToken, async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: req.user.id,
      });

      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      console.error("Create message error:", error);
      res.status(400).json({ message: "Failed to send message" });
    }
  });

  app.put("/api/messages/read", authenticateToken, async (req, res) => {
    try {
      const { senderId } = req.body;
      await storage.markMessagesAsRead(req.user.id, senderId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });

  // Contract Routes
  
  // Generate contract from booking
  app.post("/api/contracts/generate", authenticateToken, async (req, res) => {
    try {
      const { bookingId, templateId } = req.body;
      
      if (!bookingId) {
        return res.status(400).json({ message: "ID da reserva é obrigatório" });
      }

      const contract = await contractService.createContractFromBooking(
        bookingId, 
        templateId, 
        req.user?.id
      );

      res.status(201).json(contract);
    } catch (error: any) {
      console.error("Generate contract error:", error);
      res.status(400).json({ message: error.message || "Falha ao gerar contrato" });
    }
  });

  // Get contract preview (PDF)
  app.get("/api/contracts/:id/preview", authenticateToken, async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const pdfUrl = await contractService.generateContractPreview(contractId);
      res.json({ pdfUrl });
    } catch (error: any) {
      console.error("Contract preview error:", error);
      res.status(400).json({ message: error.message || "Falha ao gerar preview" });
    }
  });

  // Send contract for signature
  app.post("/api/contracts/:id/send", authenticateToken, async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const externalDocumentId = await contractService.sendForSignature(contractId, req.user?.id);
      res.json({ 
        message: "Contrato enviado para assinatura",
        externalDocumentId 
      });
    } catch (error: any) {
      console.error("Send contract error:", error);
      res.status(400).json({ message: error.message || "Falha ao enviar contrato" });
    }
  });

  // Download contract PDF
  app.get("/api/contracts/:id/download", authenticateToken, async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const pdfUrl = await contractService.downloadContract(contractId, req.user!.id);
      
      // Serve the PDF file
      const fileName = path.basename(pdfUrl);
      const filePath = path.join(process.cwd(), 'uploads', fileName);
      
      if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
      } else {
        res.status(404).json({ message: "Arquivo não encontrado" });
      }
    } catch (error: any) {
      console.error("Download contract error:", error);
      res.status(400).json({ message: error.message || "Falha ao baixar contrato" });
    }
  });

  // Get contracts for booking
  app.get("/api/bookings/:id/contracts", authenticateToken, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const contracts = await storage.getContractsByBooking(bookingId);
      res.json(contracts);
    } catch (error) {
      console.error("Get booking contracts error:", error);
      res.status(500).json({ message: "Falha ao buscar contratos" });
    }
  });

  // Get contract with details
  app.get("/api/contracts/:id", authenticateToken, async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const contract = await storage.getContractWithDetails(contractId);
      
      if (!contract) {
        return res.status(404).json({ message: "Contrato não encontrado" });
      }

      // Check permissions
      const hasPermission = contract.contractData.renter.id === req.user?.id || 
                           contract.contractData.owner.id === req.user?.id ||
                           contract.createdBy === req.user?.id;

      if (!hasPermission) {
        return res.status(403).json({ message: "Sem permissão para acessar este contrato" });
      }

      res.json(contract);
    } catch (error) {
      console.error("Get contract error:", error);
      res.status(500).json({ message: "Falha ao buscar contrato" });
    }
  });

  // Admin: Get all contracts with filters
  app.get("/api/admin/contracts", authenticateToken, async (req, res) => {
    try {
      // For now, allow any authenticated user - in production add admin role check
      const filters = {
        status: req.query.status as string,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };

      const contracts = await contractService.getContractsForAdmin(filters);
      res.json(contracts);
    } catch (error) {
      console.error("Get admin contracts error:", error);
      res.status(500).json({ message: "Falha ao buscar contratos" });
    }
  });

  // Get contract audit trail
  app.get("/api/contracts/:id/audit", authenticateToken, async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const auditTrail = await contractService.getContractAuditTrail(contractId);
      res.json(auditTrail);
    } catch (error) {
      console.error("Get audit trail error:", error);
      res.status(500).json({ message: "Falha ao buscar histórico" });
    }
  });

  // Webhook for signature platforms
  app.post("/api/contracts/webhook/:platform", async (req, res) => {
    try {
      const platform = req.params.platform;
      const webhookData = processSignatureWebhook(platform, req.body);
      
      await contractService.processSignatureWebhook(
        webhookData.externalDocumentId,
        webhookData
      );

      res.status(200).json({ message: "Webhook processado com sucesso" });
    } catch (error: any) {
      console.error("Webhook processing error:", error);
      res.status(400).json({ message: error.message || "Falha ao processar webhook" });
    }
  });

  // Cancel contract
  app.post("/api/contracts/:id/cancel", authenticateToken, async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const { reason } = req.body;
      
      await contractService.cancelContract(contractId, reason, req.user?.id);
      res.json({ message: "Contrato cancelado com sucesso" });
    } catch (error: any) {
      console.error("Cancel contract error:", error);
      res.status(400).json({ message: error.message || "Falha ao cancelar contrato" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
