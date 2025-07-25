import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertVehicleSchema, insertBookingSchema, insertReviewSchema, insertMessageSchema, insertVehicleBrandSchema, insertVehicleAvailabilitySchema, insertWaitingQueueSchema, type User, type VehicleBrand } from "@shared/schema";
import { ZodError } from "zod";
// import { contractService } from "./services/contractService.js";
// import { processSignatureWebhook } from "./services/signatureService.js";
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

      const { password: _, ...userWithoutPassword } = user;
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
    const { password: _, ...userWithoutPassword } = req.user!;
    res.json({ user: userWithoutPassword });
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put("/api/users/:id", authenticateToken, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (req.user!.id !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const userData = req.body;
      const user = await storage.updateUser(userId, userData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
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
        ownerId: req.user!.id,
      });

      // Log para auditoria de dados válidos
      console.log(`✅ Veículo validado: ${vehicleData.brand} ${vehicleData.model} (usuário: ${req.user!.id})`);

      const vehicle = await storage.createVehicle(vehicleData);
      res.status(201).json(vehicle);
    } catch (error) {
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
      
      res.status(400).json({ message: "Falha ao criar veículo" });
    }
  });

  app.put("/api/vehicles/:id", authenticateToken, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.id);
      const vehicle = await storage.getVehicle(vehicleId);
      
      if (!vehicle || vehicle.ownerId !== req.user!.id) {
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
      
      if (!vehicle || vehicle.ownerId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Check if vehicle has any bookings (due to foreign key constraint)
      const hasBookings = await storage.hasAnyBookings(vehicleId);
      if (hasBookings) {
        return res.status(400).json({ 
          message: "Cannot delete vehicle with existing booking history. Vehicle deletion is only allowed for vehicles that have never been booked." 
        });
      }

      const deleted = await storage.deleteVehicle(vehicleId);
      if (!deleted) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Delete vehicle error:", error);
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
      const bookings = await storage.getBookingsByUser(req.user!.id, type);
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
      if (booking.renterId !== req.user!.id && booking.ownerId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  app.post("/api/bookings", authenticateToken, async (req, res) => {
    try {
      // Get vehicle to find owner ID
      const vehicle = await storage.getVehicle(req.body.vehicleId);
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
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
        startDate,
        endDate,
        totalPrice: totalPrice.toFixed(2), // Convert to string
        servicefee: serviceFee,
        insuranceFee: insuranceFee,
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
      if (booking.ownerId !== req.user!.id && booking.renterId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const updatedBooking = await storage.updateBooking(bookingId, req.body);
      if (!updatedBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Auto-block vehicle dates when booking is completed and contract is signed
      if (req.body.status === "completed") {
        await storage.checkAndBlockCompletedBooking(bookingId);
      }

      res.json(updatedBooking);
    } catch (error) {
      console.error("Update booking error:", error);
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
        reviewerId: req.user!.id,
      });

      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      console.error("Create review error:", error);
      res.status(400).json({ message: "Failed to create review" });
    }
  });



  // Vehicle Brands Management (Admin)
  app.get("/api/vehicle-brands", async (req, res) => {
    try {
      const brands = await storage.getVehicleBrands();
      res.json(brands);
    } catch (error) {
      console.error("Get vehicle brands error:", error);
      res.status(500).json({ message: "Failed to fetch vehicle brands" });
    }
  });

  app.post("/api/vehicle-brands", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const brandData = insertVehicleBrandSchema.parse(req.body);
      const brand = await storage.createVehicleBrand(brandData);
      res.status(201).json(brand);
    } catch (error) {
      console.error("Create vehicle brand error:", error);
      res.status(400).json({ message: "Failed to create vehicle brand" });
    }
  });

  app.put("/api/vehicle-brands/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const brandId = parseInt(req.params.id);
      const brandData = req.body;
      const brand = await storage.updateVehicleBrand(brandId, brandData);
      if (!brand) {
        return res.status(404).json({ message: "Vehicle brand not found" });
      }
      res.json(brand);
    } catch (error) {
      console.error("Update vehicle brand error:", error);
      res.status(400).json({ message: "Failed to update vehicle brand" });
    }
  });

  app.delete("/api/vehicle-brands/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const brandId = parseInt(req.params.id);
      const deleted = await storage.deleteVehicleBrand(brandId);
      if (!deleted) {
        return res.status(404).json({ message: "Vehicle brand not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Delete vehicle brand error:", error);
      res.status(500).json({ message: "Failed to delete vehicle brand" });
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
      res.status(500).json({ message: "Failed to fetch vehicle availability" });
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
      res.status(400).json({ message: "Failed to create availability period" });
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
        return res.status(404).json({ message: "Availability period not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Delete vehicle availability error:", error);
      res.status(500).json({ message: "Failed to delete availability period" });
    }
  });

  // Contract routes
  app.get("/api/contracts/:id", authenticateToken, async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const contract = await storage.getContractWithDetails(contractId);
      
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }

      res.json(contract);
    } catch (error) {
      console.error("Get contract error:", error);
      res.status(500).json({ message: "Failed to fetch contract" });
    }
  });

  app.put("/api/contracts/:id", authenticateToken, async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const contract = await storage.getContract(contractId);
      
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }

      const updatedContract = await storage.updateContract(contractId, req.body);
      
      // Auto-block vehicle dates when contract is signed and booking is completed
      if (req.body.status === "signed" && contract.bookingId) {
        await storage.checkAndBlockCompletedBooking(contract.bookingId);
      }
      
      res.json(updatedContract);
    } catch (error) {
      console.error("Update contract error:", error);
      res.status(400).json({ message: "Failed to update contract" });
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
      res.status(500).json({ message: "Failed to release expired blocks" });
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
      res.status(500).json({ message: "Auto-release failed" });
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
      res.status(400).json({ message: "Failed to join waiting queue" });
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
      res.status(500).json({ message: "Failed to fetch user waiting queue" });
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
        return res.status(404).json({ message: "Queue entry not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Remove from waiting queue error:", error);
      res.status(500).json({ message: "Failed to remove from waiting queue" });
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
      res.status(500).json({ message: "Failed to fetch conversations" });
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
      res.status(500).json({ message: "Failed to fetch messages" });
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
      res.status(400).json({ message: "Failed to send message" });
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
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });

  // Get unread message count
  app.get("/api/messages/unread-count", authenticateToken, async (req, res) => {
    try {
      const count = await storage.getUnreadMessageCount(req.user!.id);
      res.json({ count });
    } catch (error) {
      console.error("Get unread message count error:", error);
      res.status(500).json({ message: "Failed to fetch unread message count" });
    }
  });

  // Admin routes
  app.get("/api/admin/contracts", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { status, dateFrom, dateTo, limit = 50, offset = 0 } = req.query;
      
      const contracts = await storage.getContracts({
        status: status as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });
      
      res.json(contracts);
    } catch (error) {
      console.error("Admin contracts error:", error);
      res.status(500).json({ message: "Failed to fetch contracts" });
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
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/users/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Admin user by id error:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password: _, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error("Admin update user error:", error);
      res.status(400).json({ message: "Failed to update user" });
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
        return res.status(404).json({ message: "User not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Admin delete user error:", error);
      res.status(400).json({ message: "Failed to delete user" });
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
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/admin/bookings/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const booking = await storage.getBookingById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      console.error("Admin booking by id error:", error);
      res.status(500).json({ message: "Failed to fetch booking" });
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
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      console.error("Admin update booking error:", error);
      res.status(400).json({ message: "Failed to update booking" });
    }
  });

  app.delete("/api/admin/bookings/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const success = await storage.deleteBooking(bookingId);
      if (!success) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Admin delete booking error:", error);
      res.status(400).json({ message: "Failed to delete booking" });
    }
  });

  // Admin Contracts CRUD
  app.post("/api/admin/contracts", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const contract = await storage.createContract(req.body);
      res.status(201).json(contract);
    } catch (error) {
      console.error("Admin create contract error:", error);
      res.status(400).json({ message: "Failed to create contract" });
    }
  });

  app.put("/api/admin/contracts/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const contract = await storage.updateContract(contractId, req.body);
      res.json(contract);
    } catch (error) {
      console.error("Admin update contract error:", error);
      res.status(400).json({ message: "Failed to update contract" });
    }
  });

  app.delete("/api/admin/contracts/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const success = await storage.deleteContract(contractId);
      if (!success) {
        return res.status(404).json({ message: "Contract not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Admin delete contract error:", error);
      res.status(400).json({ message: "Failed to delete contract" });
    }
  });

  app.get("/api/vehicle-brands", async (req, res) => {
    try {
      const brands = await storage.getVehicleBrands();
      res.json(brands);
    } catch (error) {
      console.error("Vehicle brands error:", error);
      res.status(500).json({ message: "Failed to fetch vehicle brands" });
    }
  });

  app.post("/api/vehicle-brands", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const brandData = insertVehicleBrandSchema.parse(req.body);
      const brand = await storage.createVehicleBrand(brandData);
      res.status(201).json(brand);
    } catch (error) {
      console.error("Create vehicle brand error:", error);
      res.status(400).json({ message: "Failed to create vehicle brand" });
    }
  });

  app.put("/api/vehicle-brands/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const brandId = parseInt(req.params.id);
      const brandData = insertVehicleBrandSchema.partial().parse(req.body);
      const brand = await storage.updateVehicleBrand(brandId, brandData);
      res.json(brand);
    } catch (error) {
      console.error("Update vehicle brand error:", error);
      res.status(400).json({ message: "Failed to update vehicle brand" });
    }
  });

  app.delete("/api/vehicle-brands/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const brandId = parseInt(req.params.id);
      await storage.deleteVehicleBrand(brandId);
      res.status(204).send();
    } catch (error) {
      console.error("Delete vehicle brand error:", error);
      res.status(400).json({ message: "Failed to delete vehicle brand" });
    }
  });

  // Webhooks and external integrations
  app.post("/webhook/signatures", async (req, res) => {
    res.status(200).json({ message: "Webhook received" });
  });

  const httpServer = createServer(app);
  return httpServer;
}
