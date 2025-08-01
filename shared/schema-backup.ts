import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, jsonb, unique, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { vehicleModelValidation, vehicleBrandValidation, vehicleBrandModelValidation } from "./vehicle-validation";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  phone: varchar("phone", { length: 20 }),
  avatar: text("avatar"),
  isOwner: boolean("is_owner").default(false),
  isRenter: boolean("is_renter").default(true),
  isVerified: boolean("is_verified").default(false),
  role: varchar("role", { length: 20 }).default("user"), // user, admin
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  totalRentals: integer("total_rentals").default(0),
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).default("0"),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vehicles table
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  color: text("color"),
  transmission: varchar("transmission", { length: 20 }).notNull(), // manual, automatic, cvt
  fuel: varchar("fuel", { length: 20 }).notNull(), // flex, gasoline, ethanol, diesel, electric, hybrid
  seats: integer("seats").notNull(),
  category: varchar("category", { length: 20 }).notNull(), // hatch, sedan, suv, pickup
  features: jsonb("features").$type<string[]>().default([]),
  images: jsonb("images").$type<string[]>().default([]),
  location: text("location").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  pricePerDay: decimal("price_per_day", { precision: 8, scale: 2 }).notNull(),
  pricePerWeek: decimal("price_per_week", { precision: 8, scale: 2 }),
  pricePerMonth: decimal("price_per_month", { precision: 8, scale: 2 }),
  description: text("description"),
  isAvailable: boolean("is_available").default(true),
  isVerified: boolean("is_verified").default(false),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  totalBookings: integer("total_bookings").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  renterId: integer("renter_id").references(() => users.id).notNull(),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, approved, rejected, active, completed, cancelled
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  servicefee: decimal("service_fee", { precision: 10, scale: 2 }).notNull(),
  insuranceFee: decimal("insurance_fee", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: varchar("payment_status", { length: 20 }).default("pending"), // pending, paid, refunded
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reviews table
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id).notNull(),
  reviewerId: integer("reviewer_id").references(() => users.id).notNull(),
  revieweeId: integer("reviewee_id").references(() => users.id).notNull(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  type: varchar("type", { length: 20 }).notNull(), // vehicle, renter, owner
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  receiverId: integer("receiver_id").references(() => users.id).notNull(),
  bookingId: integer("booking_id"), // Remove foreign key constraint
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Contracts table
export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id).notNull(),
  contractNumber: varchar("contract_number", { length: 50 }).notNull().unique(),
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, sent, signed, completed, cancelled
  
  // Contract content
  templateId: varchar("template_id", { length: 50 }),
  contractData: jsonb("contract_data").$type<{
    vehicle: any;
    renter: any;
    owner: any;
    booking: any;
    terms: any;
  }>().notNull(),
  
  // Digital signature platform integration
  signaturePlatform: varchar("signature_platform", { length: 20 }).default("autentique"), // autentique, d4sign, clicksign
  externalDocumentId: varchar("external_document_id", { length: 100 }),
  
  // Signatures
  renterSigned: boolean("renter_signed").default(false),
  renterSignedAt: timestamp("renter_signed_at"),
  renterSignatureIp: varchar("renter_signature_ip", { length: 45 }),
  renterSignatureEvidence: jsonb("renter_signature_evidence").$type<{
    ip: string;
    userAgent: string;
    timestamp: string;
    location?: string;
  }>(),
  
  ownerSigned: boolean("owner_signed").default(false),
  ownerSignedAt: timestamp("owner_signed_at"),
  ownerSignatureIp: varchar("owner_signature_ip", { length: 45 }),
  ownerSignatureEvidence: jsonb("owner_signature_evidence").$type<{
    ip: string;
    userAgent: string;
    timestamp: string;
    location?: string;
  }>(),
  
  // Document storage
  pdfUrl: text("pdf_url"),
  signedPdfUrl: text("signed_pdf_url"),
  cloudStorageId: varchar("cloud_storage_id", { length: 100 }),
  
  // Admin audit
  createdBy: integer("created_by").references(() => users.id),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contract templates table
export const contractTemplates = pgTable("contract_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(), // standard, premium, commercial
  
  // Template content
  htmlTemplate: text("html_template").notNull(),
  fields: jsonb("fields").$type<{
    name: string;
    type: string;
    required: boolean;
    defaultValue?: string;
  }[]>().default([]),
  
  // Signature configuration
  signaturePoints: jsonb("signature_points").$type<{
    renter: { x: number; y: number; page: number };
    owner: { x: number; y: number; page: number };
  }>().notNull(),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Referral system table
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").references(() => users.id).notNull(), // Who invited
  referredId: integer("referred_id").references(() => users.id).notNull(), // Who was invited
  referralCode: varchar("referral_code", { length: 20 }).notNull().unique(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, completed, expired
  rewardPoints: integer("reward_points").default(100), // Points earned for referral
  rewardStatus: varchar("reward_status", { length: 20 }).default("pending"), // pending, granted, expired
  completedAt: timestamp("completed_at"), // When referred user completed first booking
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User activity tracking for suggestions
export const userActivity = pgTable("user_activity", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  activityType: varchar("activity_type", { length: 50 }).notNull(), // search, view, book, favorite
  
  // Activity data
  searchQuery: text("search_query"), // For search activities
  vehicleId: integer("vehicle_id").references(() => vehicles.id), // For view/book activities
  filters: jsonb("filters").$type<{
    category?: string;
    priceMin?: number;
    priceMax?: number;
    location?: string;
    features?: string[];
  }>(), // Search filters used
  
  // Contextual data
  sessionId: varchar("session_id", { length: 100 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// User reward points system
export const userRewards = pgTable("user_rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  totalPoints: integer("total_points").default(0),
  availablePoints: integer("available_points").default(0), // Points that can be used
  usedPoints: integer("used_points").default(0),
  
  // Referral tracking
  referralCount: integer("referral_count").default(0),
  successfulReferrals: integer("successful_referrals").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reward transactions
export const rewardTransactions = pgTable("reward_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // earned, used, expired
  points: integer("points").notNull(),
  source: varchar("source", { length: 50 }).notNull(), // referral, booking, promotion
  sourceId: integer("source_id"), // ID of referral, booking, etc.
  description: text("description"),
  
  // Usage tracking
  bookingId: integer("booking_id").references(() => bookings.id), // If used for booking discount
  discountAmount: decimal("discount_amount", { precision: 8, scale: 2 }), // Discount applied
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Contract audit log
export const contractAuditLog = pgTable("contract_audit_log", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").references(() => contracts.id).notNull(),
  action: varchar("action", { length: 50 }).notNull(), // created, sent, viewed, signed, downloaded
  performedBy: integer("performed_by").references(() => users.id),
  details: jsonb("details").$type<{
    ip?: string;
    userAgent?: string;
    previousStatus?: string;
    newStatus?: string;
    metadata?: any;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Contract relations
export const contractsRelations = relations(contracts, ({ one, many }) => ({
  booking: one(bookings, {
    fields: [contracts.bookingId],
    references: [bookings.id],
  }),
  template: one(contractTemplates, {
    fields: [contracts.templateId],
    references: [contractTemplates.id],
  }),
  createdByUser: one(users, {
    fields: [contracts.createdBy],
    references: [users.id],
    relationName: "createdContracts",
  }),
  reviewedByUser: one(users, {
    fields: [contracts.reviewedBy],
    references: [users.id],
    relationName: "reviewedContracts",
  }),
  auditLogs: many(contractAuditLog),
}));

export const contractTemplatesRelations = relations(contractTemplates, ({ many }) => ({
  contracts: many(contracts),
}));

export const contractAuditLogRelations = relations(contractAuditLog, ({ one }) => ({
  contract: one(contracts, {
    fields: [contractAuditLog.contractId],
    references: [contracts.id],
  }),
  performedByUser: one(users, {
    fields: [contractAuditLog.performedBy],
    references: [users.id],
  }),
}));

// Vehicle brands table for admin management
export const vehicleBrands = pgTable("vehicle_brands", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    nameUnique: unique().on(table.name),
  };
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  ownedVehicles: many(vehicles),
  renterBookings: many(bookings, { relationName: "renterBookings" }),
  ownerBookings: many(bookings, { relationName: "ownerBookings" }),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
  givenReviews: many(reviews, { relationName: "givenReviews" }),
  receivedReviews: many(reviews, { relationName: "receivedReviews" }),
  createdContracts: many(contracts, { relationName: "createdContracts" }),
  reviewedContracts: many(contracts, { relationName: "reviewedContracts" }),
  auditActions: many(contractAuditLog),
  // Referral relations
  referralsMade: many(referrals, { relationName: "referralsMade" }),
  referralsReceived: many(referrals, { relationName: "referralsReceived" }),
  rewards: one(userRewards),
  rewardTransactions: many(rewardTransactions),
  activities: many(userActivity),
}));

// Add relations for new tables
export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
    relationName: "referralsMade",
  }),
  referred: one(users, {
    fields: [referrals.referredId],
    references: [users.id],
    relationName: "referralsReceived",
  }),
}));

export const userRewardsRelations = relations(userRewards, ({ one, many }) => ({
  user: one(users, {
    fields: [userRewards.userId],
    references: [users.id],
  }),
  transactions: many(rewardTransactions),
}));

export const rewardTransactionsRelations = relations(rewardTransactions, ({ one }) => ({
  user: one(users, {
    fields: [rewardTransactions.userId],
    references: [users.id],
  }),
  booking: one(bookings, {
    fields: [rewardTransactions.bookingId],
    references: [bookings.id],
  }),
  rewards: one(userRewards, {
    fields: [rewardTransactions.userId],
    references: [userRewards.userId],
  }),
}));

export const userActivityRelations = relations(userActivity, ({ one }) => ({
  user: one(users, {
    fields: [userActivity.userId],
    references: [users.id],
  }),
  vehicle: one(vehicles, {
    fields: [userActivity.vehicleId],
    references: [vehicles.id],
  }),
}));

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  owner: one(users, {
    fields: [vehicles.ownerId],
    references: [users.id],
  }),
  bookings: many(bookings),
  reviews: many(reviews),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  vehicle: one(vehicles, {
    fields: [bookings.vehicleId],
    references: [vehicles.id],
  }),
  renter: one(users, {
    fields: [bookings.renterId],
    references: [users.id],
    relationName: "renterBookings",
  }),
  owner: one(users, {
    fields: [bookings.ownerId],
    references: [users.id],
    relationName: "ownerBookings",
  }),
  messages: many(messages),
  reviews: many(reviews),
  contract: one(contracts, {
    fields: [bookings.id],
    references: [contracts.bookingId],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  booking: one(bookings, {
    fields: [reviews.bookingId],
    references: [bookings.id],
  }),
  reviewer: one(users, {
    fields: [reviews.reviewerId],
    references: [users.id],
    relationName: "givenReviews",
  }),
  reviewee: one(users, {
    fields: [reviews.revieweeId],
    references: [users.id],
    relationName: "receivedReviews",
  }),
  vehicle: one(vehicles, {
    fields: [reviews.vehicleId],
    references: [vehicles.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sentMessages",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receivedMessages",
  }),
  booking: one(bookings, {
    fields: [messages.bookingId],
    references: [bookings.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Vehicle schemas with enhanced validation
export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  model: vehicleModelValidation,
  brand: vehicleBrandValidation,
  // Allow both string and number for price fields
  pricePerDay: z.union([z.string(), z.number()]).transform(val => String(val)),
  pricePerWeek: z.union([z.string(), z.number()]).optional().transform(val => val ? String(val) : undefined),
  pricePerMonth: z.union([z.string(), z.number()]).optional().transform(val => val ? String(val) : undefined),
}).refine(vehicleBrandModelValidation, {
  message: "Modelo inválido para a marca selecionada",
  path: ["model"]
});

// New schemas for referral and reward system
export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserRewardsSchema = createInsertSchema(userRewards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRewardTransactionSchema = createInsertSchema(rewardTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertUserActivitySchema = createInsertSchema(userActivity).omit({
  id: true,
  createdAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContractTemplateSchema = createInsertSchema(contractTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContractAuditLogSchema = createInsertSchema(contractAuditLog).omit({
  id: true,
  createdAt: true,
});

export const insertVehicleBrandSchema = createInsertSchema(vehicleBrands).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Contract = typeof contracts.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;
export type ContractTemplate = typeof contractTemplates.$inferSelect;
export type InsertContractTemplate = z.infer<typeof insertContractTemplateSchema>;
export type ContractAuditLog = typeof contractAuditLog.$inferSelect;
export type InsertContractAuditLog = z.infer<typeof insertContractAuditLogSchema>;
export type VehicleBrand = typeof vehicleBrands.$inferSelect;
export type InsertVehicleBrand = z.infer<typeof insertVehicleBrandSchema>;

// New types
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type UserRewards = typeof userRewards.$inferSelect;
export type InsertUserRewards = z.infer<typeof insertUserRewardsSchema>;
export type RewardTransaction = typeof rewardTransactions.$inferSelect;
export type InsertRewardTransaction = z.infer<typeof insertRewardTransactionSchema>;
export type UserActivity = typeof userActivity.$inferSelect;
export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;

// Extended types with relations
export type VehicleWithOwner = Vehicle & {
  owner: User;
};

export type BookingWithDetails = Booking & {
  vehicle: Vehicle;
  renter: User;
  owner: User;
};

export type ContractWithDetails = Contract & {
  booking: BookingWithDetails;
};

// Main types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Contract = typeof contracts.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;
export type ContractTemplate = typeof contractTemplates.$inferSelect;
export type InsertContractTemplate = z.infer<typeof insertContractTemplateSchema>;
export type ContractAuditLog = typeof contractAuditLog.$inferSelect;
export type InsertContractAuditLog = z.infer<typeof insertContractAuditLogSchema>;
export type VehicleBrand = typeof vehicleBrands.$inferSelect;
export type InsertVehicleBrand = z.infer<typeof insertVehicleBrandSchema>;

// Extended types with relations
export type UserWithStats = User & {
  ownedVehicles?: Vehicle[];
  renterBookings?: Booking[];
  ownerBookings?: Booking[];
};

// Additional schemas for vehicle management (existing tables)
export const insertVehicleAvailabilitySchema = createInsertSchema(vehicleAvailability).omit({
  id: true,
  createdAt: true,
});

export const insertWaitingQueueSchema = createInsertSchema(waitingQueue).omit({
  id: true,
  createdAt: true,
});

export type VehicleAvailability = typeof vehicleAvailability.$inferSelect;
export type InsertVehicleAvailability = z.infer<typeof insertVehicleAvailabilitySchema>;
export type WaitingQueue = typeof waitingQueue.$inferSelect;
export type InsertWaitingQueue = z.infer<typeof insertWaitingQueueSchema>;
  user: one(users, {
    fields: [waitingQueue.userId],
    references: [users.id],
  }),
}));

// Schemas para as novas tabelas
export const insertVehicleAvailabilitySchema = createInsertSchema(vehicleAvailability).omit({
  id: true,
  createdAt: true,
});

export const insertWaitingQueueSchema = createInsertSchema(waitingQueue).omit({
  id: true,
  createdAt: true,
});

// Types para as novas tabelas
export type VehicleAvailability = typeof vehicleAvailability.$inferSelect;
export type InsertVehicleAvailability = z.infer<typeof insertVehicleAvailabilitySchema>;
export type WaitingQueue = typeof waitingQueue.$inferSelect;
export type InsertWaitingQueue = z.infer<typeof insertWaitingQueueSchema>;
