/**
 * Feature Flags Configuration
 * Controls which features are enabled based on environment
 */

export interface FeatureFlags {
  pixPaymentEnabled: boolean;
  pixTransferEnabled: boolean;
  stripeTestMode: boolean;
}

/**
 * Get feature flags based on current environment
 */
export function getFeatureFlags(): FeatureFlags {
  const isProduction = process.env.NODE_ENV === 'production';
  const isTest = process.env.NODE_ENV === 'test';
  
  return {
    // PIX payments only enabled in production
    pixPaymentEnabled: isProduction && process.env.ENABLE_PIX_PAYMENT === 'true',
    
    // PIX transfers can be simulated in development for testing
    pixTransferEnabled: true,
    
    // Stripe test mode disabled only in production
    stripeTestMode: !isProduction
  };
}

/**
 * Client-side feature flags (safe for frontend)
 */
export function getClientFeatureFlags(): Pick<FeatureFlags, 'pixPaymentEnabled'> {
  // Only expose safe flags to client
  const isProduction = import.meta.env.MODE === 'production';
  
  return {
    pixPaymentEnabled: isProduction && import.meta.env.VITE_ENABLE_PIX_PAYMENT === 'true'
  };
}