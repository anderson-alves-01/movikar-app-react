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
  // Aceite de Termos de Uso
  acceptedTermsAt: timestamp("accepted_terms_at"),
  acceptedTermsVersion: varchar("accepted_terms_version", { length: 10 }).default("1.0"),
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
  // Caução (security deposit) - valor ou percentual
  securityDepositPercentage: decimal("security_deposit_percentage", { precision: 5, scale: 2 }).default('20.00'),
  securityDepositValue: decimal("security_deposit_value", { precision: 8, scale: 2 }).default('20.00'),
  securityDepositType: varchar("security_deposit_type", { length: 10 }).default('percentage').notNull(), // percentage, fixed
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
  securityDeposit: decimal("security_deposit", { precision: 8, scale: 2 }),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  paymentStatus: varchar("payment_status", { length: 20 }).default("pending"),
  paymentIntentId: varchar("payment_intent_id", { length: 255 }),
  inspectionStatus: varchar("inspection_status", { length: 20 }).default("not_required"), // not_required, pending, completed
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
  referredId: integer("referred_id").references(() => users.id),
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
  inspectionsAsRenter: many(vehicleInspections, { relationName: "inspectionsAsRenter" }),
  inspectionsAsOwner: many(vehicleInspections, { relationName: "inspectionsAsOwner" }),
  payoutsAsOwner: many(payouts, { relationName: "payoutsAsOwner" }),
  payoutsAsRenter: many(payouts, { relationName: "payoutsAsRenter" }),
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
  supportEmail: varchar("support_email", { length: 255 }).default("sac@alugae.mobi").notNull(),
  supportPhone: varchar("support_phone", { length: 50 }).default("(11) 9999-9999").notNull(),
  enablePixPayment: boolean("enable_pix_payment").default(false).notNull(),
  enablePixTransfer: boolean("enable_pix_transfer").default(true).notNull(),
  pixTransferDescription: varchar("pix_transfer_description", { length: 255 }).default("Repasse alugae").notNull(),
  enableInsuranceOption: boolean("enable_insurance_option").default(true).notNull(),
  enableContractSignature: boolean("enable_contract_signature").default(false).notNull(), // Feature toggle para assinatura de contratos
  enableRentNowCheckout: boolean("enable_rent_now_checkout").default(false).notNull(), // Feature toggle para checkout "Aluga agora"
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

// Vehicle Inspections table - Sistema de vistoria antes do repasse
export const vehicleInspections = pgTable("vehicle_inspections", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id).notNull(),
  renterId: integer("renter_id").references(() => users.id).notNull(), // Locatário que faz a vistoria
  ownerId: integer("owner_id").references(() => users.id).notNull(), // Proprietário do veículo
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  
  // Dados da vistoria
  mileage: integer("mileage").notNull(), // Quilometragem atual
  fuelLevel: varchar("fuel_level", { length: 20 }).notNull(), // numeric value (0-100)
  vehicleCondition: varchar("vehicle_condition", { length: 20 }).notNull(), // excellent, good, fair, poor
  
  // Fotos da vistoria
  photos: jsonb("photos").$type<string[]>().default([]), // URLs das fotos
  
  // Observações e problemas encontrados
  observations: text("observations"), // Observações gerais do locatário
  damages: jsonb("damages").$type<{
    type: string; // scratch, dent, broken_glass, interior_damage, etc
    location: string; // front, rear, left_side, right_side, interior
    severity: string; // minor, moderate, severe
    description: string;
    photo?: string; // URL da foto específica do dano
  }[]>().default([]),
  
  // Decisão da vistoria
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, approved, rejected
  approvalDecision: boolean("approval_decision"), // true = aprovado, false = rejeitado
  rejectionReason: text("rejection_reason"), // Motivo da rejeição
  
  // Valores para reembolso (se rejeitado)
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }), // Valor a ser reembolsado
  refundReason: text("refund_reason"), // Motivo específico do reembolso
  
  // Timestamps
  inspectedAt: timestamp("inspected_at").defaultNow(),
  decidedAt: timestamp("decided_at"), // Quando a decisão foi tomada
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vistorias do Proprietário (após devolução do veículo)
export const ownerInspections = pgTable("owner_inspections", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id).notNull(),
  ownerId: integer("owner_id").references(() => users.id).notNull(), // Proprietário que faz a vistoria
  renterId: integer("renter_id").references(() => users.id).notNull(), // Locatário
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  
  // Dados da vistoria do proprietário
  mileage: integer("mileage").notNull(), // Quilometragem na devolução
  fuelLevel: varchar("fuel_level", { length: 20 }).notNull(), // numeric value (0-100)
  vehicleCondition: varchar("vehicle_condition", { length: 20 }).notNull(), // excellent, good, fair, poor
  exteriorCondition: varchar("exterior_condition", { length: 20 }).notNull(),
  interiorCondition: varchar("interior_condition", { length: 20 }).notNull(),
  engineCondition: varchar("engine_condition", { length: 20 }).notNull(),
  tiresCondition: varchar("tires_condition", { length: 20 }).notNull(),
  
  // Fotos da vistoria
  photos: jsonb("photos").$type<string[]>().default([]), // URLs das fotos
  
  // Observações e problemas encontrados
  observations: text("observations"), // Observações do proprietário
  damages: jsonb("damages").$type<{
    type: string; // scratch, dent, broken_glass, interior_damage, etc
    location: string; // front, rear, left_side, right_side, interior
    severity: string; // minor, moderate, severe
    description: string;
    photo?: string; // URL da foto específica do dano
  }[]>().default([]),
  
  // Decisão sobre a caução
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, approved, rejected
  depositDecision: varchar("deposit_decision", { length: 20 }), // full_return, partial_return, no_return
  depositReturnAmount: decimal("deposit_return_amount", { precision: 10, scale: 2 }), // Valor a ser devolvido da caução
  depositRetainedAmount: decimal("deposit_retained_amount", { precision: 10, scale: 2 }), // Valor retido da caução
  depositRetentionReason: text("deposit_retention_reason"), // Motivo da retenção
  
  // Timestamps
  inspectedAt: timestamp("inspected_at").defaultNow(),
  decidedAt: timestamp("decided_at"), // Quando a decisão foi tomada
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type VehicleInspection = typeof vehicleInspections.$inferSelect;
export type InsertVehicleInspection = typeof vehicleInspections.$inferInsert;

export type OwnerInspection = typeof ownerInspections.$inferSelect;
export type InsertOwnerInspection = typeof ownerInspections.$inferInsert;

// Schema para validação do formulário da vistoria do proprietário
export const insertOwnerInspectionFormSchema = z.object({
  bookingId: z.union([z.number(), z.string()]).transform(val => Number(val)),
  vehicleId: z.union([z.number(), z.string()]).transform(val => Number(val)),
  mileage: z.number().min(0, "Quilometragem deve ser um número positivo"),
  fuelLevel: z.union([z.string(), z.number()]).transform((val) => {
    const numericVal = typeof val === 'string' ? parseInt(val) : val;
    if (isNaN(numericVal) || numericVal < 0 || numericVal > 100) {
      throw new Error("Informe um valor numérico entre 0 e 100");
    }
    return String(numericVal);
  }),
  vehicleCondition: z.string().refine((val) => ["excellent", "good", "fair", "poor"].includes(val), {
    message: "Condição do veículo inválida"
  }),
  exteriorCondition: z.string().refine((val) => ["excellent", "good", "fair", "poor"].includes(val), {
    message: "Condição exterior inválida"
  }),
  interiorCondition: z.string().refine((val) => ["excellent", "good", "fair", "poor"].includes(val), {
    message: "Condição interior inválida"
  }),
  engineCondition: z.string().refine((val) => ["excellent", "good", "fair", "poor"].includes(val), {
    message: "Condição do motor inválida"
  }),
  tiresCondition: z.string().refine((val) => ["excellent", "good", "fair", "poor"].includes(val), {
    message: "Condição dos pneus inválida"
  }),
  observations: z.string().optional(),
  photos: z.array(z.string()).default([]),
  damages: z.array(z.object({
    type: z.string(),
    location: z.string(),
    severity: z.string(),
    description: z.string(),
    photo: z.string().optional(),
  })).default([]),
});

export type InsertOwnerInspectionForm = z.infer<typeof insertOwnerInspectionFormSchema>;

// Schema para validação do formulário (sem campos automáticos)
export const insertVehicleInspectionFormSchema = z.object({
  bookingId: z.union([z.number(), z.string()]).transform(val => Number(val)),
  vehicleId: z.union([z.number(), z.string()]).transform(val => Number(val)),
  mileage: z.number().min(0, "Quilometragem deve ser um número positivo"),
  fuelLevel: z.union([z.string(), z.number()]).transform((val) => {
    const numericVal = typeof val === 'string' ? parseInt(val) : val;
    if (isNaN(numericVal) || numericVal < 0 || numericVal > 100) {
      throw new Error("Informe um valor numérico entre 0 e 100");
    }
    return String(numericVal);
  }),
  vehicleCondition: z.string().refine((val) => ["excellent", "good", "fair", "poor", "bom", "excelente", "regular", "ruim"].includes(val), {
    message: "Condição do veículo inválida"
  }),
  observations: z.string().optional(),
  photos: z.array(z.string()).default([]),
  damages: z.array(z.object({
    type: z.string().min(1, "Tipo de dano é obrigatório"),
    location: z.string().min(1, "Localização do dano é obrigatória"),
    severity: z.enum(["minor", "moderate", "severe"]),
    description: z.string().min(1, "Descrição do dano é obrigatória"),
    photo: z.string().optional(),
  })).default([]),
  approvalDecision: z.boolean().optional(),
  rejectionReason: z.string().optional(),
  refundAmount: z.union([z.string(), z.number()]).optional().transform(val => val ? String(val) : undefined),
  refundReason: z.string().optional(),
});

// Schema completo para inserção no banco (mantido para compatibilidade)
export const insertVehicleInspectionSchema = createInsertSchema(vehicleInspections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  inspectedAt: true,
  decidedAt: true,
});

// Schema para validação do formulário de vistoria do proprietário (duplicado removido)

export type InsertVehicleInspectionForm = z.infer<typeof insertVehicleInspectionFormSchema>;

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
  // Campos para armazenar valores reais pagos
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }), // Valor real pago pelo usuário
  vehicleCount: integer("vehicle_count").default(2), // Quantidade de veículos na assinatura
  // Metadata do pagamento
  paymentIntentId: varchar("payment_intent_id", { length: 255 }), // Stripe payment intent ID
  paymentMetadata: jsonb("payment_metadata").$type<{
    originalAmount?: number;
    discountApplied?: number;
    vehicleCount?: number;
    calculationDetails?: string;
  }>(),
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

// Qualified Leads table - Sistema de leads qualificados para locadores
export const qualifiedLeads = pgTable("qualified_leads", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  renterId: integer("renter_id").references(() => users.id).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  contactInfo: jsonb("contact_info").$type<{
    name: string;
    phone: string;
    email: string;
  }>().notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, purchased, expired
  purchasedAt: timestamp("purchased_at"),
  purchasedPrice: decimal("purchased_price", { precision: 8, scale: 2 }),
  leadScore: integer("lead_score").default(0).notNull(), // Score baseado no interesse do locatário
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Vehicle Boost table - Sistema de destaque pago por anúncio
export const vehicleBoosts = pgTable("vehicle_boosts", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  boostType: varchar("boost_type", { length: 30 }).notNull(), // homepage_highlight, category_highlight, event_highlight
  boostTitle: varchar("boost_title", { length: 100 }).notNull(),
  boostDescription: text("boost_description"),
  price: decimal("price", { precision: 8, scale: 2 }).notNull(),
  duration: integer("duration").notNull(), // Duration in days
  status: varchar("status", { length: 20 }).default("active").notNull(), // active, expired, cancelled
  isActive: boolean("is_active").default(true).notNull(),
  views: integer("views").default(0).notNull(),
  clicks: integer("clicks").default(0).notNull(),
  conversions: integer("conversions").default(0).notNull(), // Leads or bookings generated
  paymentIntentId: varchar("payment_intent_id", { length: 255 }),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Premium Services table - Serviços premium para locatários
export const premiumServices = pgTable("premium_services", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  serviceType: varchar("service_type", { length: 50 }).notNull(), // document_verification, insurance, good_payer_certificate
  price: decimal("price", { precision: 8, scale: 2 }).notNull(),
  duration: integer("duration").default(1).notNull(), // Duration in days for services
  isActive: boolean("is_active").default(true).notNull(),
  features: jsonb("features").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Premium Services table - Serviços premium adquiridos pelos usuários
export const userPremiumServices = pgTable("user_premium_services", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  serviceId: integer("service_id").references(() => premiumServices.id).notNull(),
  bookingId: integer("booking_id").references(() => bookings.id),
  status: varchar("status", { length: 20 }).default("active").notNull(), // active, expired, used
  purchasePrice: decimal("purchase_price", { precision: 8, scale: 2 }).notNull(),
  paymentIntentId: varchar("payment_intent_id", { length: 255 }),
  expiresAt: timestamp("expires_at"),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type QualifiedLead = typeof qualifiedLeads.$inferSelect;
export type InsertQualifiedLead = typeof qualifiedLeads.$inferInsert;
export type VehicleBoost = typeof vehicleBoosts.$inferSelect;
export type InsertVehicleBoost = typeof vehicleBoosts.$inferInsert;
export type PremiumService = typeof premiumServices.$inferSelect;
export type InsertPremiumService = typeof premiumServices.$inferInsert;
export type UserPremiumService = typeof userPremiumServices.$inferSelect;
export type InsertUserPremiumService = typeof userPremiumServices.$inferInsert;

// Zod schemas for new monetization features
export const insertQualifiedLeadSchema = createInsertSchema(qualifiedLeads).omit({
  id: true,
  createdAt: true,
});

export const insertVehicleBoostSchema = createInsertSchema(vehicleBoosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPremiumServiceSchema = createInsertSchema(premiumServices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserPremiumServiceSchema = createInsertSchema(userPremiumServices).omit({
  id: true,
  createdAt: true,
});

export type InsertQualifiedLeadForm = z.infer<typeof insertQualifiedLeadSchema>;
export type InsertVehicleBoostForm = z.infer<typeof insertVehicleBoostSchema>;
export type InsertPremiumServiceForm = z.infer<typeof insertPremiumServiceSchema>;
export type InsertUserPremiumServiceForm = z.infer<typeof insertUserPremiumServiceSchema>;

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

// Additional relations for new tables
export const vehicleInspectionsRelations = relations(vehicleInspections, ({ one }) => ({
  booking: one(bookings, {
    fields: [vehicleInspections.bookingId],
    references: [bookings.id],
  }),
  renter: one(users, {
    fields: [vehicleInspections.renterId],
    references: [users.id],
    relationName: "inspectionsAsRenter",
  }),
  owner: one(users, {
    fields: [vehicleInspections.ownerId],
    references: [users.id],
    relationName: "inspectionsAsOwner",
  }),
  vehicle: one(vehicles, {
    fields: [vehicleInspections.vehicleId],
    references: [vehicles.id],
  }),
}));

export const payoutsRelations = relations(payouts, ({ one }) => ({
  booking: one(bookings, {
    fields: [payouts.bookingId],
    references: [bookings.id],
  }),
  owner: one(users, {
    fields: [payouts.ownerId],
    references: [users.id],
    relationName: "payoutsAsOwner",
  }),
  renter: one(users, {
    fields: [payouts.renterId],
    references: [users.id],
    relationName: "payoutsAsRenter",
  }),
}));