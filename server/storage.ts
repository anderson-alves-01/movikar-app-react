import { 
  users, vehicles, bookings, reviews, messages, contracts, contractTemplates, contractAuditLog, vehicleBrands, vehicleAvailability, waitingQueue, referrals, userRewards, rewardTransactions, userActivity,
  type User, type InsertUser, type Vehicle, type InsertVehicle, 
  type Booking, type InsertBooking, type Review, type InsertReview,
  type Message, type InsertMessage, type VehicleWithOwner, type BookingWithDetails,
  type Contract, type InsertContract, type ContractTemplate, type InsertContractTemplate,
  type ContractAuditLog, type InsertContractAuditLog, type ContractWithDetails,
  type VehicleBrand, type InsertVehicleBrand, type VehicleAvailability, type InsertVehicleAvailability,
  type WaitingQueue, type InsertWaitingQueue, type Referral, type InsertReferral,
  type UserRewards, type InsertUserRewards, type RewardTransaction, type InsertRewardTransaction,
  type UserActivity, type InsertUserActivity
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, asc, or, like, ilike, sql, lt, ne, inArray, not } from "drizzle-orm";

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
    transmission?: string;
    fuel?: string;
    rating?: number;
    yearMin?: number;
    yearMax?: number;
    seatsMin?: number;
    seatsMax?: number;
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
  getUnreadMessageCount(userId: number): Promise<number>;

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
  getAllUsers(page?: number, limit?: number, search?: string, role?: string, verified?: string): Promise<{ users: User[], total: number, totalPages: number, currentPage: number }>;
  getAllBookings(page?: number, limit?: number, search?: string, status?: string, paymentStatus?: string): Promise<{ bookings: BookingWithDetails[], total: number, totalPages: number, currentPage: number }>;
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

  // Referral system methods
  getReferralByCode(code: string): Promise<Referral | undefined>;
  getUserReferrals(userId: number): Promise<Referral[]>;
  createReferral(referral: InsertReferral): Promise<Referral>;
  updateReferral(id: number, referral: Partial<InsertReferral>): Promise<Referral | undefined>;
  generateReferralCode(): string;

  // Rewards system methods
  getUserRewards(userId: number): Promise<UserRewards | undefined>;
  createUserRewards(rewards: InsertUserRewards): Promise<UserRewards>;
  updateUserRewards(userId: number, rewards: Partial<InsertUserRewards>): Promise<UserRewards | undefined>;
  addRewardTransaction(transaction: InsertRewardTransaction): Promise<RewardTransaction>;
  getUserRewardTransactions(userId: number): Promise<RewardTransaction[]>;
  processReferralReward(referralId: number): Promise<void>;

  // User activity tracking methods
  trackUserActivity(activity: InsertUserActivity): Promise<UserActivity>;
  getUserActivity(userId: number, type?: string): Promise<UserActivity[]>;
  getPersonalizedSuggestions(userId: number): Promise<VehicleWithOwner[]>;

  // Contract methods for user
  getContractsByUser(userId: number): Promise<ContractWithDetails[]>;
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
    transmission?: string;
    fuel?: string;
    rating?: number;
    yearMin?: number;
    yearMax?: number;
    seatsMin?: number;
    seatsMax?: number;
  }): Promise<VehicleWithOwner[]> {
    try {
      // Use raw SQL to avoid Drizzle schema issues
      const query = `
        SELECT 
          v.*,
          u.name as owner_name,
          u.email as owner_email,
          u.phone as owner_phone,
          u.profile_image as owner_profile_image,
          u.is_verified as owner_is_verified
        FROM vehicles v
        LEFT JOIN users u ON v.owner_id = u.id
        WHERE v.is_available = true
        ORDER BY v.created_at DESC
      `;
      
      const results = await db.execute(sql.raw(query));
      
      return results.map((row: any) => ({
        id: row.id,
        ownerId: row.owner_id,
        brand: row.brand,
        model: row.model,
        year: row.year,
        color: row.color,
        transmission: row.transmission,
        fuel: row.fuel,
        seats: row.seats,
        category: row.category,
        features: row.features,
        images: row.images,
        location: row.location,
        latitude: row.latitude,
        longitude: row.longitude,
        pricePerDay: row.price_per_day,
        pricePerWeek: row.price_per_week,
        pricePerMonth: row.price_per_month,
        description: row.description,
        isAvailable: row.is_available,
        isVerified: row.is_verified,
        rating: row.rating,
        totalBookings: row.total_bookings,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        owner: {
          id: row.owner_id,
          name: row.owner_name || '',
          email: row.owner_email || '',
          phone: row.owner_phone || '',
          profileImage: row.owner_profile_image,
          isVerified: row.owner_is_verified || false,
        }
      }));
    } catch (error) {
      console.error("Error in searchVehicles:", error);
      throw error;
    }
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

  async getUnreadMessageCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(
        and(
          eq(messages.receiverId, userId),
          eq(messages.isRead, false)
        )
      );
    
    return result[0]?.count || 0;
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
    
    // If no template exists, create a default one
    if (!template) {
      const defaultTemplate: InsertContractTemplate = {
        name: "Contrato de Locação Padrão",
        category: "standard",
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h1 style="text-align: center;">CONTRATO DE LOCAÇÃO DE VEÍCULO</h1>
            <p><strong>Contrato Nº:</strong> {{contract.number}}</p>
            <p><strong>Data:</strong> {{contract.date}}</p>
            
            <h2>DADOS DO VEÍCULO</h2>
            <p><strong>Marca/Modelo:</strong> {{vehicle.brand}} {{vehicle.model}}</p>
            <p><strong>Ano:</strong> {{vehicle.year}}</p>
            <p><strong>Categoria:</strong> {{vehicle.category}}</p>
            
            <h2>LOCATÁRIO</h2>
            <p><strong>Nome:</strong> {{renter.name}}</p>
            <p><strong>Email:</strong> {{renter.email}}</p>
            <p><strong>Telefone:</strong> {{renter.phone}}</p>
            
            <h2>PROPRIETÁRIO</h2>
            <p><strong>Nome:</strong> {{owner.name}}</p>
            <p><strong>Email:</strong> {{owner.email}}</p>
            <p><strong>Telefone:</strong> {{owner.phone}}</p>
            
            <h2>PERÍODO DE LOCAÇÃO</h2>
            <p><strong>Data de Início:</strong> {{booking.startDate}}</p>
            <p><strong>Data de Término:</strong> {{booking.endDate}}</p>
            
            <h2>VALORES</h2>
            <p><strong>Valor Total:</strong> {{booking.totalPrice}}</p>
            <p><strong>Taxa de Serviço:</strong> {{booking.serviceFee}}</p>
            <p><strong>Taxa de Seguro:</strong> {{booking.insuranceFee}}</p>
            
            <h2>TERMOS E CONDIÇÕES</h2>
            <p>1. O locatário se compromete a devolver o veículo nas mesmas condições.</p>
            <p>2. É proibido fumar no interior do veículo.</p>
            <p>3. O locatário é responsável por multas e infrações durante o período de locação.</p>
            
            <div style="margin-top: 50px;">
              <div style="float: left; width: 45%;">
                <p>________________________</p>
                <p>Assinatura do Locatário</p>
              </div>
              <div style="float: right; width: 45%;">
                <p>________________________</p>
                <p>Assinatura do Proprietário</p>
              </div>
            </div>
          </div>
        `,
        fields: [
          { name: "vehicle.brand", type: "text", required: true },
          { name: "vehicle.model", type: "text", required: true },
          { name: "renter.name", type: "text", required: true },
          { name: "owner.name", type: "text", required: true }
        ],
        isActive: true,
        version: 1
      };
      
      return await this.createContractTemplate(defaultTemplate);
    }
    
    return template;
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

  // Referral system methods
  async getReferralByCode(code: string): Promise<Referral | undefined> {
    const [referral] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referralCode, code));
    return referral || undefined;
  }

  async getUserReferrals(userId: number): Promise<Referral[]> {
    return await db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerId, userId))
      .orderBy(desc(referrals.createdAt));
  }

  async createReferral(referral: InsertReferral): Promise<Referral> {
    const [newReferral] = await db
      .insert(referrals)
      .values(referral)
      .returning();
    return newReferral;
  }

  async updateReferral(id: number, referral: Partial<InsertReferral>): Promise<Referral | undefined> {
    const [updatedReferral] = await db
      .update(referrals)
      .set(referral)
      .where(eq(referrals.id, id))
      .returning();
    return updatedReferral || undefined;
  }

  generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Rewards system methods
  async getUserRewards(userId: number): Promise<UserRewards | undefined> {
    const [rewards] = await db
      .select()
      .from(userRewards)
      .where(eq(userRewards.userId, userId));
    return rewards || undefined;
  }

  async createUserRewards(rewards: InsertUserRewards): Promise<UserRewards> {
    const [newRewards] = await db
      .insert(userRewards)
      .values(rewards)
      .returning();
    return newRewards;
  }

  async updateUserRewards(userId: number, rewards: Partial<InsertUserRewards>): Promise<UserRewards | undefined> {
    const [updatedRewards] = await db
      .update(userRewards)
      .set(rewards)
      .where(eq(userRewards.userId, userId))
      .returning();
    return updatedRewards || undefined;
  }

  async addRewardTransaction(transaction: InsertRewardTransaction): Promise<RewardTransaction> {
    const [newTransaction] = await db
      .insert(rewardTransactions)
      .values(transaction)
      .returning();
    
    // Update user rewards
    const currentRewards = await this.getUserRewards(transaction.userId);
    
    if (currentRewards) {
      const newTotal = currentRewards.totalPoints + transaction.points;
      const newAvailable = transaction.type === 'earned' 
        ? currentRewards.availablePoints + transaction.points
        : currentRewards.availablePoints - Math.abs(transaction.points);
      const newUsed = transaction.type === 'used' 
        ? currentRewards.usedPoints + Math.abs(transaction.points)
        : currentRewards.usedPoints;

      await this.updateUserRewards(transaction.userId, {
        totalPoints: newTotal,
        availablePoints: Math.max(0, newAvailable),
        usedPoints: newUsed,
      });
    } else {
      // Create new rewards record
      await this.createUserRewards({
        userId: transaction.userId,
        totalPoints: transaction.points,
        availablePoints: transaction.type === 'earned' ? transaction.points : 0,
        usedPoints: transaction.type === 'used' ? Math.abs(transaction.points) : 0,
        referralCount: 0,
        successfulReferrals: 0,
      });
    }

    return newTransaction;
  }

  async getUserRewardTransactions(userId: number): Promise<RewardTransaction[]> {
    return await db
      .select()
      .from(rewardTransactions)
      .where(eq(rewardTransactions.userId, userId))
      .orderBy(desc(rewardTransactions.createdAt));
  }

  async processReferralReward(referralId: number): Promise<void> {
    const [referral] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.id, referralId));

    if (!referral || referral.rewardStatus !== 'pending') {
      return;
    }

    // Award points to referrer
    await this.addRewardTransaction({
      userId: referral.referrerId,
      type: 'earned',
      points: referral.rewardPoints,
      source: 'referral',
      sourceId: referralId,
      description: 'Recompensa por convidar um amigo',
    });

    // Update referral status
    await this.updateReferral(referralId, {
      status: 'completed',
      rewardStatus: 'awarded',
      completedAt: new Date(),
    });

    // Update referrer's referral count
    const rewards = await this.getUserRewards(referral.referrerId);
    if (rewards) {
      await this.updateUserRewards(referral.referrerId, {
        referralCount: rewards.referralCount + 1,
        successfulReferrals: rewards.successfulReferrals + 1,
      });
    }
  }

  // User activity tracking methods
  async trackUserActivity(activity: InsertUserActivity): Promise<UserActivity> {
    const [newActivity] = await db
      .insert(userActivity)
      .values(activity)
      .returning();
    return newActivity;
  }

  async getUserActivity(userId: number, type?: string): Promise<UserActivity[]> {
    const conditions = [eq(userActivity.userId, userId)];
    
    if (type) {
      conditions.push(eq(userActivity.activityType, type));
    }

    return await db
      .select()
      .from(userActivity)
      .where(and(...conditions))
      .orderBy(desc(userActivity.createdAt))
      .limit(100);
  }

  async getPersonalizedSuggestions(userId: number): Promise<VehicleWithOwner[]> {
    // Get user's search and browsing history
    const userActivities = await this.getUserActivity(userId);
    
    // Analyze user preferences from activity
    const categoryPreferences: Record<string, number> = {};
    const locationPreferences: Record<string, number> = {};
    const priceRanges: number[] = [];
    const viewedVehicleIds: number[] = [];

    userActivities.forEach(activity => {
      if (activity.filters) {
        const filters = activity.filters as any;
        
        // Track category preferences
        if (filters.category) {
          categoryPreferences[filters.category] = (categoryPreferences[filters.category] || 0) + 1;
        }
        
        // Track location preferences
        if (filters.location) {
          locationPreferences[filters.location] = (locationPreferences[filters.location] || 0) + 1;
        }
        
        // Track price preferences
        if (filters.priceMax) {
          priceRanges.push(filters.priceMax);
        }
      }
      
      // Track viewed vehicles
      if (activity.vehicleId && activity.activityType === 'vehicle_view') {
        viewedVehicleIds.push(activity.vehicleId);
      }
    });

    // Build suggestion query based on preferences
    const mostPreferredCategory = Object.keys(categoryPreferences).sort((a, b) => 
      categoryPreferences[b] - categoryPreferences[a]
    )[0];
    
    const mostPreferredLocation = Object.keys(locationPreferences).sort((a, b) => 
      locationPreferences[b] - locationPreferences[a]
    )[0];

    const avgPrice = priceRanges.length > 0 ? 
      priceRanges.reduce((sum, price) => sum + price, 0) / priceRanges.length : 
      null;

    // Build query conditions
    const conditions = [eq(vehicles.isAvailable, true)];
    
    if (viewedVehicleIds.length > 0) {
      conditions.push(not(inArray(vehicles.id, viewedVehicleIds)));
    }
    
    if (mostPreferredCategory) {
      conditions.push(eq(vehicles.category, mostPreferredCategory));
    }
    
    if (mostPreferredLocation) {
      conditions.push(ilike(vehicles.location, `%${mostPreferredLocation}%`));
    }
    
    if (avgPrice) {
      conditions.push(lte(vehicles.pricePerDay, (avgPrice * 1.2).toString()));
    }

    const results = await db
      .select()
      .from(vehicles)
      .leftJoin(users, eq(vehicles.ownerId, users.id))
      .where(and(...conditions))
      .orderBy(desc(vehicles.rating), desc(vehicles.createdAt))
      .limit(10);

    return results.map(result => ({
      ...result.vehicles,
      owner: result.users!,
    })) as VehicleWithOwner[];
  }

  // Contract methods for user
  async getContractsByUser(userId: number): Promise<ContractWithDetails[]> {
    const results = await db
      .select()
      .from(contracts)
      .leftJoin(bookings, eq(contracts.bookingId, bookings.id))
      .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .leftJoin(users, eq(vehicles.ownerId, users.id))
      .where(or(
        eq(bookings.renterId, userId),
        eq(bookings.ownerId, userId)
      ))
      .orderBy(desc(contracts.createdAt));

    return results.map(result => {
      const ownerUser = result.users!;
      
      return {
        ...result.contracts,
        booking: {
          ...result.bookings!,
          vehicle: result.vehicles!,
          renter: ownerUser, // This will be replaced with actual renter data
          owner: ownerUser,
        },
      } as ContractWithDetails;
    });
  }

  async updateWaitingQueueStatus(id: number, data: Partial<InsertWaitingQueue>): Promise<WaitingQueue | undefined> {
    const [result] = await db
      .update(waitingQueue)
      .set(data)
      .where(eq(waitingQueue.id, id))
      .returning();
    return result || undefined;
  }

  // Admin methods with pagination
  async getAllUsers(page: number = 1, limit: number = 10, search: string = '', role: string = '', verified: string = ''): Promise<{ users: User[], total: number, totalPages: number, currentPage: number }> {
    const offset = (page - 1) * limit;
    
    let query = db.select().from(users);
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(users);
    
    // Apply filters
    const conditions = [];
    
    if (search) {
      const searchCondition = or(
        ilike(users.name, `%${search}%`),
        ilike(users.email, `%${search}%`),
        ilike(users.phone, `%${search}%`)
      );
      conditions.push(searchCondition);
    }
    
    if (role) {
      conditions.push(eq(users.role, role));
    }
    
    if (verified === 'true') {
      conditions.push(eq(users.isVerified, true));
    } else if (verified === 'false') {
      conditions.push(eq(users.isVerified, false));
    }
    
    if (conditions.length > 0) {
      const whereCondition = and(...conditions);
      query = query.where(whereCondition);
      countQuery = countQuery.where(whereCondition);
    }
    
    const [usersResult, countResult] = await Promise.all([
      query.orderBy(desc(users.createdAt)).limit(limit).offset(offset),
      countQuery
    ]);
    
    const total = countResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);
    
    return {
      users: usersResult,
      total,
      totalPages,
      currentPage: page
    };
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

  async getAllBookings(page: number = 1, limit: number = 10, search: string = '', status: string = '', paymentStatus: string = ''): Promise<{ bookings: BookingWithDetails[], total: number, totalPages: number, currentPage: number }> {
    const offset = (page - 1) * limit;
    
    let query = db
      .select()
      .from(bookings)
      .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .leftJoin(users, eq(vehicles.ownerId, users.id));
      
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(bookings);
    
    // Apply filters
    const conditions = [];
    
    if (search) {
      const searchCondition = or(
        ilike(vehicles.brand, `%${search}%`),
        ilike(vehicles.model, `%${search}%`),
        ilike(users.name, `%${search}%`),
        ilike(users.email, `%${search}%`)
      );
      conditions.push(searchCondition);
      
      // Add join to count query for search
      countQuery = countQuery
        .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
        .leftJoin(users, eq(vehicles.ownerId, users.id));
    }
    
    if (status) {
      conditions.push(eq(bookings.status, status));
    }
    
    if (paymentStatus) {
      conditions.push(eq(bookings.paymentStatus, paymentStatus));
    }
    
    if (conditions.length > 0) {
      const whereCondition = and(...conditions);
      query = query.where(whereCondition);
      countQuery = countQuery.where(whereCondition);
    }
    
    const [results, countResult] = await Promise.all([
      query.orderBy(desc(bookings.createdAt)).limit(limit).offset(offset),
      countQuery
    ]);
    
    const bookingsWithDetails = results.map(result => ({
      ...result.bookings,
      vehicle: result.vehicles ? {
        ...result.vehicles,
        owner: result.users!
      } : undefined
    })) as BookingWithDetails[];
    
    const total = countResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);
    
    return {
      bookings: bookingsWithDetails,
      total,
      totalPages,
      currentPage: page
    };
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

  async createContract(contractData: InsertContract): Promise<Contract> {
    const [contract] = await db
      .insert(contracts)
      .values(contractData)
      .returning();
    return contract;
  }

  async updateContract(id: number, data: Partial<InsertContract>): Promise<Contract | undefined> {
    const [contract] = await db
      .update(contracts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(contracts.id, id))
      .returning();
    return contract || undefined;
  }

  async deleteContract(id: number): Promise<boolean> {
    const result = await db
      .delete(contracts)
      .where(eq(contracts.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getContract(id: number): Promise<Contract | undefined> {
    const [contract] = await db
      .select()
      .from(contracts)
      .where(eq(contracts.id, id));
    return contract || undefined;
  }
}

export const storage = new DatabaseStorage();
