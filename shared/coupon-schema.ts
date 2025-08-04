import { z } from "zod";
import { pgTable, serial, varchar, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";

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

// Zod validation schemas
export const insertCouponSchema = z.object({
  code: z.string().min(3).max(50).regex(/^[A-Z0-9_-]+$/, "Código deve conter apenas letras maiúsculas, números, hífens e underscores"),
  description: z.string().min(5).max(255),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().min(1).max(100000), // 1-100 for percentage, up to R$1000 for fixed
  minOrderValue: z.number().min(0).default(0),
  maxUses: z.number().min(1).default(1),
  validFrom: z.date().optional(),
  validUntil: z.date(),
  createdBy: z.number(),
});

export const insertCouponUsageSchema = z.object({
  couponId: z.number(),
  userId: z.number(),
  bookingId: z.number().optional(),
  discountAmount: z.number(),
});

// Types
export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type CouponUsage = typeof couponUsage.$inferSelect;
export type InsertCouponUsage = z.infer<typeof insertCouponUsageSchema>;

// Validation functions
export function validateCouponCode(code: string): boolean {
  return /^[A-Z0-9_-]{3,50}$/.test(code);
}

export function calculateDiscount(
  coupon: Coupon, 
  orderValue: number // in cents
): { discountAmount: number; finalAmount: number; isValid: boolean; error?: string } {
  // Check if coupon is active
  if (!coupon.isActive) {
    return { discountAmount: 0, finalAmount: orderValue, isValid: false, error: "Cupom inativo" };
  }

  // Check date validity
  const now = new Date();
  if (coupon.validUntil && now > coupon.validUntil) {
    return { discountAmount: 0, finalAmount: orderValue, isValid: false, error: "Cupom expirado" };
  }

  if (coupon.validFrom && now < coupon.validFrom) {
    return { discountAmount: 0, finalAmount: orderValue, isValid: false, error: "Cupom ainda não é válido" };
  }

  // Check usage limit
  if (coupon.maxUses && (coupon.usedCount || 0) >= coupon.maxUses) {
    return { discountAmount: 0, finalAmount: orderValue, isValid: false, error: "Cupom esgotado" };
  }

  // Check minimum order value
  if (coupon.minOrderValue && orderValue < coupon.minOrderValue) {
    const minValue = (coupon.minOrderValue / 100).toFixed(2);
    return { 
      discountAmount: 0, 
      finalAmount: orderValue, 
      isValid: false, 
      error: `Valor mínimo do pedido: R$ ${minValue}` 
    };
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.discountType === "percentage") {
    discountAmount = Math.round((orderValue * coupon.discountValue) / 100);
  } else if (coupon.discountType === "fixed") {
    discountAmount = coupon.discountValue;
  }

  // Ensure discount doesn't exceed order value
  discountAmount = Math.min(discountAmount, orderValue);
  const finalAmount = orderValue - discountAmount;

  return {
    discountAmount,
    finalAmount,
    isValid: true
  };
}

export function formatCouponValue(coupon: Coupon): string {
  if (coupon.discountType === "percentage") {
    return `${coupon.discountValue}% OFF`;
  } else {
    return `R$ ${(coupon.discountValue / 100).toFixed(2)} OFF`;
  }
}