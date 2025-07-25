import { 
  users, vehicles, bookings, reviews, messages, contracts, contractTemplates, contractAuditLog, vehicleBrands, vehicleAvailability, waitingQueue,
  type User, type InsertUser, type Vehicle, type InsertVehicle, 
  type Booking, type InsertBooking, type Review, type InsertReview,
  type Message, type InsertMessage, type VehicleWithOwner, type BookingWithDetails,
  type Contract, type InsertContract, type ContractTemplate, type InsertContractTemplate,
  type ContractAuditLog, type InsertContractAuditLog, type ContractWithDetails,
  type VehicleBrand, type InsertVehicleBrand, type VehicleAvailability, type InsertVehicleAvailability,
  type WaitingQueue, type InsertWaitingQueue
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, asc, or, like, ilike, sql, lt } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;

  // Vehicles
  getVehicle(id: number): Promise<VehicleWithOwner | undefined>;
  getVehiclesByOwner(ownerId: number): Promise<Vehicle[]>;
  searchVehicles(filters: {
    location?: string;
    category?: string;
    priceMin?: number;
    priceMax?: number;
    startDate?: Date;
    endDate?: Date;
    features?: string[];
  }): Promise<VehicleWithOwner[]>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: number): Promise<boolean>;

  // Bookings
  getBooking(id: number): Promise<BookingWithDetails | undefined>;
  getBookingsByUser(userId: number, type: 'renter' | 'owner'): Promise<BookingWithDetails[]>;
  getBookingsByVehicle(vehicleId: number): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: number, booking: Partial<InsertBooking>): Promise<Booking | undefined>;
  checkVehicleAvailability(vehicleId: number, startDate: Date, endDate: Date): Promise<boolean>;
  blockVehicleDatesForBooking(vehicleId: number, startDate: string, endDate: string, bookingId: number): Promise<VehicleAvailability>;
  checkAndBlockCompletedBooking(bookingId: number): Promise<boolean>;
  releaseExpiredVehicleBlocks(): Promise<{ releasedBlocks: VehicleAvailability[], notifiedUsers: any[] }>;
  notifyWaitingQueueUsers(vehicleId: number, availableStartDate: string, availableEndDate: string): Promise<any[]>;

  // Reviews
  getReviewsByVehicle(vehicleId: number): Promise<Review[]>;
  getReviewsByUser(userId: number, type: 'given' | 'received'): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;

  // Messages
  getMessagesBetweenUsers(userId1: number, userId2: number, bookingId?: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(receiverId: number, senderId: number): Promise<void>;

  // Contracts
  getContract(id: number): Promise<Contract | undefined>;
  getContractWithDetails(id: number): Promise<ContractWithDetails | undefined>;
  getContractByExternalId(externalDocumentId: string): Promise<Contract | undefined>;
  getContractsByBooking(bookingId: number): Promise<Contract[]>;
  getContractsWithFilters(filters: {
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  }): Promise<ContractWithDetails[]>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: number, contract: Partial<InsertContract>): Promise<Contract | undefined>;

  // Contract Templates
  getContractTemplate(id: string): Promise<ContractTemplate | undefined>;

  // Admin methods
  getAllUsers(): Promise<User[]>;
  getAllBookings(): Promise<BookingWithDetails[]>;
  getContracts(filters: any): Promise<ContractWithDetails[]>;
  getVehicleBrands(): Promise<VehicleBrand[]>;
  createVehicleBrand(brand: InsertVehicleBrand): Promise<VehicleBrand>;
  updateVehicleBrand(id: number, brand: Partial<InsertVehicleBrand>): Promise<VehicleBrand | undefined>;
  deleteVehicleBrand(id: number): Promise<boolean>;
  getDefaultContractTemplate(): Promise<ContractTemplate | undefined>;
  createContractTemplate(template: InsertContractTemplate): Promise<ContractTemplate>;
  updateContractTemplate(id: number, template: Partial<InsertContractTemplate>): Promise<ContractTemplate | undefined>;

  // Contract Audit
  getContractAuditLogs(contractId: number): Promise<ContractAuditLog[]>;
  createContractAuditLog(log: InsertContractAuditLog): Promise<ContractAuditLog>;

  // Vehicle Brands
  getVehicleBrands(): Promise<VehicleBrand[]>;
  createVehicleBrand(brand: InsertVehicleBrand): Promise<VehicleBrand>;
  updateVehicleBrand(id: number, brand: Partial<InsertVehicleBrand>): Promise<VehicleBrand | undefined>;
  deleteVehicleBrand(id: number): Promise<boolean>;

  // Vehicle availability management
  getVehicleAvailability(vehicleId: number): Promise<VehicleAvailability[]>;
  setVehicleAvailability(availability: InsertVehicleAvailability): Promise<VehicleAvailability>;
  updateVehicleAvailability(id: number, availability: Partial<InsertVehicleAvailability>): Promise<VehicleAvailability | undefined>;
  deleteVehicleAvailability(id: number): Promise<boolean>;
  checkAvailabilityConflict(vehicleId: number, startDate: string, endDate: string, excludeId?: number): Promise<boolean>;

  // Waiting queue management
  getWaitingQueue(vehicleId: number): Promise<WaitingQueue[]>;
  getUserWaitingQueue(userId: number): Promise<WaitingQueue[]>;
  addToWaitingQueue(queueEntry: InsertWaitingQueue): Promise<WaitingQueue>;
  removeFromWaitingQueue(id: number): Promise<boolean>;
  updateWaitingQueueStatus(id: number, data: Partial<InsertWaitingQueue>): Promise<WaitingQueue | undefined>;

  // Extended methods
  getBookingWithDetails(id: number): Promise<BookingWithDetails | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }



  // Vehicles
  async getVehicle(id: number): Promise<VehicleWithOwner | undefined> {
    const [result] = await db
      .select()
      .from(vehicles)
      .leftJoin(users, eq(vehicles.ownerId, users.id))
      .where(eq(vehicles.id, id));

    if (!result) return undefined;

    return {
      ...result.vehicles,
      owner: result.users!,
    };
  }

  async getVehiclesByOwner(ownerId: number): Promise<Vehicle[]> {
    return await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.ownerId, ownerId))
      .orderBy(desc(vehicles.createdAt));
  }

  async searchVehicles(filters: {
    location?: string;
    category?: string;
    priceMin?: number;
    priceMax?: number;
    startDate?: Date;
    endDate?: Date;
    features?: string[];
  }): Promise<VehicleWithOwner[]> {
    const conditions = [eq(vehicles.isAvailable, true)];

    if (filters.location) {
      conditions.push(ilike(vehicles.location, `%${filters.location}%`));
    }

    if (filters.category) {
      conditions.push(eq(vehicles.category, filters.category));
    }

    if (filters.priceMin) {
      conditions.push(gte(vehicles.pricePerDay, filters.priceMin.toString()));
    }

    if (filters.priceMax) {
      conditions.push(lte(vehicles.pricePerDay, filters.priceMax.toString()));
    }

    const results = await db
      .select()
      .from(vehicles)
      .leftJoin(users, eq(vehicles.ownerId, users.id))
      .where(and(...conditions))
      .orderBy(desc(vehicles.createdAt));

    return results.map(result => ({
      ...result.vehicles,
      owner: result.users!,
    }));
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const [vehicle] = await db
      .insert(vehicles)
      .values({
        ...insertVehicle,
        features: (insertVehicle.features as string[]) || [],
        images: (insertVehicle.images as string[]) || []
      })
      .returning();
    return vehicle;
  }

  async updateVehicle(id: number, updateVehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const updateData: any = { 
      ...updateVehicle, 
      updatedAt: new Date()
    };
    
    if (updateVehicle.features !== undefined) {
      updateData.features = updateVehicle.features as string[];
    }
    
    if (updateVehicle.images !== undefined) {
      updateData.images = updateVehicle.images as string[];
    }
    
    const [vehicle] = await db
      .update(vehicles)
      .set(updateData)
      .where(eq(vehicles.id, id))
      .returning();
    return vehicle || undefined;
  }

  async deleteVehicle(id: number): Promise<boolean> {
    const result = await db.delete(vehicles).where(eq(vehicles.id, id));
    return (result.rowCount || 0) > 0;
  }

  async hasActiveBookings(vehicleId: number): Promise<boolean> {
    const [result] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(bookings)
      .where(
        and(
          eq(bookings.vehicleId, vehicleId),
          sql`${bookings.status} IN ('pending', 'approved', 'active')`
        )
      );
    return (result?.count || 0) > 0;
  }

  async hasAnyBookings(vehicleId: number): Promise<boolean> {
    const [result] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(bookings)
      .where(eq(bookings.vehicleId, vehicleId));
    return (result?.count || 0) > 0;
  }

  // Bookings
  async getBooking(id: number): Promise<BookingWithDetails | undefined> {
    const [result] = await db
      .select()
      .from(bookings)
      .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .leftJoin(users, eq(vehicles.ownerId, users.id))
      .where(eq(bookings.id, id));

    if (!result) return undefined;

    const [renter] = await db.select().from(users).where(eq(users.id, result.bookings.renterId));

    return {
      ...result.bookings,
      vehicle: {
        ...result.vehicles!,
        owner: result.users!,
      },
      renter: renter!,
      owner: result.users!,
    };
  }

  async getBookingsByUser(userId: number, type: 'renter' | 'owner'): Promise<BookingWithDetails[]> {
    const field = type === 'renter' ? bookings.renterId : bookings.ownerId;
    
    const results = await db
      .select()
      .from(bookings)
      .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .leftJoin(users, eq(vehicles.ownerId, users.id))
      .where(eq(field, userId))
      .orderBy(desc(bookings.createdAt));

    const bookingDetails = await Promise.all(
      results.map(async (result) => {
        const [renter] = await db.select().from(users).where(eq(users.id, result.bookings.renterId));
        
        return {
          ...result.bookings,
          vehicle: {
            ...result.vehicles!,
            owner: result.users!,
          },
          renter: renter!,
          owner: result.users!,
        };
      })
    );

    return bookingDetails;
  }

  async getBookingsByVehicle(vehicleId: number): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .where(eq(bookings.vehicleId, vehicleId))
      .orderBy(desc(bookings.createdAt));
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db
      .insert(bookings)
      .values(insertBooking)
      .returning();
    return booking;
  }

  async updateBooking(id: number, updateBooking: Partial<InsertBooking>): Promise<Booking | undefined> {
    const [booking] = await db
      .update(bookings)
      .set({ ...updateBooking, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return booking || undefined;
  }

  async blockVehicleDatesForBooking(vehicleId: number, startDate: string, endDate: string, bookingId: number): Promise<VehicleAvailability> {
    // Check if dates are already blocked for this booking
    const existingBlock = await db
      .select()
      .from(vehicleAvailability)
      .where(
        and(
          eq(vehicleAvailability.vehicleId, vehicleId),
          eq(vehicleAvailability.startDate, startDate),
          eq(vehicleAvailability.endDate, endDate),
          ilike(vehicleAvailability.reason, `%Booking #${bookingId}%`)
        )
      )
      .limit(1);

    if (existingBlock.length > 0) {
      return existingBlock[0];
    }

    // Create a blocked availability period for the booking
    const [result] = await db
      .insert(vehicleAvailability)
      .values({
        vehicleId,
        startDate,
        endDate,
        isAvailable: false,
        reason: `Reservado - Booking #${bookingId}`,
      })
      .returning();
    return result;
  }

  async checkAndBlockCompletedBooking(bookingId: number): Promise<boolean> {
    // Get booking details
    const booking = await this.getBooking(bookingId);
    if (!booking || booking.status !== "completed") {
      return false;
    }

    // Check if there's a signed contract for this booking
    const contracts = await this.getContractsByBooking(bookingId);
    const signedContract = contracts.find(contract => contract.status === "signed");
    
    if (signedContract) {
      // Block the vehicle dates automatically
      await this.blockVehicleDatesForBooking(
        booking.vehicleId,
        booking.startDate.toISOString().split('T')[0],
        booking.endDate.toISOString().split('T')[0],
        bookingId
      );
      return true;
    }
    
    return false;
  }

  async releaseExpiredVehicleBlocks(): Promise<{ releasedBlocks: VehicleAvailability[], notifiedUsers: any[] }> {
    const today = new Date().toISOString().split('T')[0];
    
    // Find all blocks that have expired (end date is before today)
    const expiredBlocks = await db
      .select()
      .from(vehicleAvailability)
      .where(
        and(
          eq(vehicleAvailability.isAvailable, false),
          sql`${vehicleAvailability.endDate} < ${today}`,
          ilike(vehicleAvailability.reason, '%Reservado - Booking #%')
        )
      );

    const releasedBlocks: VehicleAvailability[] = [];
    const notifiedUsers: any[] = [];

    for (const block of expiredBlocks) {
      // Remove the expired block
      await db
        .delete(vehicleAvailability)
        .where(eq(vehicleAvailability.id, block.id));

      releasedBlocks.push(block);

      // Notify waiting queue users for this vehicle
      const queueNotifications = await this.notifyWaitingQueueUsers(
        block.vehicleId,
        block.startDate,
        block.endDate
      );
      
      notifiedUsers.push(...queueNotifications);
    }

    return { releasedBlocks, notifiedUsers };
  }

  async notifyWaitingQueueUsers(vehicleId: number, availableStartDate: string, availableEndDate: string): Promise<any[]> {
    // Get all users waiting for this vehicle
    const waitingUsers = await db
      .select()
      .from(waitingQueue)
      .leftJoin(users, eq(waitingQueue.userId, users.id))
      .leftJoin(vehicles, eq(waitingQueue.vehicleId, vehicles.id))
      .where(eq(waitingQueue.vehicleId, vehicleId))
      .orderBy(waitingQueue.createdAt); // First come, first served

    const notifiedUsers = [];

    for (const queueEntry of waitingUsers) {
      const user = queueEntry.users;
      const vehicle = queueEntry.vehicles;
      const queue = queueEntry.waiting_queue;

      if (!user || !vehicle || !queue) continue;

      // Check if the available dates overlap with the user's desired dates
      const userStartDate = queue.desiredStartDate;
      const userEndDate = queue.desiredEndDate;
      
      // Simple date overlap check
      const hasOverlap = userStartDate <= availableEndDate && userEndDate >= availableStartDate;
      
      if (hasOverlap) {
        // Create a notification record (you can extend this to send emails, SMS, etc.)
        const notification = {
          userId: user.id,
          vehicleId: vehicle.id,
          queueId: queue.id,
          message: `Boa notícia! O veículo ${vehicle.brand} ${vehicle.model} está disponível para suas datas desejadas (${queue.desiredStartDate} - ${queue.desiredEndDate}). Reserve agora!`,
          type: 'vehicle_available',
          createdAt: new Date().toISOString(),
          userEmail: user.email,
          userName: user.name,
          vehicleName: `${vehicle.brand} ${vehicle.model}`,
          desiredDates: `${queue.desiredStartDate} - ${queue.desiredEndDate}`
        };

        notifiedUsers.push(notification);
        
        // Here you could implement actual notification sending:
        // - Email notification
        // - SMS notification  
        // - In-app notification
        // For now, we'll just log it
        console.log(`🔔 Notification sent to ${user.name} (${user.email}) about available vehicle ${vehicle.brand} ${vehicle.model}`);
      }
    }

    return notifiedUsers;
  }

  async checkVehicleAvailability(vehicleId: number, startDate: Date, endDate: Date): Promise<boolean> {
    const conflictingBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.vehicleId, vehicleId),
          or(
            eq(bookings.status, "approved"),
            eq(bookings.status, "active")
          ),
          or(
            and(
              lte(bookings.startDate, startDate),
              gte(bookings.endDate, startDate)
            ),
            and(
              lte(bookings.startDate, endDate),
              gte(bookings.endDate, endDate)
            ),
            and(
              gte(bookings.startDate, startDate),
              lte(bookings.endDate, endDate)
            )
          )
        )
      );

    return conflictingBookings.length === 0;
  }

  // Reviews
  async getReviewsByVehicle(vehicleId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.vehicleId, vehicleId))
      .orderBy(desc(reviews.createdAt));
  }

  async getReviewsByUser(userId: number, type: 'given' | 'received'): Promise<Review[]> {
    const field = type === 'given' ? reviews.reviewerId : reviews.revieweeId;
    return await db
      .select()
      .from(reviews)
      .where(eq(field, userId))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const [review] = await db
      .insert(reviews)
      .values(insertReview)
      .returning();
    return review;
  }

  // Messages
  async getMessagesBetweenUsers(userId1: number, userId2: number, bookingId?: number): Promise<Message[]> {
    console.log(`Storage: Getting messages between ${userId1} and ${userId2}, bookingId: ${bookingId}`);
    
    const baseCondition = or(
      and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
      and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
    );

    let whereCondition = baseCondition;
    if (bookingId) {
      whereCondition = and(baseCondition, eq(messages.bookingId, bookingId));
    }

    const result = await db
      .select()
      .from(messages)
      .where(whereCondition)
      .orderBy(asc(messages.createdAt));
      
    console.log(`Storage: Found ${result.length} messages`);
    return result;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async markMessagesAsRead(receiverId: number, senderId: number): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.receiverId, receiverId),
          eq(messages.senderId, senderId)
        )
      );
  }

  // Contracts
  async getContract(id: number): Promise<Contract | undefined> {
    const [contract] = await db.select().from(contracts).where(eq(contracts.id, id));
    return contract || undefined;
  }

  async getContractWithDetails(id: number): Promise<ContractWithDetails | undefined> {
    const [result] = await db
      .select()
      .from(contracts)
      .leftJoin(bookings, eq(contracts.bookingId, bookings.id))
      .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .leftJoin(users, eq(vehicles.ownerId, users.id))
      .where(eq(contracts.id, id));

    if (!result) return undefined;

    // Get renter details
    const [renterResult] = await db
      .select()
      .from(users)
      .where(eq(users.id, result.bookings!.renterId));

    return {
      ...result.contracts,
      booking: {
        ...result.bookings!,
        vehicle: {
          ...result.vehicles!,
          owner: result.users!,
        },
        renter: renterResult,
        owner: result.users!,
      }
    } as ContractWithDetails;
  }

  async getContractByExternalId(externalDocumentId: string): Promise<Contract | undefined> {
    const [contract] = await db
      .select()
      .from(contracts)
      .where(eq(contracts.externalDocumentId, externalDocumentId));
    return contract || undefined;
  }

  async getContractsByBooking(bookingId: number): Promise<Contract[]> {
    return await db
      .select()
      .from(contracts)
      .where(eq(contracts.bookingId, bookingId))
      .orderBy(desc(contracts.createdAt));
  }

  async getContractsWithFilters(filters: {
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  }): Promise<ContractWithDetails[]> {
    const conditions = [];

    if (filters.status) {
      conditions.push(eq(contracts.status, filters.status));
    }

    if (filters.dateFrom) {
      conditions.push(gte(contracts.createdAt, filters.dateFrom));
    }

    if (filters.dateTo) {
      conditions.push(lte(contracts.createdAt, filters.dateTo));
    }

    let query = db
      .select()
      .from(contracts)
      .leftJoin(bookings, eq(contracts.bookingId, bookings.id))
      .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .leftJoin(users, eq(vehicles.ownerId, users.id))
      .orderBy(desc(contracts.createdAt));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    if (filters.limit) {
      query = query.limit(filters.limit) as any;
    }

    if (filters.offset) {
      query = query.offset(filters.offset) as any;
    }

    const results = await query;

    // Transform results to include renter details
    const contractsWithDetails: ContractWithDetails[] = [];

    for (const result of results) {
      const [renterResult] = await db
        .select()
        .from(users)
        .where(eq(users.id, result.bookings!.renterId));

      contractsWithDetails.push({
        ...result.contracts,
        booking: {
          ...result.bookings!,
          vehicle: {
            ...result.vehicles!,
            owner: result.users!,
          },
          renter: renterResult,
          owner: result.users!,
        }
      } as ContractWithDetails);
    }

    return contractsWithDetails;
  }





  // Contract Templates
  async getContractTemplate(id: string): Promise<ContractTemplate | undefined> {
    const [template] = await db
      .select()
      .from(contractTemplates)
      .where(eq(contractTemplates.id, parseInt(id)));
    return template || undefined;
  }

  async getDefaultContractTemplate(): Promise<ContractTemplate | undefined> {
    const [template] = await db
      .select()
      .from(contractTemplates)
      .where(and(eq(contractTemplates.isActive, true), eq(contractTemplates.category, "standard")))
      .orderBy(desc(contractTemplates.version))
      .limit(1);
    return template || undefined;
  }

  async createContractTemplate(insertTemplate: InsertContractTemplate): Promise<ContractTemplate> {
    const [template] = await db
      .insert(contractTemplates)
      .values([insertTemplate])
      .returning();
    return template;
  }

  async updateContractTemplate(id: number, updateTemplate: Partial<InsertContractTemplate>): Promise<ContractTemplate | undefined> {
    const updateData: any = { ...updateTemplate, updatedAt: new Date() };
    
    if (updateData.fields && Array.isArray(updateData.fields)) {
      updateData.fields = updateData.fields.map((field: any) => ({
        name: field.name,
        type: field.type,
        required: field.required,
        defaultValue: field.defaultValue as string | undefined
      }));
    }
    
    const [template] = await db
      .update(contractTemplates)
      .set(updateData)
      .where(eq(contractTemplates.id, id))
      .returning();
    return template || undefined;
  }

  // Contract Audit
  async getContractAuditLogs(contractId: number): Promise<ContractAuditLog[]> {
    return await db
      .select()
      .from(contractAuditLog)
      .where(eq(contractAuditLog.contractId, contractId))
      .orderBy(desc(contractAuditLog.createdAt));
  }

  async createContractAuditLog(insertLog: InsertContractAuditLog): Promise<ContractAuditLog> {
    const logData: any = { ...insertLog };
    
    if (logData.details && typeof logData.details === 'object') {
      logData.details = {
        ip: logData.details.ip as string | undefined,
        userAgent: logData.details.userAgent as string | undefined,
        previousStatus: logData.details.previousStatus as string | undefined,
        newStatus: logData.details.newStatus as string | undefined,
        metadata: logData.details.metadata
      };
    }
    
    const [log] = await db
      .insert(contractAuditLog)
      .values([logData])
      .returning();
    return log;
  }

  // Extended method for booking with details
  async getBookingWithDetails(id: number): Promise<BookingWithDetails | undefined> {
    const [result] = await db
      .select()
      .from(bookings)
      .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .leftJoin(users, eq(vehicles.ownerId, users.id))
      .where(eq(bookings.id, id));

    if (!result) return undefined;

    // Get renter details
    const [renterResult] = await db
      .select()
      .from(users)
      .where(eq(users.id, result.bookings.renterId));

    return {
      ...result.bookings,
      vehicle: {
        ...result.vehicles!,
        owner: result.users!,
      },
      renter: renterResult,
      owner: result.users!,
    } as BookingWithDetails;
  }

  // Vehicle Brands
  async getVehicleBrands(): Promise<VehicleBrand[]> {
    return await db.select().from(vehicleBrands).orderBy(asc(vehicleBrands.name));
  }

  async createVehicleBrand(brand: InsertVehicleBrand): Promise<VehicleBrand> {
    const [newBrand] = await db
      .insert(vehicleBrands)
      .values(brand)
      .returning();
    return newBrand;
  }

  async updateVehicleBrand(id: number, brand: Partial<InsertVehicleBrand>): Promise<VehicleBrand | undefined> {
    const [updatedBrand] = await db
      .update(vehicleBrands)
      .set(brand)
      .where(eq(vehicleBrands.id, id))
      .returning();
    return updatedBrand || undefined;
  }

  async deleteVehicleBrand(id: number): Promise<boolean> {
    const result = await db
      .delete(vehicleBrands)
      .where(eq(vehicleBrands.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Vehicle Availability Management
  async getVehicleAvailability(vehicleId: number): Promise<VehicleAvailability[]> {
    return await db
      .select()
      .from(vehicleAvailability)
      .where(eq(vehicleAvailability.vehicleId, vehicleId))
      .orderBy(asc(vehicleAvailability.startDate));
  }

  async setVehicleAvailability(availability: InsertVehicleAvailability): Promise<VehicleAvailability> {
    const [result] = await db
      .insert(vehicleAvailability)
      .values(availability)
      .returning();
    return result;
  }

  async updateVehicleAvailability(id: number, availability: Partial<InsertVehicleAvailability>): Promise<VehicleAvailability | undefined> {
    const [result] = await db
      .update(vehicleAvailability)
      .set(availability)
      .where(eq(vehicleAvailability.id, id))
      .returning();
    return result || undefined;
  }

  async deleteVehicleAvailability(id: number): Promise<boolean> {
    const result = await db
      .delete(vehicleAvailability)
      .where(eq(vehicleAvailability.id, id));
    return (result.rowCount || 0) > 0;
  }

  async checkAvailabilityConflict(vehicleId: number, startDate: string, endDate: string, excludeId?: number): Promise<boolean> {
    const conditions = [
      eq(vehicleAvailability.vehicleId, vehicleId),
      or(
        and(
          lte(vehicleAvailability.startDate, startDate),
          gte(vehicleAvailability.endDate, startDate)
        ),
        and(
          lte(vehicleAvailability.startDate, endDate),
          gte(vehicleAvailability.endDate, endDate)
        ),
        and(
          gte(vehicleAvailability.startDate, startDate),
          lte(vehicleAvailability.endDate, endDate)
        )
      )
    ];

    if (excludeId) {
      conditions.push(sql`${vehicleAvailability.id} != ${excludeId}`);
    }

    const conflicts = await db
      .select()
      .from(vehicleAvailability)
      .where(and(...conditions));

    return conflicts.length > 0;
  }

  // Waiting Queue Management
  async getWaitingQueue(vehicleId: number): Promise<WaitingQueue[]> {
    return await db
      .select()
      .from(waitingQueue)
      .where(and(
        eq(waitingQueue.vehicleId, vehicleId),
        eq(waitingQueue.isActive, true)
      ))
      .orderBy(asc(waitingQueue.createdAt));
  }

  async getUserWaitingQueue(userId: number): Promise<WaitingQueue[]> {
    return await db
      .select()
      .from(waitingQueue)
      .where(and(
        eq(waitingQueue.userId, userId),
        eq(waitingQueue.isActive, true)
      ))
      .orderBy(desc(waitingQueue.createdAt));
  }

  async addToWaitingQueue(queueEntry: InsertWaitingQueue): Promise<WaitingQueue> {
    // Check if user is already in queue for this vehicle and dates
    const existingEntry = await db
      .select()
      .from(waitingQueue)
      .where(and(
        eq(waitingQueue.vehicleId, queueEntry.vehicleId),
        eq(waitingQueue.userId, queueEntry.userId),
        eq(waitingQueue.desiredStartDate, queueEntry.desiredStartDate),
        eq(waitingQueue.desiredEndDate, queueEntry.desiredEndDate),
        eq(waitingQueue.isActive, true)
      ));

    if (existingEntry.length > 0) {
      return existingEntry[0];
    }

    const [result] = await db
      .insert(waitingQueue)
      .values(queueEntry)
      .returning();
    return result;
  }

  async removeFromWaitingQueue(id: number): Promise<boolean> {
    const result = await db
      .update(waitingQueue)
      .set({ isActive: false })
      .where(eq(waitingQueue.id, id));
    return (result.rowCount || 0) > 0;
  }

  async updateWaitingQueueStatus(id: number, data: Partial<InsertWaitingQueue>): Promise<WaitingQueue | undefined> {
    const [result] = await db
      .update(waitingQueue)
      .set(data)
      .where(eq(waitingQueue.id, id))
      .returning();
    return result || undefined;
  }

  // Admin methods
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }





  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [result] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result || undefined;
  }

  async updateUserAdmin(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [result] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return result || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db
      .delete(users)
      .where(eq(users.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getAllBookings(): Promise<BookingWithDetails[]> {
    const results = await db
      .select()
      .from(bookings)
      .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .leftJoin(users, eq(vehicles.ownerId, users.id))
      .orderBy(desc(bookings.createdAt));

    return results.map(result => ({
      ...result.bookings,
      vehicle: result.vehicles ? {
        ...result.vehicles,
        owner: result.users!
      } : undefined
    })) as BookingWithDetails[];
  }

  async getBookingById(id: number): Promise<BookingWithDetails | undefined> {
    const results = await db
      .select()
      .from(bookings)
      .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .leftJoin(users, eq(vehicles.ownerId, users.id))
      .where(eq(bookings.id, id));

    if (results.length === 0) return undefined;

    const result = results[0];
    return {
      ...result.bookings,
      vehicle: result.vehicles ? {
        ...result.vehicles,
        owner: result.users!
      } : undefined
    } as BookingWithDetails;
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking | undefined> {
    const [result] = await db
      .update(bookings)
      .set({ status })
      .where(eq(bookings.id, id))
      .returning();
    return result || undefined;
  }

  async deleteBooking(id: number): Promise<boolean> {
    const result = await db
      .delete(bookings)
      .where(eq(bookings.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getContracts(filters: any): Promise<ContractWithDetails[]> {
    // Return empty array for now - contracts not implemented yet
    return [];
  }

  async createContract(data: any): Promise<any> {
    // Placeholder for contract creation
    return { id: 1, ...data };
  }

  async updateContract(id: number, data: any): Promise<any> {
    // Placeholder for contract update
    return { id, ...data };
  }

  async deleteContract(id: number): Promise<boolean> {
    // Placeholder for contract deletion
    return true;
  }
}

export const storage = new DatabaseStorage();
