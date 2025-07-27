import { z } from "zod";

// Admin Settings Schema
export const adminSettingsSchema = z.object({
  serviceFeePercentage: z.number().min(0).max(100).default(10), // 10% taxa de serviço
  insuranceFeePercentage: z.number().min(0).max(100).default(15), // 15% taxa de seguro
  minimumBookingDays: z.number().min(1).default(1),
  maximumBookingDays: z.number().min(1).default(30),
  cancellationPolicyDays: z.number().min(0).default(2),
  currency: z.string().default("BRL"),
  supportEmail: z.string().email().default("suporte@carshare.com"),
  supportPhone: z.string().default("(11) 9999-9999"),
});

export type AdminSettings = z.infer<typeof adminSettingsSchema>;

// Default settings
export const defaultAdminSettings: AdminSettings = {
  serviceFeePercentage: 10,
  insuranceFeePercentage: 15,
  minimumBookingDays: 1,
  maximumBookingDays: 30,
  cancellationPolicyDays: 2,
  currency: "BRL",
  supportEmail: "suporte@carshare.com",
  supportPhone: "(11) 9999-9999",
};

// Validation functions
export function validateServiceFee(percentage: number): boolean {
  return percentage >= 0 && percentage <= 50; // Max 50% service fee
}

export function validateInsuranceFee(percentage: number): boolean {
  return percentage >= 0 && percentage <= 30; // Max 30% insurance fee
}

// Calculate fees based on settings
export function calculateBookingFees(
  subtotal: number, 
  settings: AdminSettings
): {
  serviceFee: number;
  insuranceFee: number;
  total: number;
} {
  const serviceFee = (subtotal * settings.serviceFeePercentage) / 100;
  const insuranceFee = (subtotal * settings.insuranceFeePercentage) / 100;
  const total = subtotal + serviceFee + insuranceFee;

  return {
    serviceFee: Math.round(serviceFee * 100) / 100, // Round to 2 decimal places
    insuranceFee: Math.round(insuranceFee * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}