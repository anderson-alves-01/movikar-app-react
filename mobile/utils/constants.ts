// Mobile App Constants
export const APP_CONFIG = {
  NAME: 'alugae',
  VERSION: '1.0.0',
  API_BASE_URL: 'https://alugae.mobi/api',
  WS_URL: 'wss://alugae.mobi',
  DEEP_LINK_SCHEME: 'alugae-mobile',
};

export const COLORS = {
  PRIMARY: '#20B2AA',
  PRIMARY_DARK: '#189B94',
  PRIMARY_LIGHT: '#4DCBC4',
  SECONDARY: '#FF6B6B',
  BACKGROUND: '#FFFFFF',
  SURFACE: '#F8F9FA',
  TEXT_PRIMARY: '#333333',
  TEXT_SECONDARY: '#666666',
  TEXT_MUTED: '#999999',
  BORDER: '#E1E1E1',
  ERROR: '#E74C3C',
  WARNING: '#F39C12',
  SUCCESS: '#27AE60',
  INFO: '#3498DB',
};

export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
};

export const TYPOGRAPHY = {
  SIZES: {
    XS: 12,
    SM: 14,
    MD: 16,
    LG: 18,
    XL: 20,
    XXL: 24,
    XXXL: 32,
  },
  WEIGHTS: {
    NORMAL: '400',
    MEDIUM: '500',
    SEMIBOLD: '600',
    BOLD: '700',
  },
};

export const SCREEN_NAMES = {
  // Auth Stack
  LOGIN: 'Login',
  REGISTER: 'Register',
  FORGOT_PASSWORD: 'ForgotPassword',

  // Main Tab Stack
  HOME: 'Home',
  SEARCH: 'Search',
  BOOKINGS: 'Bookings',
  PROFILE: 'Profile',

  // Modal/Detail Screens
  VEHICLE_DETAIL: 'VehicleDetail',
  BOOKING_DETAIL: 'BookingDetail',
  CHAT: 'Chat',
  PAYMENT_METHODS: 'PaymentMethods',
  SUBSCRIPTION: 'Subscription',
  BIOMETRIC_SETUP: 'BiometricSetup',
  SETTINGS: 'Settings',
  NOTIFICATIONS: 'Notifications',
};

export const BOOKING_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export const VEHICLE_CATEGORIES = {
  HATCH: 'hatch',
  SEDAN: 'sedan',
  SUV: 'suv',
  PICKUP: 'pickup',
  CONVERTIBLE: 'convertible',
  COUPE: 'coupe',
  WAGON: 'wagon',
} as const;

export const FUEL_TYPES = {
  GASOLINE: 'gasoline',
  ETHANOL: 'ethanol',
  FLEX: 'flex',
  DIESEL: 'diesel',
  ELECTRIC: 'electric',
  HYBRID: 'hybrid',
} as const;

export const TRANSMISSION_TYPES = {
  MANUAL: 'manual',
  AUTOMATIC: 'automatic',
  CVT: 'cvt',
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  SEARCH_HISTORY: 'search_history',
  FAVORITE_VEHICLES: 'favorite_vehicles',
  NOTIFICATION_PREFERENCES: 'notification_preferences',
};

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',

  // User
  PROFILE: '/user/profile',
  UPDATE_PROFILE: '/user/profile',
  UPLOAD_AVATAR: '/user/avatar',

  // Vehicles
  VEHICLES: '/vehicles',
  VEHICLE_DETAIL: '/vehicles',
  VEHICLE_AVAILABILITY: '/vehicles/{id}/availability',
  VEHICLE_REVIEWS: '/vehicles/{id}/reviews',

  // Bookings
  BOOKINGS: '/bookings',
  BOOKING_DETAIL: '/bookings',
  CREATE_BOOKING: '/bookings',
  CANCEL_BOOKING: '/bookings/{id}/cancel',
  CONFIRM_BOOKING: '/bookings/{id}/confirm',

  // Payments
  PAYMENT_METHODS: '/payments/methods',
  CREATE_PAYMENT_INTENT: '/payments/create-intent',
  CONFIRM_PAYMENT: '/payments/confirm',
  PAYMENT_HISTORY: '/payments/history',

  // Subscriptions
  SUBSCRIPTION_PLANS: '/subscription/plans',
  CREATE_SUBSCRIPTION: '/subscription/create',
  CANCEL_SUBSCRIPTION: '/subscription/cancel',
  SUBSCRIPTION_STATUS: '/subscription/status',

  // Chat
  CHAT_ROOMS: '/chat/rooms',
  CHAT_MESSAGES: '/chat/messages',
  SEND_MESSAGE: '/chat/messages',
  MARK_READ: '/chat/mark-read',

  // Notifications
  NOTIFICATIONS: '/notifications',
  MARK_NOTIFICATION_READ: '/notifications/{id}/read',
  NOTIFICATION_PREFERENCES: '/notifications/preferences',

  // Coupons
  VALIDATE_COUPON: '/coupons/validate',
  APPLY_COUPON: '/coupons/apply',
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  UNAUTHORIZED: 'Sessão expirada. Faça login novamente.',
  FORBIDDEN: 'Acesso negado.',
  NOT_FOUND: 'Recurso não encontrado.',
  SERVER_ERROR: 'Erro interno do servidor.',
  VALIDATION_ERROR: 'Dados inválidos.',
  UNKNOWN_ERROR: 'Erro desconhecido.',
  BIOMETRIC_NOT_AVAILABLE: 'Autenticação biométrica não disponível.',
  PAYMENT_FAILED: 'Falha no pagamento.',
  BOOKING_CONFLICT: 'Conflito de datas na reserva.',
};

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login realizado com sucesso!',
  LOGOUT_SUCCESS: 'Logout realizado com sucesso!',
  PROFILE_UPDATED: 'Perfil atualizado com sucesso!',
  BOOKING_CREATED: 'Reserva criada com sucesso!',
  PAYMENT_SUCCESS: 'Pagamento realizado com sucesso!',
  MESSAGE_SENT: 'Mensagem enviada!',
  SUBSCRIPTION_CREATED: 'Assinatura ativada com sucesso!',
};

export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^\+?[\d\s\-\(\)]{10,}$/,
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
};

export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'free',
    name: 'Gratuito',
    vehicleLimit: 1,
    features: ['1 veículo', 'Suporte básico'],
  },
  ESSENCIAL: {
    id: 'essencial',
    name: 'Essencial',
    vehicleLimit: 5,
    features: ['Até 5 veículos', 'Destaque básico', 'Suporte prioritário'],
  },
  PLUS: {
    id: 'plus',
    name: 'Plus',
    vehicleLimit: 20,
    features: ['Até 20 veículos', 'Destaque premium', 'Analytics avançado', 'Suporte VIP'],
  },
};

export const PERMISSIONS = {
  CAMERA: 'camera',
  LOCATION: 'location',
  NOTIFICATIONS: 'notifications',
  STORAGE: 'storage',
} as const;