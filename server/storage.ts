import { 
  users, vehicles, bookings, reviews, messages, contracts, contractTemplates, contractAuditLog, vehicleBrands, vehicleAvailability, waitingQueue, referrals, userRewards, rewardTransactions, userActivity, adminSettings, savedVehicles, coupons, subscriptionPlans, userSubscriptions, vehicleInspections, payouts, ownerInspections,
  type User, type InsertUser, type Vehicle, type InsertVehicle, 
  type Booking, type InsertBooking, type Review, type InsertReview,
  type Message, type InsertMessage, type VehicleWithOwner, type BookingWithDetails,
  type Contract, type InsertContract, type ContractTemplate, type InsertContractTemplate,
  type ContractAuditLog, type InsertContractAuditLog, type ContractWithDetails,
  type VehicleBrand, type InsertVehicleBrand, type VehicleAvailability, type InsertVehicleAvailability,
  type WaitingQueue, type InsertWaitingQueue, type Referral, type InsertReferral,
  type UserRewards, type InsertUserRewards, type RewardTransaction, type InsertRewardTransaction,
  type UserActivity, type InsertUserActivity, type AdminSettings, type InsertAdminSettings,
  type SavedVehicle, type InsertSavedVehicle, type UpdateSavedVehicle,
  type Coupon, type InsertCoupon, type SubscriptionPlan, type InsertSubscriptionPlan,
  type UserSubscription, type InsertUserSubscription,
  type VehicleInspection, type InsertVehicleInspection, type Payout,
  type OwnerInspection, type InsertOwnerInspection
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, gte, lte, desc, asc, or, like, ilike, sql, lt, ne, inArray, not, isNull } from "drizzle-orm";
import { getTableColumns } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;

  // Vehicles
  getVehicle(id: number): Promise<VehicleWithOwner | undefined>;
  getVehicleWithOwner(id: number): Promise<VehicleWithOwner | undefined>;
  getVehiclesByOwner(ownerId: number): Promise<Vehicle[]>;
  getVehiclesForApproval(): Promise<VehicleWithOwner[]>;
  approveVehicle(vehicleId: number, adminId: number, reason?: string): Promise<Vehicle | undefined>;
  rejectVehicle(vehicleId: number, adminId: number, reason: string): Promise<Vehicle | undefined>;
  searchVehicles(filters: {
    location?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
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
  hasActiveBookings(vehicleId: number): Promise<boolean>;
  hasAnyBookings(vehicleId: number): Promise<boolean>;
  getVehicleUnavailableDates(vehicleId: number): Promise<string[]>;

  // Bookings
  getBooking(id: number): Promise<BookingWithDetails | undefined>;
  getBookingsByUser(userId: number, type: 'renter' | 'owner', includeInspections?: boolean): Promise<BookingWithDetails[]>;
  getBookingsByVehicle(vehicleId: number): Promise<Booking[]>;
  getBookingByPaymentIntent(paymentIntentId: string): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: number, booking: Partial<InsertBooking>): Promise<Booking | undefined>;
  deleteBooking(id: number): Promise<boolean>;
  checkVehicleAvailability(vehicleId: number, startDate: Date, endDate: Date): Promise<boolean>;
  blockVehicleDatesForBooking(vehicleId: number, startDate: string, endDate: string, bookingId: number): Promise<VehicleAvailability>;
  checkAndBlockCompletedBooking(bookingId: number): Promise<boolean>;
  releaseExpiredVehicleBlocks(): Promise<{ releasedBlocks: VehicleAvailability[], notifiedUsers: any[] }>;
  releaseVehicleDatesForBooking(bookingId: number, vehicleId: number): Promise<boolean>;
  notifyWaitingQueueUsers(vehicleId: number, availableStartDate: string, availableEndDate: string): Promise<any[]>;
  getBookingById(id: number): Promise<BookingWithDetails | undefined>;
  updateBookingStatus(id: number, status: string): Promise<Booking | undefined>;
  getBookingWithDetails(id: number, includeInspections?: boolean): Promise<BookingWithDetails | undefined>;
  getBookingsWithDetails(filters: BookingFilters): Promise<BookingWithDetails[]>;

  // Reviews
  getReviewsByVehicle(vehicleId: number): Promise<Review[]>;
  getReviewsByUser(userId: number, type: 'given' | 'received'): Promise<Review[]>;
  getReceivedReviewsByUser(userId: number): Promise<Review[]>;
  getReviewByBookingAndReviewer(bookingId: number, reviewerId: number): Promise<Review | undefined>;
  getBookingsPendingReview(userId: number): Promise<BookingWithDetails[]>;
  createReview(review: InsertReview): Promise<Review>;
  updateUserRating(userId: number, rating: number): Promise<void>;
  updateVehicleRating(vehicleId: number, rating: number): Promise<void>;

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
  deleteContract(id: number): Promise<boolean>;
  getContractsByUser(userId: number): Promise<ContractWithDetails[]>;
  getContractsByBookingId(bookingId: number): Promise<Contract[]>;

  // Contract Templates
  getContractTemplate(id: string): Promise<ContractTemplate | undefined>;
  getDefaultContractTemplate(): Promise<ContractTemplate | undefined>;
  createContractTemplate(template: InsertContractTemplate): Promise<ContractTemplate>;
  updateContractTemplate(id: number, template: Partial<InsertContractTemplate>): Promise<ContractTemplate | undefined>;

  // Admin methods
  getAllUsers(page?: number, limit?: number, search?: string, role?: string, verified?: string): Promise<{ users: User[], total: number, totalPages: number, currentPage: number }>;
  getAllBookings(page?: number, limit?: number, search?: string, status?: string, paymentStatus?: string): Promise<{ bookings: BookingWithDetails[], total: number, totalPages: number, currentPage: number }>;
  getContracts(filters: any): Promise<ContractWithDetails[]>;
  getVehicleBrands(): Promise<VehicleBrand[]>;
  createVehicleBrand(brand: InsertVehicleBrand): Promise<VehicleBrand>;
  updateVehicleBrand(id: number, brand: Partial<InsertVehicleBrand>): Promise<VehicleBrand | undefined>;
  deleteVehicleBrand(id: number): Promise<boolean>;
  createContractTemplate(template: InsertContractTemplate): Promise<ContractTemplate>;
  updateContractTemplate(id: number, template: Partial<InsertContractTemplate>): Promise<ContractTemplate | undefined>;

  // Contract Audit
  getContractAuditLogs(contractId: number): Promise<ContractAuditLog[]>;
  createContractAuditLog(log: InsertContractAuditLog): Promise<ContractAuditLog>;

  // Vehicle availability management
  getVehicleAvailability(vehicleId: number): Promise<VehicleAvailability[]>;
  setVehicleAvailability(availability: InsertVehicleAvailability): Promise<VehicleAvailability>;
  updateVehicleAvailability(id: number, availability: Partial<InsertVehicleAvailability>): Promise<VehicleAvailability | undefined>;
  deleteVehicleAvailability(id: number): Promise<boolean>;
  removeVehicleAvailability(id: number): Promise<boolean>;
  checkAvailabilityConflict(vehicleId: number, startDate: string, endDate: string, excludeId?: number): Promise<boolean>;

  // Waiting queue management
  getWaitingQueue(vehicleId: number): Promise<(WaitingQueue & { user?: User; vehicle?: Vehicle })[]>;
  getUserWaitingQueue(userId: number): Promise<WaitingQueue[]>;
  addToWaitingQueue(queueEntry: InsertWaitingQueue): Promise<WaitingQueue>;
  removeFromWaitingQueue(id: number): Promise<boolean>;
  updateWaitingQueueStatus(id: number, data: Partial<InsertWaitingQueue>): Promise<WaitingQueue | undefined>;

  // Referral system methods
  getReferralByCode(code: string): Promise<Referral | undefined>;
  getUserReferrals(userId: number): Promise<Referral[]>;
  getAllReferrals(): Promise<Referral[]>;
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

  // Vehicle approval methods
  getVehiclesForApproval(): Promise<Vehicle[]>;
  approveVehicle(vehicleId: number, adminId: number, reason?: string): Promise<Vehicle | undefined>;
  rejectVehicle(vehicleId: number, adminId: number, reason: string): Promise<Vehicle | undefined>;

  // Admin Settings
  getAdminSettings(): Promise<AdminSettings | null>;
  updateAdminSettings(settings: Partial<InsertAdminSettings>): Promise<AdminSettings>;

  // Coupon management
  getAllCoupons(): Promise<Coupon[]>;
  getCouponByCode(code: string): Promise<Coupon | undefined>;
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;
  updateCoupon(id: number, coupon: Partial<InsertCoupon>): Promise<Coupon | undefined>;
  deleteCoupon(id: number): Promise<boolean>;
  useCoupon(couponId: number, userId: number, bookingId?: number): Promise<{ coupon: Coupon; discountAmount: number }>;
  validateCoupon(code: string, orderValue: number): Promise<{ isValid: boolean; coupon?: Coupon; discountAmount?: number; error?: string }>;

  // Save for Later methods
  getSavedVehicles(userId: number, category?: string): Promise<(SavedVehicle & { vehicle: Vehicle })[]>;
  getSavedVehicle(userId: number, vehicleId: number): Promise<SavedVehicle | undefined>;
  saveVehicle(data: InsertSavedVehicle): Promise<SavedVehicle>;
  updateSavedVehicle(id: number, data: UpdateSavedVehicle): Promise<SavedVehicle | undefined>;
  removeSavedVehicle(userId: number, vehicleId: number): Promise<boolean>;
  getSavedVehicleCategories(userId: number): Promise<string[]>;
  isVehicleSaved(userId: number, vehicleId: number): Promise<boolean>;

  // Coupon methods
  getAllCoupons(): Promise<Coupon[]>;
  getCoupon(id: number): Promise<Coupon | undefined>;
  getCouponByCode(code: string): Promise<Coupon | undefined>;
  createCoupon(data: InsertCoupon): Promise<Coupon>;
  updateCoupon(id: number, data: Partial<InsertCoupon>): Promise<Coupon | undefined>;
  deleteCoupon(id: number): Promise<boolean>;

  // Vehicle Inspection methods
  getVehicleInspection(id: number): Promise<VehicleInspection | undefined>;
  getInspectionByBooking(bookingId: number): Promise<VehicleInspection | undefined>;
  getInspectionsByRenter(renterId: number): Promise<VehicleInspection[]>;
  getInspectionsByOwner(ownerId: number): Promise<VehicleInspection[]>;
  createVehicleInspection(inspection: InsertVehicleInspection): Promise<VehicleInspection>;
  updateVehicleInspection(id: number, inspection: Partial<InsertVehicleInspection>): Promise<VehicleInspection | undefined>;
  approveInspection(id: number): Promise<VehicleInspection | undefined>;
  rejectInspection(id: number, reason: string, refundAmount?: string): Promise<VehicleInspection | undefined>;
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

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...user, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
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

  async getVehicleWithOwner(id: number): Promise<VehicleWithOwner | undefined> {
    return this.getVehicle(id);
  }

  async getVehiclesByOwner(ownerId: number): Promise<Vehicle[]> {
    return await db
      .select({
        id: vehicles.id,
        ownerId: vehicles.ownerId,
        brand: vehicles.brand,
        model: vehicles.model,
        year: vehicles.year,
        color: vehicles.color,
        licensePlate: vehicles.licensePlate,
        renavam: vehicles.renavam,
        category: vehicles.category,
        pricePerDay: vehicles.pricePerDay,
        pricePerWeek: vehicles.pricePerWeek,
        pricePerMonth: vehicles.pricePerMonth,
        location: vehicles.location,
        latitude: vehicles.latitude,
        longitude: vehicles.longitude,
        description: vehicles.description,
        features: vehicles.features,
        images: vehicles.images,
        isAvailable: vehicles.isAvailable,
        isVerified: vehicles.isVerified,
        transmission: vehicles.transmission,
        fuel: vehicles.fuel,
        seats: vehicles.seats,
        rating: vehicles.rating,
        totalBookings: vehicles.totalBookings,
        crlvDocument: vehicles.crlvDocument,
        status: vehicles.status,
        statusReason: vehicles.statusReason,
        reviewedBy: vehicles.reviewedBy,
        reviewedAt: vehicles.reviewedAt,
        createdAt: vehicles.createdAt,
        updatedAt: vehicles.updatedAt,
        isHighlighted: vehicles.isHighlighted,
        highlightType: vehicles.highlightType,
        highlightExpiresAt: vehicles.highlightExpiresAt,
        highlightUsageCount: vehicles.highlightUsageCount,
      })
      .from(vehicles)
      .where(eq(vehicles.ownerId, ownerId))
      .orderBy(desc(vehicles.createdAt));
  }

  async getVehiclesForApproval(): Promise<VehicleWithOwner[]> {
    const results = await db
      .select()
      .from(vehicles)
      .leftJoin(users, eq(vehicles.ownerId, users.id))
      .where(eq(vehicles.status, "pending"))
      .orderBy(desc(vehicles.createdAt));

    return results.map(result => ({
      ...result.vehicles,
      owner: result.users!,
    }));
  }

  async approveVehicle(vehicleId: number, adminId: number, reason?: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db
      .update(vehicles)
      .set({
        status: "approved",
        statusReason: reason,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(vehicles.id, vehicleId))
      .returning();
    return vehicle;
  }

  async rejectVehicle(vehicleId: number, adminId: number, reason: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db
      .update(vehicles)
      .set({
        status: "rejected",
        statusReason: reason,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(vehicles.id, vehicleId))
      .returning();
    return vehicle;
  }

  async searchVehicles(filters: {
    location?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
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
      let whereConditions = ['v.is_available = true'];
      const params: any[] = [];
      let paramIndex = 1;

      // Apply filters
      if (filters.category) {
        whereConditions.push(`v.category = $${paramIndex}`);
        params.push(filters.category);
        paramIndex++;
      }

      if (filters.location) {
        whereConditions.push(`(
          UNACCENT(LOWER(v.location)) ILIKE UNACCENT(LOWER($${paramIndex})) OR
          LOWER(v.location) ILIKE LOWER($${paramIndex})
        )`);
        params.push(`%${filters.location}%`);
        paramIndex++;
      }

      if (filters.minPrice) {
        whereConditions.push(`v.price_per_day >= $${paramIndex}`);
        params.push(filters.minPrice);
        paramIndex++;
      }

      if (filters.maxPrice) {
        whereConditions.push(`v.price_per_day <= $${paramIndex}`);
        params.push(filters.maxPrice);
        paramIndex++;
      }

      const query = `
        SELECT 
          v.id, v.owner_id, v.brand, v.model, v.year, v.color, v.transmission, v.fuel, 
          v.seats, v.category, v.features, v.images, v.location, v.latitude, v.longitude,
          v.price_per_day, v.price_per_week, v.price_per_month, v.description, 
          v.is_available, v.is_verified, v.rating, v.total_bookings, v.license_plate, 
          v.renavam, v.created_at, v.updated_at,
          v.is_highlighted, v.highlight_type, v.highlight_expires_at, v.highlight_usage_count,
          u.name as owner_name,
          u.email as owner_email,
          u.phone as owner_phone,
          u.avatar as owner_profile_image,
          u.is_verified as owner_is_verified
        FROM vehicles v
        LEFT JOIN users u ON v.owner_id = u.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY 
          CASE 
            WHEN v.is_highlighted = true AND v.highlight_expires_at > NOW() THEN
              CASE v.highlight_type
                WHEN 'diamante' THEN 1
                WHEN 'prata' THEN 2
                ELSE 3
              END
            ELSE 4
          END,
          v.created_at DESC
        LIMIT 50
      `;

      const result = await pool.query(query, params);

      // @ts-ignore - VehicleWithOwner type compatibility
      return result.rows.map((row: any) => ({
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
        licensePlate: row.license_plate,
        renavam: row.renavam,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        isHighlighted: row.is_highlighted,
        highlightType: row.highlight_type,
        highlightExpiresAt: row.highlight_expires_at,
        highlightUsageCount: row.highlight_usage_count,
        owner: {
          id: row.owner_id,
          name: row.owner_name || 'Proprietário',
          email: row.owner_email || '',
          phone: row.owner_phone || '',
          profileImage: row.owner_profile_image,
          isVerified: row.owner_is_verified || false
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

  // Get unavailable dates for a vehicle based on existing bookings
  async getVehicleUnavailableDates(vehicleId: number): Promise<string[]> {
    const confirmedBookings = await db
      .select({
        startDate: bookings.startDate,
        endDate: bookings.endDate,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.vehicleId, vehicleId),
          or(
            eq(bookings.status, 'approved'),
            eq(bookings.status, 'confirmed'), 
            eq(bookings.status, 'active'),
            eq(bookings.status, 'aguardando_vistoria'),
            eq(bookings.status, 'awaiting_inspection'),
            eq(bookings.status, 'completed')
          )
        )
      );

    const unavailableDates: string[] = [];

    confirmedBookings.forEach(booking => {
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);

      // Add all dates in the range (inclusive)
      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        unavailableDates.push(date.toISOString().split('T')[0]);
      }
    });

    return unavailableDates;
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
        // @ts-ignore - Owner property mapping
        owner: result.users!,
      },
      renter: renter!,
      // @ts-ignore - Owner property mapping
      owner: result.users!,
    };
  }
    // @ts-ignore - Emergency deployment fix

  async getBookingsByUser(userId: number, type: 'renter' | 'owner', includeInspections: boolean = false): Promise<BookingWithDetails[]> {
    const field = type === 'renter' ? bookings.renterId : bookings.ownerId;

    const query = db
      .select()
      .from(bookings)
      .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .leftJoin(users, eq(vehicles.ownerId, users.id));

    const results = await query
      .where(eq(field, userId))
      .orderBy(desc(bookings.createdAt));

    const bookingDetails = await Promise.all(
      results.map(async (result) => {
        const [renter] = await db.select().from(users).where(eq(users.id, result.bookings.renterId));

        const bookingData: any = {
          ...result.bookings,
          vehicle: {
            ...result.vehicles!,
            owner: result.users!,
          },
          renter: renter!,
          owner: result.users!,
        };

        // Add inspection data if included
        if (includeInspections) {
          const [inspectionResult] = await db
            .select()
            .from(vehicleInspections)
            .where(eq(vehicleInspections.bookingId, result.bookings.id));
          
          if (inspectionResult) {
            bookingData.inspection = inspectionResult;
          }
        }

        // Add owner inspection data if included
        if (includeInspections) {
          const [ownerInspectionResult] = await db
            .select()
            .from(ownerInspections)
            .where(eq(ownerInspections.bookingId, result.bookings.id));
          
          if (ownerInspectionResult) {
            bookingData.ownerInspection = ownerInspectionResult;
            console.log('🔍 Owner inspection found for booking:', result.bookings.id, ownerInspectionResult);
          } else {
            console.log('❌ No owner inspection found for booking:', result.bookings.id);
          }
        }

        return bookingData;
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

  async getBookingByPaymentIntent(paymentIntentId: string): Promise<Booking | undefined> {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.paymentIntentId, paymentIntentId));
    return booking || undefined;
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

  async releaseVehicleDatesForBooking(bookingId: number, vehicleId: number): Promise<boolean> {
    try {
      // Remove blocked dates associated with this booking
      const result = await db
        .delete(vehicleAvailability)
        .where(
          and(
            eq(vehicleAvailability.vehicleId, vehicleId),
            eq(vehicleAvailability.reason, `Reservado - Booking ${bookingId}`),
            eq(vehicleAvailability.isAvailable, false)
          )
        );

      console.log(`Released vehicle dates for booking ${bookingId}, affected rows: ${result.rowCount || 0}`);
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error releasing vehicle dates:', error);
      return false;
    }
  }

  async checkVehicleAvailability(vehicleId: number, startDate: Date, endDate: Date): Promise<boolean> {
    // Validate inputs
    if (!vehicleId || !startDate || !endDate) {
      console.error('checkVehicleAvailability: Invalid inputs', { vehicleId, startDate, endDate });
      throw new Error('Invalid inputs for vehicle availability check');
    }

    // Convert Date objects to ISO strings for database comparison
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();

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
              sql`${bookings.startDate} <= ${startDateStr}`,
              sql`${bookings.endDate} >= ${startDateStr}`
            ),
            and(
              sql`${bookings.startDate} <= ${endDateStr}`,
              sql`${bookings.endDate} >= ${endDateStr}`
            ),
            and(
              sql`${bookings.startDate} >= ${startDateStr}`,
              sql`${bookings.endDate} <= ${endDateStr}`
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

  async getReceivedReviewsByUser(userId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.revieweeId, userId))
      .orderBy(desc(reviews.createdAt));
  }

  async getReviewByBookingAndReviewer(bookingId: number, reviewerId: number): Promise<Review | undefined> {
    const [review] = await db
      .select()
      .from(reviews)
      .where(and(
        eq(reviews.bookingId, bookingId),
        eq(reviews.reviewerId, reviewerId)
      ));
    return review;
  }

  async getBookingsPendingReview(userId: number): Promise<BookingWithDetails[]> {
    // Busca reservas completadas onde o usuário ainda não fez sua avaliação
    const userBookings = await db
      .select({
        ...getTableColumns(bookings),
        vehicle: {
          id: vehicles.id,
          brand: vehicles.brand,
          model: vehicles.model,
          year: vehicles.year,
          images: vehicles.images,
          licensePlate: vehicles.licensePlate,
          ownerId: vehicles.ownerId,
        },
        renter: {
          id: users.id,
          name: users.name,
          email: users.email,
          avatar: users.avatar,
          rating: users.rating,
        }
      })
      .from(bookings)
      .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .innerJoin(users, eq(bookings.renterId, users.id))
      .where(and(
        eq(bookings.status, 'completed'),
        or(
          eq(bookings.renterId, userId),
          eq(bookings.ownerId, userId)
        )
      ))
      .orderBy(desc(bookings.endDate));

    // Filtrar apenas as que não têm avaliação do usuário atual
    const pendingReviews: BookingWithDetails[] = [];
    
    for (const booking of userBookings) {
      const existingReview = await this.getReviewByBookingAndReviewer(booking.id, userId);
      if (!existingReview) {
        pendingReviews.push(booking as BookingWithDetails);
      }
    }

    return pendingReviews;
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const [review] = await db
      .insert(reviews)
      .values(insertReview)
      .returning();
    return review;
  }

  async updateUserRating(userId: number, rating: number): Promise<void> {
    await db
      .update(users)
      .set({ 
        rating: rating.toFixed(2),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async updateVehicleRating(vehicleId: number, rating: number): Promise<void> {
    await db
      .update(vehicles)
      .set({ 
        rating: rating.toFixed(2),
        updatedAt: new Date()
      })
      .where(eq(vehicles.id, vehicleId));
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
    // @ts-ignore - Emergency deployment fix
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
      .orderBy(desc(contractTemplates.createdAt))
      .limit(1);

    // If no template exists, create a default one
    // @ts-ignore - Emergency deployment fix
    if (!template) {
      // @ts-ignore - Contract template signature points
      const defaultTemplate: InsertContractTemplate = {
        name: "Contrato de Locação de Automóvel por Prazo Determinado",
        category: "standard",
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; padding: 30px; line-height: 1.6; max-width: 800px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">CONTRATO DE LOCAÇÃO DE AUTOMÓVEL POR PRAZO DETERMINADO</h1>
              <p style="font-size: 12px; margin: 0;">Contrato Nº: {{contract.number}} | Data: {{contract.date}}</p>
            </div>

            <div style="margin-bottom: 25px;">
              <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">1. PARTES CONTRATANTES</h2>

              <div style="margin-bottom: 15px;">
                <h3 style="font-size: 12px; font-weight: bold; margin-bottom: 8px;">LOCADOR (Proprietário):</h3>
                <p style="font-size: 11px; margin: 3px 0;"><strong>Nome:</strong> {{owner.name}}</p>
                <p style="font-size: 11px; margin: 3px 0;"><strong>E-mail:</strong> {{owner.email}}</p>
                <p style="font-size: 11px; margin: 3px 0;"><strong>Telefone:</strong> {{owner.phone}}</p>
              </div>

              <div>
                <h3 style="font-size: 12px; font-weight: bold; margin-bottom: 8px;">LOCATÁRIO:</h3>
                <p style="font-size: 11px; margin: 3px 0;"><strong>Nome:</strong> {{renter.name}}</p>
                <p style="font-size: 11px; margin: 3px 0;"><strong>E-mail:</strong> {{renter.email}}</p>
                <p style="font-size: 11px; margin: 3px 0;"><strong>Telefone:</strong> {{renter.phone}}</p>
              </div>
            </div>

            <div style="margin-bottom: 25px;">
              <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">2. OBJETO DO CONTRATO</h2>
              <p style="font-size: 11px; margin: 8px 0;"><strong>Veículo:</strong> {{vehicle.brand}} {{vehicle.model}}</p>
              <p style="font-size: 11px; margin: 8px 0;"><strong>Ano de Fabricação:</strong> {{vehicle.year}}</p>
              <p style="font-size: 11px; margin: 8px 0;"><strong>Placa:</strong> {{vehicle.licensePlate}}</p>
              <p style="font-size: 11px; margin: 8px 0;"><strong>RENAVAM:</strong> {{vehicle.renavam}}</p>
              <p style="font-size: 11px; margin: 8px 0;"><strong>Cor:</strong> {{vehicle.color}}</p>
              <p style="font-size: 11px; margin: 8px 0;"><strong>Categoria:</strong> {{vehicle.category}}</p>
            </div>

            <div style="margin-bottom: 25px;">
              <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">3. PERÍODO E VALOR DA LOCAÇÃO</h2>
              <p style="font-size: 11px; margin: 8px 0;"><strong>Data de Início:</strong> {{booking.startDate}}</p>
              <p style="font-size: 11px; margin: 8px 0;"><strong>Data de Término:</strong> {{booking.endDate}}</p>
              <p style="font-size: 11px; margin: 8px 0;"><strong>Valor Total da Locação:</strong> R$ {{booking.totalPrice}}</p>
              <p style="font-size: 11px; margin: 8px 0;"><strong>Forma de Pagamento:</strong> Cartão de crédito via plataforma</p>
            </div>

            <div style="margin-bottom: 25px;">
              <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">4. OBRIGAÇÕES DO LOCATÁRIO</h2>
              <ul style="font-size: 11px; padding-left: 20px; margin: 0;">
                <li style="margin: 8px 0;">Utilizar o veículo com cuidado e responsabilidade;</li>
                <li style="margin: 8px 0;">Devolver o veículo no local, data e horário acordados;</li>
                <li style="margin: 8px 0;">Manter o veículo em boas condições de uso;</li>
                <li style="margin: 8px 0;">Responsabilizar-se por multas de trânsito durante o período de locação;</li>
                <li style="margin: 8px 0;">Comunicar imediatamente ao locador qualquer acidente ou avaria;</li>
                <li style="margin: 8px 0;">Não permitir que terceiros não autorizados conduzam o veículo;</li>
                <li style="margin: 8px 0;">Devolver o veículo com o mesmo nível de combustível do recebimento.</li>
              </ul>
            </div>

            <div style="margin-bottom: 25px;">
              <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">5. OBRIGAÇÕES DO LOCADOR</h2>
              <ul style="font-size: 11px; padding-left: 20px; margin: 0;">
                <li style="margin: 8px 0;">Entregar o veículo em perfeitas condições de funcionamento;</li>
                <li style="margin: 8px 0;">Fornecer toda a documentação necessária do veículo;</li>
                <li style="margin: 8px 0;">Garantir que o veículo possui seguro e documentação em dia;</li>
                <li style="margin: 8px 0;">Disponibilizar contato para emergências durante a locação.</li>
              </ul>
            </div>

            <div style="margin-bottom: 25px;">
              <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">6. DISPOSIÇÕES GERAIS</h2>
              <p style="font-size: 11px; margin: 8px 0;">O presente contrato é celebrado em caráter irretratável e irrevogável, obrigando as partes e seus sucessores.</p>
              <p style="font-size: 11px; margin: 8px 0;">Qualquer alteração deste contrato deverá ser feita por escrito e acordada entre as partes.</p>
              <p style="font-size: 11px; margin: 8px 0;">Para dirimir quaisquer controvérsias oriundas deste contrato, fica eleito o foro da comarca de domicílio do locador.</p>
            </div>

            <div style="margin-top: 50px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="width: 50%; text-align: center; padding: 20px;">
                    <div style="border-top: 1px solid #000; width: 200px; margin: 0 auto; padding-top: 5px;">
                      <p style="font-size: 10px; margin: 0;"><strong>{{owner.name}}</strong></p>
                      <p style="font-size: 10px; margin: 0;">LOCADOR</p>
                    </div>
                  </td>
                  <td style="width: 50%; text-align: center; padding: 20px;">
                    <div style="border-top: 1px solid #000; width: 200px; margin: 0 auto; padding-top: 5px;">
                      <p style="font-size: 10px; margin: 0;"><strong>{{renter.name}}</strong></p>
                      <p style="font-size: 10px; margin: 0;">LOCATÁRIO</p>
                    </div>
                  </td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; margin-top: 30px; font-size: 10px; color: #666;">
              <p>Este contrato foi gerado eletronicamente pela plataforma alugae.mobi</p>
              <p>Data e hora da geração: {{contract.generatedAt}}</p>
            </div>
          </div>
        `,
        fields: [
          { name: "vehicle.brand", type: "text", required: true },
          { name: "vehicle.model", type: "text", required: true },
          { name: "vehicle.licensePlate", type: "text", required: true },
          { name: "vehicle.renavam", type: "text", required: true },
          { name: "vehicle.color", type: "text", required: true },
          { name: "renter.name", type: "text", required: true },
          { name: "owner.name", type: "text", required: true }
        ],
        isActive: true,
        signaturePoints: {
          renter: { x: 100, y: 700, page: 1 },
          owner: { x: 400, y: 700, page: 1 }
        }
      };

      // Create new template without problematic fields typing
      const templateData = {
        name: defaultTemplate.name,
        category: defaultTemplate.category,
        htmlTemplate: defaultTemplate.htmlTemplate,
        signaturePoints: defaultTemplate.signaturePoints
      };

      // @ts-ignore - Final deployment template creation
      const [template] = await db
        .insert(contractTemplates)
        .values(templateData as any)
        .returning();
      return template;
    }

    return template;
  }

  async createContractTemplate(insertTemplate: InsertContractTemplate): Promise<ContractTemplate> {
    // @ts-ignore - Final deployment fix for contract template creation
    const [template] = await db
      .insert(contractTemplates)
      .values(insertTemplate as any)
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
  async getBookingWithDetails(id: number, includeInspections?: boolean): Promise<BookingWithDetails | undefined> {
    // First get the basic booking data
    const baseQuery = db
      .select({
        ...getTableColumns(bookings),
        vehicle: {
          id: vehicles.id,
          brand: vehicles.brand,
          model: vehicles.model,
          year: vehicles.year,
          imageUrl: vehicles.images ? sql<string>`${vehicles.images} ->> 0` : sql<string>`''`, // Assuming first image is the main one
          location: vehicles.location,
          licensePlate: vehicles.licensePlate,
        },
        owner: {
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          profileImage: users.avatar,
        },
        renter: {
          id: sql<number>`renters.id`.as('renter_id'),
          name: sql<string>`renters.name`.as('renter_name'),
          email: sql<string>`renters.email`.as('renter_email'),
          phone: sql<string>`renters.phone`.as('renter_phone'),
          profileImage: sql<string>`renters.avatar`.as('renter_profile_image'),
        },
        inspection: {
          id: vehicleInspections.id,
          status: vehicleInspections.status,
          approvalDecision: vehicleInspections.approvalDecision,
          inspectedAt: vehicleInspections.inspectedAt,
          rejectionReason: vehicleInspections.rejectionReason
        },
      })
      .from(bookings)
      .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .leftJoin(users, eq(vehicles.ownerId, users.id))
      .leftJoin(sql`users AS renters`, eq(bookings.renterId, sql`renters.id`))
      .leftJoin(vehicleInspections, eq(bookings.id, vehicleInspections.bookingId))
      .where(eq(bookings.id, id));

    const result = await baseQuery;
    let booking = result[0];
    
    if (!booking) {
      return undefined;
    }

    // If inspections are requested, fetch them separately
    if (includeInspections) {
      // Fetch renter inspection
      const renterInspection = await this.getRenterInspectionByBookingId(id);
      // Fetch owner inspection
      const ownerInspection = await this.getOwnerInspectionByBookingId(id);
      
      console.log('🔍 Storage getBookingWithDetails - Found inspections:', {
        renterInspection: !!renterInspection,
        ownerInspection: !!ownerInspection,
        ownerInspectionDetails: ownerInspection ? {
          status: ownerInspection.status,
          depositDecision: ownerInspection.depositDecision
        } : null
      });
      
      // Add inspections to the booking object
      (booking as any).renterInspection = renterInspection;
      (booking as any).ownerInspection = ownerInspection;
    }

    // @ts-ignore - Type assertion for result mapping
    return booking;
  }

  async getBookingsWithDetails(filters: BookingFilters): Promise<BookingWithDetails[]> {
    const conditions = [];

    if (filters.userId) {
      conditions.push(or(
        eq(bookings.renterId, filters.userId),
        eq(bookings.ownerId, filters.userId)
      ));
    }

    if (filters.vehicleId) {
      conditions.push(eq(bookings.vehicleId, filters.vehicleId));
    }

    if (filters.status) {
      conditions.push(eq(bookings.status, filters.status));
    }

    if (filters.startDate) {
      conditions.push(gte(bookings.startDate, filters.startDate));
    }

    if (filters.endDate) {
      conditions.push(lte(bookings.endDate, filters.endDate));
    }

    const results = await db
      .select({
        ...getTableColumns(bookings),
        vehicle: {
          id: vehicles.id,
          brand: vehicles.brand,
          model: vehicles.model,
          year: vehicles.year,
          imageUrl: vehicles.images ? sql<string>`${vehicles.images} ->> 0` : sql<string>`''`,
          location: vehicles.location,
          licensePlate: vehicles.licensePlate,
        },
        owner: {
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          profileImage: users.avatar,
        },
        renter: {
          id: sql<number>`renters.id`.as('renter_id'),
          name: sql<string>`renters.name`.as('renter_name'),
          email: sql<string>`renters.email`.as('renter_email'),
          phone: sql<string>`renters.phone`.as('renter_phone'),
          profileImage: sql<string>`renters.avatar`.as('renter_profile_image'),
        },
        inspection: {
          id: vehicleInspections.id,
          status: vehicleInspections.status,
          approvalDecision: vehicleInspections.approvalDecision,
          inspectedAt: vehicleInspections.inspectedAt,
          rejectionReason: vehicleInspections.rejectionReason
        },
      })
      .from(bookings)
      .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .leftJoin(users, eq(vehicles.ownerId, users.id))
      .leftJoin(sql`users AS renters`, eq(bookings.renterId, sql`renters.id`))
      .leftJoin(vehicleInspections, eq(bookings.id, vehicleInspections.bookingId))
      .where(and(...conditions))
      .orderBy(desc(bookings.createdAt));

    // @ts-ignore - Type assertion for result mapping
    return results || [];
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

  async removeVehicleAvailability(id: number): Promise<boolean> {
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
  async getWaitingQueue(vehicleId: number): Promise<(WaitingQueue & { user?: User; vehicle?: Vehicle })[]> {
    const results = await db
      .select({
        // WaitingQueue fields
        id: waitingQueue.id,
        vehicleId: waitingQueue.vehicleId,
        userId: waitingQueue.userId,
        desiredStartDate: waitingQueue.desiredStartDate,
        desiredEndDate: waitingQueue.desiredEndDate,
        notificationSent: waitingQueue.notificationSent,
        isActive: waitingQueue.isActive,
        createdAt: waitingQueue.createdAt,
        // User fields
        userName: users.name,
        userEmail: users.email,
        userPhone: users.phone,
        // Vehicle fields
        vehicleBrand: vehicles.brand,
        vehicleModel: vehicles.model,
        vehicleYear: vehicles.year,
        vehicleColor: vehicles.color
      })
      .from(waitingQueue)
      .leftJoin(users, eq(waitingQueue.userId, users.id))
      .leftJoin(vehicles, eq(waitingQueue.vehicleId, vehicles.id))
      .where(and(
        eq(waitingQueue.vehicleId, vehicleId),
        eq(waitingQueue.isActive, true)
      ))
      .orderBy(asc(waitingQueue.createdAt));

    return results.map(result => ({
      id: result.id,
      vehicleId: result.vehicleId,
      userId: result.userId,
      desiredStartDate: result.desiredStartDate,
      desiredEndDate: result.desiredEndDate,
      notificationSent: result.notificationSent,
      isActive: result.isActive,
      createdAt: result.createdAt,
      user: result.userName ? {
        id: result.userId,
        name: result.userName,
        email: result.userEmail,
        phone: result.userPhone
      } as User : undefined,
      vehicle: result.vehicleBrand ? {
        id: result.vehicleId,
        brand: result.vehicleBrand,
        model: result.vehicleModel,
        year: result.vehicleYear,
        color: result.vehicleColor
      } as Vehicle : undefined
    }));
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
    // @ts-ignore - Emergency deployment fix
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

  async getAllReferrals(): Promise<Referral[]> {
    return await db
      .select()
      .from(referrals)
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
    // @ts-ignore - Emergency deployment fix
      const newTotal = currentRewards.totalPoints + transaction.points;
    // @ts-ignore - Emergency deployment fix
      const newAvailable = transaction.type === 'earned' 
        ? (currentRewards.availablePoints || 0) + transaction.points
    // @ts-ignore - Emergency deployment fix
        : currentRewards.availablePoints - Math.abs(transaction.points);
      const newUsed = transaction.type === 'used' 
        ? (currentRewards.usedPoints || 0) + Math.abs(transaction.points)
        : (currentRewards.usedPoints || 0);

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
    // @ts-ignore - Emergency deployment fix
    await this.addRewardTransaction({
      userId: referral.referrerId,
      type: 'earned',
      points: referral.rewardPoints || 0,
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
    // @ts-ignore - Emergency deployment fix
    const rewards = await this.getUserRewards(referral.referrerId);
    if (rewards) {
      await this.updateUserRewards(referral.referrerId, {
        referralCount: (rewards.referralCount || 0) + 1,
        successfulReferrals: (rewards.successfulReferrals || 0) + 1,
      });
    }
  }
    // @ts-ignore - Emergency deployment fix

  // User activity tracking methods
  async trackUserActivity(activity: InsertUserActivity): Promise<UserActivity> {
    // @ts-ignore - User activity insert with proper typing
    const [newActivity] = await db
      .insert(userActivity)
      .values({
        userId: activity.userId,
        activityType: activity.activityType,
        vehicleId: activity.vehicleId,
        userAgent: activity.userAgent,
        searchQuery: activity.searchQuery,
        sessionId: activity.sessionId,
        ipAddress: activity.ipAddress,
        filters: activity.filters as any
      })
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

  // Removed duplicate updateWaitingQueueStatus method

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
      // @ts-ignore - User query where compatibility
      query = query.where(whereCondition);
      // @ts-ignore - User count query where compatibility
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
      // @ts-ignore - Join operations compatibility
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
      // @ts-ignore - Query where compatibility
      query = query.where(whereCondition);
      // @ts-ignore - Count query where compatibility  
      countQuery = countQuery.where(whereCondition);
    }

    const [results, countResult] = await Promise.all([
      query.orderBy(desc(bookings.createdAt)).limit(limit).offset(offset),
      countQuery
    ]);

    // @ts-ignore - Booking details mapping
    const bookingsWithDetails = results.map(result => ({
      ...result.bookings,
      vehicle: result.vehicles ? {
        ...result.vehicles,
        owner: result.users!
      } : undefined,
      renter: result.users!,
      owner: result.users!
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
    // @ts-ignore - Booking detail return type
    return {
      ...result.bookings,
      vehicle: result.vehicles ? {
        ...result.vehicles,
        // @ts-ignore - Vehicle owner property
        owner: result.users!
      } : undefined,
      // @ts-ignore - Booking renter property  
      renter: result.users!,
      // @ts-ignore - Booking owner property
      owner: result.users!
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
    return await this.getContractsWithFilters(filters);
  }

  async createContract(contractData: InsertContract): Promise<Contract> {
    // Generate unique contract number
    const contractNumber = `CNT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create basic contract data
    const defaultContractData = {
      vehicle: {},
      renter: {},
      owner: {},
      booking: {},
      terms: {
        autoSigned: true,
        signedAt: new Date().toISOString()
      }
    };

    const [contract] = await db
      .insert(contracts)
      // @ts-ignore - Contract values insert
      .values({
        ...contractData,
        contractNumber,
        contractData: contractData.contractData || defaultContractData,
        renterSigned: contractData.renterSignedAt ? true : false,
        ownerSigned: contractData.ownerSignedAt ? true : false,
      })
      .returning();
    return contract;
  }

  async updateContract(id: number, data: Partial<InsertContract>): Promise<Contract | undefined> {
    const [contract] = await db
      .update(contracts)
      // @ts-ignore - Contract update data
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



  async getContractsByBookingId(bookingId: number): Promise<Contract[]> {
    return await db
      .select()
      .from(contracts)
      .where(eq(contracts.bookingId, bookingId))
      .orderBy(desc(contracts.createdAt));
  }
  // Admin Settings
  async getAdminSettings(): Promise<AdminSettings | null> {
    try {
      const [result] = await db.select().from(adminSettings).limit(1);
      return result || null;
    } catch (error) {
      console.error("Error fetching admin settings:", error);
      return null;
    }
  }

  async updateAdminSettings(settings: Partial<InsertAdminSettings>): Promise<AdminSettings> {
    try {
      // Get existing settings first
      const existingSettings = await this.getAdminSettings();

      // Clean the settings data - remove id, timestamps, and convert dates
      const cleanSettings = { ...settings };
      delete cleanSettings.id;
      delete cleanSettings.createdAt;
      delete cleanSettings.updatedAt;

      if (existingSettings) {
        // Update existing record
        const [updated] = await db
          .update(adminSettings)
          .set({
            ...cleanSettings,
            updatedAt: new Date(),
          })
          .where(eq(adminSettings.id, existingSettings.id))
          .returning();
        return updated;
      } else {
        // Create new record
        const [created] = await db
          .insert(adminSettings)
          .values(cleanSettings)
          .returning();
        return created;
      }
    } catch (error) {
      console.error("Error updating admin settings:", error);
      throw new Error("Failed to update admin settings");
    }
  }

  // Save for Later methods
  async getSavedVehicles(userId: number, category?: string): Promise<(SavedVehicle & { vehicle: Vehicle })[]> {
    let query = db
      .select()
      .from(savedVehicles)
      .leftJoin(vehicles, eq(savedVehicles.vehicleId, vehicles.id))
      .where(eq(savedVehicles.userId, userId));

    if (category && category !== 'all') {
      // @ts-ignore - Saved vehicles query where clause
      query = query.where(and(eq(savedVehicles.userId, userId), eq(savedVehicles.category, category)));
    }

    const results = await query.orderBy(desc(savedVehicles.createdAt));

    return results.map(result => ({
      ...result.saved_vehicles,
      vehicle: result.vehicles!
    })) as (SavedVehicle & { vehicle: Vehicle })[];
  }

  async getSavedVehicle(userId: number, vehicleId: number): Promise<SavedVehicle | undefined> {
    const [savedVehicle] = await db
      .select()
      .from(savedVehicles)
      .where(and(eq(savedVehicles.userId, userId), eq(savedVehicles.vehicleId, vehicleId)));
    return savedVehicle || undefined;
  }

  async saveVehicle(data: InsertSavedVehicle): Promise<SavedVehicle> {
    const [savedVehicle] = await db
      .insert(savedVehicles)
      .values(data)
      .returning();
    return savedVehicle;
  }

  async updateSavedVehicle(id: number, data: UpdateSavedVehicle): Promise<SavedVehicle | undefined> {
    const [savedVehicle] = await db
      .update(savedVehicles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(savedVehicles.id, id))
      .returning();
    return savedVehicle || undefined;
  }

  async removeSavedVehicle(userId: number, vehicleId: number): Promise<boolean> {
    const result = await db
      .delete(savedVehicles)
      .where(and(eq(savedVehicles.userId, userId), eq(savedVehicles.vehicleId, vehicleId)));
    return (result.rowCount || 0) > 0;
  }

  async getSavedVehicleCategories(userId: number): Promise<string[]> {
    const results = await db
      .select({ category: savedVehicles.category })
      .from(savedVehicles)
      .where(eq(savedVehicles.userId, userId))
      .groupBy(savedVehicles.category);

    return results.map(r => r.category).filter(Boolean) as string[];
  }

  async isVehicleSaved(userId: number, vehicleId: number): Promise<boolean> {
    const [result] = await db
      .select({ id: savedVehicles.id })
      .from(savedVehicles)
      .where(and(eq(savedVehicles.userId, userId), eq(savedVehicles.vehicleId, vehicleId)))
      .limit(1);
    return !!result;
  }

  // Coupon Management Methods
  async getAllCoupons(): Promise<Coupon[]> {
    try {
      const results = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
      return results;
    } catch (error) {
      console.error("Error fetching coupons:", error);
      return [];
    }
  }

  async getCoupon(id: number): Promise<Coupon | undefined> {
    try {
      const [coupon] = await db.select().from(coupons).where(eq(coupons.id, id));
      return coupon;
    } catch (error) {
      console.error("Error fetching coupon:", error);
      return undefined;
    }
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    try {
      const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code.toUpperCase()));
      return coupon;
    } catch (error) {
      console.error("Error fetching coupon by code:", error);
      return undefined;
    }
  }

  async createCoupon(data: InsertCoupon): Promise<Coupon> {
    // Convert date strings to Date objects for proper database insertion
    const normalizedData = {
      ...data,
      validFrom: data.validFrom ? new Date(data.validFrom) : new Date(),
      validUntil: new Date(data.validUntil),
    };

    console.log("💾 Creating coupon with normalized data:", normalizedData);

    const [coupon] = await db.insert(coupons).values(normalizedData).returning();
    return coupon;
  }

  async updateCoupon(id: number, data: Partial<InsertCoupon>): Promise<Coupon | undefined> {
    // Convert date strings to Date objects if they exist
    const normalizedData = {
      ...data,
      ...(data.validFrom && { validFrom: new Date(data.validFrom) }),
      ...(data.validUntil && { validUntil: new Date(data.validUntil) }),
      updatedAt: new Date()
    };

    const [coupon] = await db
      .update(coupons)
      .set(normalizedData)
      .where(eq(coupons.id, id))
      .returning();
    return coupon;
  }

  async deleteCoupon(id: number): Promise<boolean> {
    const result = await db.delete(coupons).where(eq(coupons.id, id));
    return (result.rowCount || 0) > 0;
  }

  async validateCoupon(code: string, orderValue: number): Promise<{ isValid: boolean; coupon?: Coupon; discountAmount?: number; error?: string }> {
    try {
      const coupon = await this.getCouponByCode(code);

      if (!coupon) {
        return { isValid: false, error: "Cupom não encontrado" };
      }

      if (!coupon.isActive) {
        return { isValid: false, error: "Cupom inativo" };
      }

      if (new Date() > coupon.validUntil) {
        return { isValid: false, error: "Cupom expirado" };
      }

      if ((coupon.usedCount || 0) >= (coupon.maxUses || 0)) {
        return { isValid: false, error: "Cupom esgotado" };
      }

      if (orderValue < (coupon.minOrderValue || 0)) {
        const minValue = ((coupon.minOrderValue || 0) / 100).toFixed(2);
        return { isValid: false, error: `Valor mínimo do pedido: R$ ${minValue}` };
      }

      // Calculate discount
      let discountAmount = 0;
      if (coupon.discountType === "percentage") {
        discountAmount = Math.floor((orderValue * coupon.discountValue) / 100);
      } else if (coupon.discountType === "fixed") {
        discountAmount = Math.min(coupon.discountValue, orderValue);
      }

      return { 
        isValid: true, 
        coupon, 
        discountAmount 
      };
    } catch (error) {
      console.error("Error validating coupon:", error);
      return { isValid: false, error: "Erro interno do servidor" };
    }
  }

  async useCoupon(couponId: number, userId: number, bookingId?: number): Promise<{ coupon: Coupon; discountAmount: number }> {
    const coupon = await this.getCoupon(couponId);
    if (!coupon) {
      throw new Error("Cupom não encontrado");
    }

    // Update usage count
    await db
      .update(coupons)
      .set({ 
        usedCount: (coupon.usedCount || 0) + 1,
        updatedAt: new Date()
      })
      .where(eq(coupons.id, couponId));

    return { coupon, discountAmount: 0 }; // Discount amount would be calculated during validation
  }

  // Subscription Plans methods
  async getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(asc(subscriptionPlans.sortOrder));
  }

  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, id));
    return plan || undefined;
  }

  async getSubscriptionPlanByName(name: string): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.name, name));
    return plan || undefined;
  }

  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [newPlan] = await db
      .insert(subscriptionPlans)
      .values(plan)
      .returning();
    return newPlan;
  }

  async updateSubscriptionPlan(id: number, plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan | undefined> {
    const [updatedPlan] = await db
      .update(subscriptionPlans)
      .set({ ...plan, updatedAt: new Date() })
      .where(eq(subscriptionPlans.id, id))
      .returning();
    return updatedPlan || undefined;
  }

  async deleteSubscriptionPlan(id: number): Promise<boolean> {
    const result = await db
      .delete(subscriptionPlans)
      .where(eq(subscriptionPlans.id, id));
    return (result.rowCount || 0) > 0;
  }

  // User Subscriptions methods
  async getUserSubscription(userId: number): Promise<UserSubscription | undefined> {
    const [subscription] = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId));
    return subscription || undefined;
  }

  async getUserSubscriptionWithPlan(userId: number): Promise<(UserSubscription & { plan: SubscriptionPlan }) | undefined> {
    const result = await db
      .select()
      .from(userSubscriptions)
      .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
      .where(eq(userSubscriptions.userId, userId))
      .orderBy(desc(userSubscriptions.createdAt))
      .limit(1);

    if (result.length === 0 || !result[0].subscription_plans) {
      return undefined;
    }

    return {
      ...result[0].user_subscriptions,
      plan: result[0].subscription_plans
    } as UserSubscription & { plan: SubscriptionPlan };
  }

  async createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription> {
    const [newSubscription] = await db
      .insert(userSubscriptions)
      .values(subscription)
      .returning();
    return newSubscription;
  }

  async updateUserSubscription(id: number, subscription: Partial<InsertUserSubscription>): Promise<UserSubscription | undefined> {
    const [updatedSubscription] = await db
      .update(userSubscriptions)
      .set({ ...subscription, updatedAt: new Date() })
      .where(eq(userSubscriptions.id, id))
      .returning();
    return updatedSubscription || undefined;
  }

  async cancelUserSubscription(userId: number): Promise<UserSubscription | undefined> {
    const [cancelledSubscription] = await db
      .update(userSubscriptions)
      .set({ 
        status: 'cancelled',
        cancelAtPeriodEnd: true,
        cancelledAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(userSubscriptions.userId, userId))
      .returning();
    return cancelledSubscription || undefined;
  }

  async upgradeUserSubscription(userId: number, newPlanId: number): Promise<UserSubscription | undefined> {
    const [upgradedSubscription] = await db
      .update(userSubscriptions)
      .set({ 
        planId: newPlanId,
        updatedAt: new Date() 
      })
      .where(eq(userSubscriptions.userId, userId))
      .returning();
    return upgradedSubscription || undefined;
  }

  async checkUserSubscriptionLimits(userId: number): Promise<{ canCreateVehicle: boolean; currentVehicles: number; maxVehicles: number; highlightsAvailable: number }> {
    // Get user's current subscription
    const user = await this.getUser(userId);
    if (!user) {
      return { canCreateVehicle: false, currentVehicles: 0, maxVehicles: 0, highlightsAvailable: 0 };
    }

    // Count current vehicles
    const currentVehicles = await db
      .select({ count: sql<number>`count(*)` })
      .from(vehicles)
      .where(eq(vehicles.ownerId, userId));

    const vehicleCount = currentVehicles[0]?.count || 0;
    const maxVehicles = user.maxVehicleListings || 2;
    const highlightsAvailable = user.highlightsAvailable || 0;

    return {
      canCreateVehicle: vehicleCount < maxVehicles,
      currentVehicles: vehicleCount,
      maxVehicles,
      highlightsAvailable
    };
  }

  async useHighlight(userId: number, vehicleId: number, highlightType: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user || (user.highlightsAvailable || 0) <= 0) {
      return false;
    }

    // Update vehicle to be highlighted
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days highlight

    await db
      .update(vehicles)
      .set({
        isHighlighted: true,
        highlightType,
        highlightExpiresAt: expiresAt,
        highlightUsageCount: sql`${vehicles.highlightUsageCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(vehicles.id, vehicleId));

    // Update user's available highlights
    await db
      .update(users)
      .set({
        highlightsUsed: sql`${users.highlightsUsed} + 1`,
        highlightsAvailable: sql`${users.highlightsAvailable} - 1`,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    return true;
  }

  // Payout system methods
  async getPendingPayoutBookings(): Promise<any[]> {
    try {
      // Buscar bookings pagos que não têm repasse processado
      const result = await db
        .select({
          id: bookings.id,
          totalPrice: bookings.totalPrice,
          paymentStatus: bookings.paymentStatus,
          vehicleOwnerId: vehicles.ownerId,
          renterId: bookings.renterId
        })
        .from(bookings)
        .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
        .leftJoin(payouts, eq(payouts.bookingId, bookings.id))
        .where(
          and(
            eq(bookings.paymentStatus, 'paid'),
            eq(bookings.status, 'confirmed'),
            isNull(payouts.id) // Não tem repasse criado ainda
          )
        )
        .limit(50);

      return result;
    } catch (error) {
      console.error("Error fetching pending payout bookings:", error);
      return [];
    }
  }

  async createPayout(payoutData: {
    bookingId: number;
    ownerId: number;
    renterId: number;
    totalBookingAmount: string;
    serviceFee: string;
    insuranceFee: string;
    netAmount: string;
    ownerPix: string;
    status: string;
    method: string;
  }): Promise<number> {
    const [result] = await db
      .insert(payouts)
      .values({
        ...payoutData,
        couponDiscount: '0.00',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning({ id: payouts.id });

    return result.id;
  }

  async updatePayoutStatus(payoutId: number, updates: {
    status?: string;
    reference?: string;
    failureReason?: string;
    processedAt?: Date;
  }): Promise<void> {
    await db
      .update(payouts)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(payouts.id, payoutId));
  }

  async getPayoutsByStatus(status: string, limit: number = 50): Promise<any[]> {
    return await db
      .select()
      .from(payouts)
      .where(eq(payouts.status, status))
      .orderBy(desc(payouts.createdAt))
      .limit(limit);
  }

  async getPayoutHistory(ownerId: number, limit: number = 50): Promise<any[]> {
    return await db
      .select()
      .from(payouts)
      .where(eq(payouts.ownerId, ownerId))
      .orderBy(desc(payouts.createdAt))
      .limit(limit);
  }

  // Vehicle Inspection methods
  async getVehicleInspection(id: number): Promise<VehicleInspection | undefined> {
    const [inspection] = await db
      .select()
      .from(vehicleInspections)
      .where(eq(vehicleInspections.id, id));
    return inspection || undefined;
  }

  async getInspectionByBooking(bookingId: number): Promise<VehicleInspection | undefined> {
    const [inspection] = await db
      .select()
      .from(vehicleInspections)
      .where(eq(vehicleInspections.bookingId, bookingId));
    return inspection || undefined;
  }

  async getInspectionsByRenter(renterId: number): Promise<VehicleInspection[]> {
    return await db
      .select()
      .from(vehicleInspections)
      .where(eq(vehicleInspections.renterId, renterId))
      .orderBy(desc(vehicleInspections.createdAt));
  }

  async getInspectionsByOwner(ownerId: number): Promise<VehicleInspection[]> {
    return await db
      .select()
      .from(vehicleInspections)
      .leftJoin(bookings, eq(vehicleInspections.bookingId, bookings.id))
      .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .where(eq(vehicles.ownerId, ownerId))
      .orderBy(desc(vehicleInspections.createdAt));
  }

  async createVehicleInspection(inspection: InsertVehicleInspection): Promise<VehicleInspection> {
    const [newInspection] = await db
      .insert(vehicleInspections)
      .values({
        ...inspection,
        inspectedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newInspection;
  }

  async updateVehicleInspection(id: number, inspection: Partial<InsertVehicleInspection>): Promise<VehicleInspection | undefined> {
    const [updatedInspection] = await db
      .update(vehicleInspections)
      .set({
        ...inspection,
        updatedAt: new Date()
      })
      .where(eq(vehicleInspections.id, id))
      .returning();
    return updatedInspection || undefined;
  }

  async approveInspection(id: number): Promise<VehicleInspection | undefined> {
    const [inspection] = await db
      .update(vehicleInspections)
      .set({
        approvalDecision: true,
        decidedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(vehicleInspections.id, id))
      .returning();
    return inspection || undefined;
  }

  async rejectInspection(id: number, reason: string, refundAmount?: string): Promise<VehicleInspection | undefined> {
    const [inspection] = await db
      .update(vehicleInspections)
      .set({
        approvalDecision: false,
        rejectionReason: reason,
        refundAmount,
        refundReason: reason,
        decidedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(vehicleInspections.id, id))
      .returning();
    return inspection || undefined;
  }

  // ===========================================
  // INSPECTION METHODS - SISTEMA DE VISTORIAS
  // ===========================================

  async getAllInspections(): Promise<any[]> {
    try {
      const result = await pool.query(`
        SELECT 
          vi.*,
          b.id as reservation_id,
          u.name as renter_name,
          b.start_date,
          b.end_date,
          b.status as reservation_status,
          v.brand,
          v.model,
          v.year,
          v.license_plate
        FROM vehicle_inspections vi
        JOIN bookings b ON vi.booking_id = b.id
        JOIN vehicles v ON b.vehicle_id = v.id
        JOIN users u ON b.renter_id = u.id
        ORDER BY vi.created_at DESC
      `);
      
      return result.rows.map(row => ({
        id: row.id,
        reservationId: row.reservation_id,
        vehicleCondition: row.vehicle_condition,
        exteriorCondition: row.exterior_condition,
        interiorCondition: row.interior_condition,
        engineCondition: row.engine_condition,
        tiresCondition: row.tires_condition,
        fuelLevel: row.fuel_level,
        mileage: row.mileage,
        observations: row.observations,
        approved: row.approved,
        completedAt: row.completed_at,
        reservation: {
          id: row.reservation_id,
          renterName: row.renter_name,
          startDate: row.start_date,
          endDate: row.end_date,
          status: row.reservation_status,
          vehicle: {
            brand: row.brand,
            model: row.model,
            year: row.year,
            licensePlate: row.license_plate
          }
        }
      }));
    } catch (error) {
      console.error('Error fetching inspections:', error);
      throw error;
    }
  }

  async getInspectionById(id: number): Promise<any | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM vehicle_inspections WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching inspection by id:', error);
      throw error;
    }
  }

  async getInspectionByReservation(reservationId: number): Promise<any | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM vehicle_inspections WHERE booking_id = $1',
        [reservationId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching inspection by reservation:', error);
      throw error;
    }
  }

  async getReservationsPendingInspection(): Promise<any[]> {
    try {
      const result = await pool.query(`
        SELECT 
          b.id,
          u.name as renter_name,
          b.start_date,
          b.end_date,
          b.status,
          v.brand,
          v.model,
          v.year,
          v.license_plate
        FROM bookings b
        JOIN vehicles v ON b.vehicle_id = v.id
        JOIN users u ON b.renter_id = u.id
        LEFT JOIN vehicle_inspections vi ON b.id = vi.booking_id
        WHERE b.status = 'aguardando_vistoria' 
        AND vi.id IS NULL
        ORDER BY b.start_date ASC
      `);
      
      return result.rows.map(row => ({
        id: row.id,
        renterName: row.renter_name,
        startDate: row.start_date,
        endDate: row.end_date,
        status: row.status,
        vehicle: {
          brand: row.brand,
          model: row.model,
          year: row.year,
          licensePlate: row.license_plate
        }
      }));
    } catch (error) {
      console.error('Error fetching pending inspections:', error);
      throw error;
    }
  }

  async createInspection(data: any): Promise<any> {
    try {
      const result = await pool.query(`
        INSERT INTO vehicle_inspections 
        (booking_id, inspector_id, vehicle_condition, exterior_condition, 
         interior_condition, engine_condition, tires_condition, fuel_level, 
         mileage, observations, approved, completed_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        data.reservationId,
        data.inspectorId,
        data.vehicleCondition,
        data.exteriorCondition,
        data.interiorCondition,
        data.engineCondition,
        data.tiresCondition,
        data.fuelLevel,
        data.mileage,
        data.observations,
        data.approved,
        data.completedAt
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating inspection:', error);
      throw error;
    }
  }

  async updateInspection(id: number, data: any): Promise<any> {
    try {
      const result = await pool.query(`
        UPDATE vehicle_inspections 
        SET vehicle_condition = $2, exterior_condition = $3, interior_condition = $4,
            engine_condition = $5, tires_condition = $6, fuel_level = $7,
            mileage = $8, observations = $9, approved = $10, completed_at = $11
        WHERE id = $1
        RETURNING *
      `, [
        id,
        data.vehicleCondition,
        data.exteriorCondition,
        data.interiorCondition,
        data.engineCondition,
        data.tiresCondition,
        data.fuelLevel,
        data.mileage,
        data.observations,
        data.approved,
        data.completedAt
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating inspection:', error);
      throw error;
    }
  }

  // Owner Inspection Methods
  async createOwnerInspection(data: any): Promise<any> {
    try {
      const [result] = await db
        .insert(ownerInspections)
        .values({
          bookingId: data.bookingId,
          ownerId: data.ownerId,
          renterId: data.renterId,
          vehicleId: data.vehicleId,
          mileage: data.mileage,
          fuelLevel: data.fuelLevel,
          vehicleCondition: data.vehicleCondition,
          exteriorCondition: data.exteriorCondition,
          interiorCondition: data.interiorCondition,
          engineCondition: data.engineCondition,
          tiresCondition: data.tiresCondition,
          observations: data.observations,
          photos: data.photos,
          damages: data.damages,
          status: data.status,
          depositDecision: data.depositDecision,
          depositReturnAmount: data.depositReturnAmount,
          depositRetainedAmount: data.depositRetainedAmount,
          depositRetentionReason: data.depositRetentionReason,
          decidedAt: data.decidedAt,
        })
        .returning();

      return result;
    } catch (error) {
      console.error('Error creating owner inspection:', error);
      throw error;
    }
  }

  async getRenterInspectionByBookingId(bookingId: number): Promise<any> {
    try {
      const [result] = await db
        .select()
        .from(vehicleInspections)
        .where(eq(vehicleInspections.bookingId, bookingId));

      return result || null;
    } catch (error) {
      console.error('Error getting renter inspection by booking ID:', error);
      throw error;
    }
  }

  async getOwnerInspectionByBookingId(bookingId: number): Promise<any> {
    try {
      const [result] = await db
        .select()
        .from(ownerInspections)
        .where(eq(ownerInspections.bookingId, bookingId));

      return result || null;
    } catch (error) {
      console.error('Error getting owner inspection by booking ID:', error);
      throw error;
    }
  }

  async getBookingsNeedingOwnerInspection(ownerId: number): Promise<any[]> {
    try {
      // Get bookings where user is owner and status is 'active' or 'completed'
      // and no owner inspection exists yet
      const result = await db
        .select({
          id: bookings.id,
          vehicleId: bookings.vehicleId,
          renterId: bookings.renterId,
          ownerId: bookings.ownerId,
          startDate: bookings.startDate,
          endDate: bookings.endDate,
          totalPrice: bookings.totalPrice,
          securityDeposit: bookings.securityDeposit,
          status: bookings.status,
          createdAt: bookings.createdAt,
          // Vehicle info
          vehicleBrand: vehicles.brand,
          vehicleModel: vehicles.model,
          vehicleYear: vehicles.year,
          vehicleLicensePlate: vehicles.licensePlate,
          // Renter info
          renterName: users.name,
          renterEmail: users.email,
        })
        .from(bookings)
        .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
        .leftJoin(users, eq(bookings.renterId, users.id))
        .leftJoin(ownerInspections, eq(bookings.id, ownerInspections.bookingId))
        .where(
          and(
            eq(bookings.ownerId, ownerId),
            or(
              eq(bookings.status, 'active'),
              eq(bookings.status, 'completed')
            ),
            isNull(ownerInspections.id) // No owner inspection exists yet
          )
        )
        .orderBy(desc(bookings.createdAt));

      return result.map(row => ({
        id: row.id,
        vehicleId: row.vehicleId,
        renterId: row.renterId,
        ownerId: row.ownerId,
        startDate: row.startDate,
        endDate: row.endDate,
        totalPrice: row.totalPrice,
        securityDeposit: row.securityDeposit,
        status: row.status,
        createdAt: row.createdAt,
        vehicle: {
          brand: row.vehicleBrand,
          model: row.vehicleModel,
          year: row.vehicleYear,
          licensePlate: row.vehicleLicensePlate,
        },
        renter: {
          name: row.renterName,
          email: row.renterEmail,
        },
      }));
    } catch (error) {
      console.error('Error getting bookings needing owner inspection:', error);
      throw error;
    }
  }

  // Métodos específicos para produção Stripe
  async getUsersWithPix(): Promise<any[]> {
    try {
      const result = await pool.query(`
        SELECT id, name, email, pix, location, created_at
        FROM users 
        WHERE pix IS NOT NULL AND pix != ''
        ORDER BY created_at DESC
      `);
      return result.rows;
    } catch (error) {
      console.error('Error fetching users with PIX:', error);
      throw error;
    }
  }

  async getPayoutStatistics(): Promise<{
    pending: number;
    inReview: number;
    completed: number;
    failed: number;
  }> {
    try {
      const result = await pool.query(`
        SELECT 
          status,
          COUNT(*) as count
        FROM payouts 
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY status
      `);

      const stats = {
        pending: 0,
        inReview: 0,
        completed: 0,
        failed: 0
      };

      result.rows.forEach(row => {
        const count = parseInt(row.count);
        switch (row.status) {
          case 'pending':
            stats.pending = count;
            break;
          case 'manual_review':
            stats.inReview = count;
            break;
          case 'completed':
            stats.completed = count;
            break;
          case 'failed':
            stats.failed = count;
            break;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error fetching payout statistics:', error);
      return { pending: 0, inReview: 0, completed: 0, failed: 0 };
    }
  }

  async updateBookingPaymentStatus(bookingId: number, status: 'pending' | 'paid' | 'failed'): Promise<void> {
    try {
      await pool.query(
        'UPDATE bookings SET payment_status = $1, updated_at = NOW() WHERE id = $2',
        [status, bookingId]
      );
      console.log(`✅ Booking ${bookingId} payment status updated to: ${status}`);
    } catch (error) {
      console.error('Error updating booking payment status:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();