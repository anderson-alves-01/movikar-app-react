/**
 * Feature Flags Configuration
 * Controls which features are enabled based on admin settings and environment
 */

export interface FeatureFlags {
  pixPaymentEnabled: boolean;
  pixTransferEnabled: boolean;
  stripeTestMode: boolean;
  contractSignatureEnabled: boolean;
}

// Default admin settings (fallback when admin settings not available)
const defaultAdminSettings = {
  enablePixPayment: false,
  enablePixTransfer: true,
  pixTransferDescription: "Repasse alugae",
  enableContractSignature: false,
};

/**
 * Get feature flags based on admin settings and environment
 */
export function getFeatureFlags(adminSettings?: any): FeatureFlags {
  const isProduction = process.env.NODE_ENV === 'production';
  const settings = adminSettings || defaultAdminSettings;
  
  return {
    // PIX payments temporarily disabled due to Stripe configuration requirements
    pixPaymentEnabled: false, // settings.enablePixPayment && (isProduction || process.env.ENABLE_PIX_PAYMENT === 'true'),
    
    // PIX transfers based on admin settings
    pixTransferEnabled: settings.enablePixTransfer,
    
    // Stripe test mode disabled only in production
    stripeTestMode: !isProduction,
    
    // Contract signature based on admin settings (default false)
    contractSignatureEnabled: settings.enableContractSignature || false
  };
}

/**
 * Client-side feature flags (safe for frontend)
 */
export function getClientFeatureFlags(adminSettings?: any): Pick<FeatureFlags, 'pixPaymentEnabled' | 'contractSignatureEnabled'> {
  const isProduction = import.meta.env.MODE === 'production';
  const settings = adminSettings || defaultAdminSettings;
  
  return {
    // PIX enabled based on admin settings AND environment
    pixPaymentEnabled: settings.enablePixPayment && (isProduction || import.meta.env.VITE_ENABLE_PIX_PAYMENT === 'true'),
    
    // Contract signature based on admin settings (client-safe)
    contractSignatureEnabled: settings.enableContractSignature || false
  };
}