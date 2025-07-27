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
  createdAt?: Date;
  updatedAt?: Date;
}