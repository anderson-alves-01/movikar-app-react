import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertVehicleSchema, insertBookingSchema, insertReviewSchema, insertMessageSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Authentication middleware
const authenticateToken = async (req: any, res: any, next: any) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
