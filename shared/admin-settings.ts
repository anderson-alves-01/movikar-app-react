export interface AdminSettings {
  id?: number;
  serviceFeePercentage: number;
  insuranceFeePercentage: number;
  minimumBookingDays: number;
  maximumBookingDays: number;
  cancellationPolicyDays: number;
  currency: string;
  supportEmail: string;
  supportPhone: string;
  enablePixPayment: boolean;
  enablePixTransfer: boolean;
  pixTransferDescription: string;
  // Subscription plan pricing
  essentialPlanPrice: number;
  plusPlanPrice: number;
  annualDiscountPercentage: number;
  createdAt?: Date;
  updatedAt?: Date;
}