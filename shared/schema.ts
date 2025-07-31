import {
  pgTable,
  text,
  varchar,
  integer,
  decimal,
  boolean,
  timestamp,
  serial,
  date,
  jsonb,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { vehicleModelValidation, vehicleBrandValidation, vehicleBrandModelValidation } from "./vehicle-validation";
import { sql } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  role: varchar("role", { length: 20 }).notNull().default("renter"), // renter, owner, both, admin
  avatar: text("avatar"),
  isOwner: boolean("is_owner").default(false),
  isRenter: boolean("is_renter").default(true),
  isVerified: boolean("is_verified").default(false),
  rating: decimal("rating", { precision: 3, scale: 2 }).default('0'),
  totalRentals: integer("total_rentals").default(0),
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).default('0'),
  location: text("location"),
  verificationStatus: varchar("verification_status", { length: 20 }).default("pending").notNull(), // pending, verified, rejected
  documentsSubmitted: boolean("documents_submitted").default(false),
  documentsSubmittedAt: timestamp("documents_submitted_at"),
  verifiedAt: timestamp("verified_at"),
  rejectionReason: text("rejection_reason"),
  canRentVehicles: boolean("can_rent_vehicles").default(false),
  pix: varchar("pix", { length: 255 }), // Chave PIX para recebimento de valores
  // Subscription fields
  subscriptionPlan: varchar("subscription_plan", { length: 20 }).default("free").notNull(), // free, essencial, plus
  subscriptionStatus: varchar("subscription_status", { length: 20 }).default("active").notNull(), // active, cancelled, expired
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  subscriptionStripeId: varchar("subscription_stripe_id", { length: 255 }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  subscriptionPaymentMethod: varchar("subscription_payment_method", { length: 20 }).default("monthly"), // monthly, annual
  maxVehicleListings: integer("max_vehicle_listings").default(2).notNull(),
  highlightsUsed: integer("highlights_used").default(0).notNull(),
  highlightsAvailable: integer("highlights_available").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Document verification table
export const userDocuments = pgTable("user_documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  documentType: varchar("document_type", { length: 50 }).notNull(), // cpf, rg, cnh, comprovante_residencia
  documentUrl: text("document_url").notNull(),
  documentNumber: varchar("document_number", { length: 50 }),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, approved, rejected
  rejectionReason: text("rejection_reason"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: integer("reviewed_by").references(() => users.id), // admin user id
});

// Vehicles table  
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  brand: varchar("brand", { length: 50 }).notNull(),
  model: varchar("model", { length: 50 }).notNull(),
  year: integer("year").notNull(),
  color: text("color"),
  licensePlate: varchar("license_plate", { length: 8 }).notNull().unique(), // Placa do veículo (formato ABC-1234 ou ABC1D23)
  renavam: varchar("renavam", { length: 11 }).notNull().unique(), // Código RENAVAM (11 dígitos)
  category: varchar("category", { length: 50 }).notNull(),
  pricePerDay: decimal("price_per_day", { precision: 8, scale: 2 }).notNull(),
  pricePerWeek: decimal("price_per_week", { precision: 8, scale: 2 }),
  pricePerMonth: decimal("price_per_month", { precision: 8, scale: 2 }),
  location: text("location").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  description: text("description"),
  features: jsonb("features").$type<string[]>().default([]),
  images: jsonb("images").$type<string[]>().default([]),
  isAvailable: boolean("is_available").default(true),
  isVerified: boolean("is_verified").default(false),
  transmission: varchar("transmission", { length: 20 }).default("manual"),
  fuel: varchar("fuel", { length: 20 }).default("gasoline"),
  seats: integer("seats").default(5),
  rating: decimal("rating", { precision: 3, scale: 2 }).default('0'),
  totalBookings: integer("total_bookings").default(0),
  crlvDocument: text("crlv_document"), // URL do documento CRLV
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, approved, rejected
  statusReason: text("status_reason"), // Motivo da aprovação/rejeição
  reviewedBy: integer("reviewed_by").references(() => users.id), // Admin que fez a revisão
  reviewedAt: timestamp("reviewed_at"), // Data da revisão
  // Subscription features
  isHighlighted: boolean("is_highlighted").default(false).notNull(),
  highlightType: varchar("highlight_type", { length: 20 }), // prata, diamante
  highlightExpiresAt: timestamp("highlight_expires_at"),
  highlightUsageCount: integer("highlight_usage_count").default(0).notNull(),
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
  totalPrice: decimal("total_price", { precision: 8, scale: 2 }).notNull(),
  serviceFee: decimal("service_fee", { precision: 8, scale: 2 }),
  insuranceFee: decimal("insurance_fee", { precision: 8, scale: 2 }),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  paymentStatus: varchar("payment_status", { length: 20 }).default("pending"),
  paymentIntentId: varchar("payment_intent_id", { length: 255 }),
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
  rating: integer("rating").notNull(),
  comment: text("comment"),
  type: varchar("type", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  receiverId: integer("receiver_id").references(() => users.id).notNull(),
  bookingId: integer("booking_id"),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Contracts table
export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id).notNull(),
  contractNumber: varchar("contract_number", { length: 50 }).notNull().unique(),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  templateId: varchar("template_id", { length: 50 }),
  contractData: jsonb("contract_data").$type<Record<string, any>>().notNull(),
  signaturePlatform: varchar("signature_platform", { length: 20 }).default("docusign"),
  externalDocumentId: varchar("external_document_id", { length: 100 }),
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
  pdfUrl: text("pdf_url"),
  signedPdfUrl: text("signed_pdf_url"),
  cloudStorageId: varchar("cloud_storage_id", { length: 100 }),
  createdBy: integer("created_by").references(() => users.id),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  cancelledAt: timestamp("cancelled_at"),
  cancellationReason: text("cancellation_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contract templates table
export const contractTemplates = pgTable("contract_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(),
  htmlTemplate: text("html_template").notNull(),
  fields: jsonb("fields").$type<{
    name: string;
    type: string;
    required: boolean;
    defaultValue?: string;
  }[]>().default([]),
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
  referrerId: integer("referrer_id").references(() => users.id).notNull(),
  referredId: integer("referred_id").references(() => users.id).notNull(),
  referralCode: varchar("referral_code", { length: 20 }).notNull().unique(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  rewardPoints: integer("reward_points").default(100),
  rewardStatus: varchar("reward_status", { length: 20 }).default("pending"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User activity tracking for suggestions
export const userActivity = pgTable("user_activity", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  activityType: varchar("activity_type", { length: 50 }).notNull(),
  searchQuery: text("search_query"),
  vehicleId: integer("vehicle_id").references(() => vehicles.id),
  filters: jsonb("filters").$type<{
    category?: string;
    priceMin?: number;
    priceMax?: number;
    location?: string;
    features?: string[];
  }>(),
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
  availablePoints: integer("available_points").default(0),
  usedPoints: integer("used_points").default(0),
  referralCount: integer("referral_count").default(0),
  successfulReferrals: integer("successful_referrals").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Save for later (bookmarks) system
export const savedVehicles = pgTable("saved_vehicles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  notes: text("notes"), // Optional notes from user
  category: varchar("category", { length: 50 }).default("default"), // user-defined categories
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high
  reminderDate: timestamp("reminder_date"), // Optional reminder date
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique("unique_user_vehicle").on(table.userId, table.vehicleId),
  index("idx_saved_vehicles_user").on(table.userId),
  index("idx_saved_vehicles_category").on(table.category),
]);

// Reward transactions
export const rewardTransactions = pgTable("reward_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  points: integer("points").notNull(),
  source: varchar("source", { length: 50 }).notNull(),
  sourceId: integer("source_id"),
  description: text("description"),
  bookingId: integer("booking_id").references(() => bookings.id),
  discountAmount: decimal("discount_amount", { precision: 8, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Contract audit log
export const contractAuditLog = pgTable("contract_audit_log", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").references(() => contracts.id).notNull(),
  action: varchar("action", { length: 50 }).notNull(),
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

// Vehicle brands table for admin management
export const vehicleBrands = pgTable("vehicle_brands", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  logoUrl: text("logo_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    nameUnique: unique().on(table.name),
  };
});

// Vehicle availability table
export const vehicleAvailability = pgTable("vehicle_availability", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isAvailable: boolean("is_available").default(true),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Waiting queue table
export const waitingQueue = pgTable("waiting_queue", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  desiredStartDate: date("desired_start_date").notNull(),
  desiredEndDate: date("desired_end_date").notNull(),
  notificationSent: boolean("notification_sent").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
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
  referralsMade: many(referrals, { relationName: "referralsMade" }),
  referralsReceived: many(referrals, { relationName: "referralsReceived" }),
  rewards: one(userRewards),
  rewardTransactions: many(rewardTransactions),
  activities: many(userActivity),
  documents: many(userDocuments),
  savedVehicles: many(savedVehicles),
}));

export const userDocumentsRelations = relations(userDocuments, ({ one }) => ({
  user: one(users, {
    fields: [userDocuments.userId],
    references: [users.id],
  }),
  reviewedByUser: one(users, {
    fields: [userDocuments.reviewedBy],
    references: [users.id],
  }),
}));

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  owner: one(users, {
    fields: [vehicles.ownerId],
    references: [users.id],
  }),
  bookings: many(bookings),
  reviews: many(reviews),
  savedByUsers: many(savedVehicles),
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

export const vehicleAvailabilityRelations = relations(vehicleAvailability, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [vehicleAvailability.vehicleId],
    references: [vehicles.id],
  }),
}));

export const waitingQueueRelations = relations(waitingQueue, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [waitingQueue.vehicleId],
    references: [vehicles.id],
  }),
  user: one(users, {
    fields: [waitingQueue.userId],
    references: [users.id],
  }),
}));

export const savedVehiclesRelations = relations(savedVehicles, ({ one }) => ({
  user: one(users, {
    fields: [savedVehicles.userId],
    references: [users.id],
  }),
  vehicle: one(vehicles, {
    fields: [savedVehicles.vehicleId],
    references: [vehicles.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  verifiedAt: true,
  documentsSubmittedAt: true,
});

export const insertUserDocumentSchema = createInsertSchema(userDocuments).omit({
  id: true,
  uploadedAt: true,
  reviewedAt: true,
  reviewedBy: true,
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  reviewedBy: true,
  reviewedAt: true,
}).extend({
  model: z.string()
    .min(1, "Modelo é obrigatório")
    .max(50, "Modelo não pode ter mais de 50 caracteres")
    .transform(val => val.trim()),
  brand: z.string()
    .min(1, "Marca é obrigatória")
    .max(30, "Marca não pode ter mais de 30 caracteres")
    .transform(val => val.trim()),
  pricePerDay: z.union([z.string(), z.number()]).transform(val => String(val)),
  pricePerWeek: z.union([z.string(), z.number()]).optional().transform(val => val ? String(val) : undefined),
  pricePerMonth: z.union([z.string(), z.number()]).optional().transform(val => val ? String(val) : undefined),
  licensePlate: z.string()
    .min(7, "Placa deve ter pelo menos 7 caracteres")
    .max(8, "Placa deve ter no máximo 8 caracteres")
    .regex(/^[A-Z]{3}[-]?[0-9][A-Z0-9][0-9]{2}$/, "Formato de placa inválido. Use ABC-1234 ou ABC1D23"),
  renavam: z.string()
    .length(11, "RENAVAM deve ter exatamente 11 dígitos")
    .regex(/^[0-9]{11}$/, "RENAVAM deve conter apenas números"),
  crlvDocument: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
  statusReason: z.string().optional(),
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

export const insertVehicleAvailabilitySchema = createInsertSchema(vehicleAvailability).omit({
  id: true,
  createdAt: true,
});

export const insertWaitingQueueSchema = createInsertSchema(waitingQueue).omit({
  id: true,
  createdAt: true,
});

export const insertSavedVehicleSchema = createInsertSchema(savedVehicles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateSavedVehicleSchema = createInsertSchema(savedVehicles).omit({
  id: true,
  userId: true,
  vehicleId: true,
  createdAt: true,
}).partial();

// Types
export type User = typeof users.$inferSelect;
export type InsertSavedVehicle = z.infer<typeof insertSavedVehicleSchema>;
export type UpdateSavedVehicle = z.infer<typeof updateSavedVehicleSchema>;
export type SavedVehicle = typeof savedVehicles.$inferSelect;

// Admin Settings table
export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  serviceFeePercentage: decimal("service_fee_percentage", { precision: 5, scale: 2 }).default("10.00").notNull(),
  insuranceFeePercentage: decimal("insurance_fee_percentage", { precision: 5, scale: 2 }).default("15.00").notNull(),
  minimumBookingDays: integer("minimum_booking_days").default(1).notNull(),
  maximumBookingDays: integer("maximum_booking_days").default(30).notNull(),
  cancellationPolicyDays: integer("cancellation_policy_days").default(2).notNull(),
  currency: varchar("currency", { length: 10 }).default("BRL").notNull(),
  supportEmail: varchar("support_email", { length: 255 }).default("suporte@carshare.com").notNull(),
  supportPhone: varchar("support_phone", { length: 50 }).default("(11) 9999-9999").notNull(),
  enablePixPayment: boolean("enable_pix_payment").default(false).notNull(),
  enablePixTransfer: boolean("enable_pix_transfer").default(true).notNull(),
  pixTransferDescription: varchar("pix_transfer_description", { length: 255 }).default("Repasse CarShare").notNull(),
  // Subscription plan pricing
  essentialPlanPrice: decimal("essential_plan_price", { precision: 8, scale: 2 }).default("29.90").notNull(),
  plusPlanPrice: decimal("plus_plan_price", { precision: 8, scale: 2 }).default("59.90").notNull(),
  annualDiscountPercentage: decimal("annual_discount_percentage", { precision: 5, scale: 2 }).default("20.00").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type AdminSettings = typeof adminSettings.$inferSelect;
export type InsertAdminSettings = typeof adminSettings.$inferInsert;

// Coupon Schema
export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).unique().notNull(),
  description: text("description").notNull(),
  discountType: varchar("discount_type", { length: 20 }).notNull(), // 'percentage' or 'fixed'
  discountValue: integer("discount_value").notNull(), // percentage (1-100) or fixed amount in cents
  minOrderValue: integer("min_order_value").default(0), // minimum order value in cents
  maxUses: integer("max_uses").default(1), // maximum number of uses
  usedCount: integer("used_count").default(0), // current usage count
  isActive: boolean("is_active").default(true),
  validFrom: timestamp("valid_from").defaultNow(),
  validUntil: timestamp("valid_until").notNull(),
  createdBy: integer("created_by").notNull(), // admin user id
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Coupon Usage Tracking
export const couponUsage = pgTable("coupon_usage", {
  id: serial("id").primaryKey(),
  couponId: integer("coupon_id").references(() => coupons.id).notNull(),
  userId: integer("user_id").notNull(),
  bookingId: integer("booking_id"), // optional, for tracking which booking used the coupon
  discountAmount: integer("discount_amount").notNull(), // actual discount applied in cents
  usedAt: timestamp("used_at").defaultNow(),
});

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = typeof coupons.$inferInsert;
export type CouponUsage = typeof couponUsage.$inferSelect;
export type InsertCouponUsage = typeof couponUsage.$inferInsert;

// Payment Transfers - Sistema de repasses para proprietários
export const payouts = pgTable("payouts", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id).notNull(),
  ownerId: integer("owner_id").references(() => users.id).notNull(), // Proprietário do veículo
  renterId: integer("renter_id").references(() => users.id).notNull(), // Locatário
  totalBookingAmount: decimal("total_booking_amount", { precision: 10, scale: 2 }).notNull(), // Valor total da reserva
  serviceFee: decimal("service_fee", { precision: 10, scale: 2 }).notNull(), // Taxa da plataforma
  insuranceFee: decimal("insurance_fee", { precision: 10, scale: 2 }).notNull(), // Taxa de seguro
  couponDiscount: decimal("coupon_discount", { precision: 10, scale: 2 }).default('0'), // Desconto aplicado
  netAmount: decimal("net_amount", { precision: 10, scale: 2 }).notNull(), // Valor líquido para o proprietário
  ownerPix: varchar("owner_pix", { length: 255 }).notNull(), // PIX do proprietário na época do pagamento
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, processing, completed, failed
  method: varchar("method", { length: 20 }).default("pix").notNull(), // pix, bank_transfer
  payoutDate: timestamp("payout_date"),
  reference: varchar("reference", { length: 100 }), // ID da transferência bancária/PIX
  failureReason: text("failure_reason"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Payout = typeof payouts.$inferSelect;
export type InsertPayout = typeof payouts.$inferInsert;

// Subscription Plans table
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(), // free, essencial, plus
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  monthlyPrice: decimal("monthly_price", { precision: 8, scale: 2 }).notNull(),
  annualPrice: decimal("annual_price", { precision: 8, scale: 2 }).notNull(),
  maxVehicleListings: integer("max_vehicle_listings").notNull(),
  highlightType: varchar("highlight_type", { length: 20 }), // null, prata, diamante
  highlightCount: integer("highlight_count").default(0).notNull(),
  features: jsonb("features").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Subscriptions table
export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  planId: integer("plan_id").references(() => subscriptionPlans.id).notNull(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  status: varchar("status", { length: 20 }).default("active").notNull(), // active, cancelled, expired, past_due
  paymentMethod: varchar("payment_method", { length: 20 }).default("monthly").notNull(), // monthly, annual
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserDocument = typeof userDocuments.$inferSelect;
export type InsertUserDocument = z.infer<typeof insertUserDocumentSchema>;
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
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type UserRewards = typeof userRewards.$inferSelect;
export type InsertUserRewards = z.infer<typeof insertUserRewardsSchema>;
export type RewardTransaction = typeof rewardTransactions.$inferSelect;
export type InsertRewardTransaction = z.infer<typeof insertRewardTransactionSchema>;
export type UserActivity = typeof userActivity.$inferSelect;
export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;
export type VehicleAvailability = typeof vehicleAvailability.$inferSelect;
export type InsertVehicleAvailability = z.infer<typeof insertVehicleAvailabilitySchema>;
export type WaitingQueue = typeof waitingQueue.$inferSelect;
export type InsertWaitingQueue = z.infer<typeof insertWaitingQueueSchema>;

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

export type UserWithStats = User & {
  ownedVehicles?: Vehicle[];
  renterBookings?: Booking[];
  ownerBookings?: Booking[];
};