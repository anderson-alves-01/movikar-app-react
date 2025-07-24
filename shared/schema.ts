import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

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
  bookingId: integer("booking_id").references(() => bookings.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  ownedVehicles: many(vehicles),
  renterBookings: many(bookings, { relationName: "renterBookings" }),
  ownerBookings: many(bookings, { relationName: "ownerBookings" }),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
  givenReviews: many(reviews, { relationName: "givenReviews" }),
  receivedReviews: many(reviews, { relationName: "receivedReviews" }),
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

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

// Extended types with relations
export type VehicleWithOwner = Vehicle & {
  owner: User;
  reviews?: Review[];
};

export type BookingWithDetails = Booking & {
  vehicle: VehicleWithOwner;
  renter: User;
  owner: User;
};

export type UserWithStats = User & {
  ownedVehicles?: Vehicle[];
  renterBookings?: Booking[];
  ownerBookings?: Booking[];
};
