/**
 * Feature Flags Configuration
 * Controls which features are enabled based on admin settings and environment
 */

export interface FeatureFlags {
  pixPaymentEnabled: boolean;
  pixTransferEnabled: boolean;
  stripeTestMode: boolean;
}

// Default admin settings (fallback when admin settings not available)
const defaultAdminSettings = {
  enablePixPayment: false,
  enablePixTransfer: true,
  pixTransferDescription: "Repasse alugae",
};

/**
 * Get feature flags based on admin settings and environment
 */
export function getFeatureFlags(adminSettings?: any): FeatureFlags {
  const isProduction = process.env.NODE_ENV === 'production';
  const settings = adminSettings || defaultAdminSettings;
  
  return {
    // PIX payments enabled based on admin settings AND environment
    pixPaymentEnabled: settings.enablePixPayment && (isProduction || process.env.ENABLE_PIX_PAYMENT === 'true'),
    
    // PIX transfers based on admin settings
    pixTransferEnabled: settings.enablePixTransfer,
    
    // Stripe test mode disabled only in production
    stripeTestMode: !isProduction
  };
}

/**
 * Client-side feature flags (safe for frontend)
 */
export function getClientFeatureFlags(adminSettings?: any): Pick<FeatureFlags, 'pixPaymentEnabled'> {
  const isProduction = import.meta.env.MODE === 'production';
  const settings = adminSettings || defaultAdminSettings;
  
  return {
    // PIX enabled based on admin settings AND environment
    pixPaymentEnabled: settings.enablePixPayment && (isProduction || import.meta.env.VITE_ENABLE_PIX_PAYMENT === 'true')
  };
}