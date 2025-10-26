// Constantes de la aplicación
export const APP_CONSTANTS = {
  // Estados de usuario
  USER_STATUS: {
    TRIAL: 'trial',
    PREMIUM: 'premium',
    BLOCKED: 'blocked',
  } as const,

  // Roles de usuario
  USER_ROLES: {
    ADMIN: 'admin',
    USER: 'user',
  } as const,

  // Tipos de pago
  PAYMENT_TYPES: {
    CASH: 'efectivo',
    CARD: 'tarjeta',
    TRANSFER: 'transferencia',
    CHECK: 'cheque',
    CRYPTO: 'crypto',
    OTHER: 'otro',
  } as const,

  // Categorías de gastos
  EXPENSE_CATEGORIES: {
    FOOD: 'comida',
    TRANSPORT: 'transporte',
    EDUCATION: 'educacion',
    TECHNOLOGY: 'tecnologia',
    HEALTH: 'salud',
    ENTERTAINMENT: 'entretenimiento',
    SERVICES: 'servicios',
    CLOTHING: 'ropa',
    HOME: 'hogar',
    OTHER: 'otros',
  } as const,

  // Monedas soportadas
  CURRENCIES: {
    USD: 'USD',
    BOB: 'BOB',
    ARS: 'ARS',
    BRL: 'BRL',
    CLP: 'CLP',
    COP: 'COP',
    PEN: 'PEN',
    MXN: 'MXN',
  } as const,

  // Acciones de administrador
  ADMIN_ACTIONS: {
    LOGIN: 'login',
    LOGOUT: 'logout',
    VIEW_USER: 'view_user',
    UPDATE_USER: 'update_user',
    BLOCK_USER: 'block_user',
    UNBLOCK_USER: 'unblock_user',
    DELETE_USER: 'delete_user',
    EXTEND_TRIAL: 'extend_trial',
    CONVERT_PREMIUM: 'convert_premium',
    VIEW_ANALYTICS: 'view_analytics',
    EXPORT_DATA: 'export_data',
    CHANGE_PASSWORD: 'change_password',
    UPDATE_SETTINGS: 'update_settings',
  } as const,

  // Estados de verificación
  VERIFICATION_STATUS: {
    VERIFIED: 'verified',
    PENDING: 'pending',
    FAILED: 'failed',
  } as const,

  // Tipos de notificación
  NOTIFICATION_TYPES: {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
  } as const,

  // Períodos de tiempo
  TIME_PERIODS: {
    TODAY: 'today',
    YESTERDAY: 'yesterday',
    LAST_7_DAYS: 'last_7_days',
    LAST_30_DAYS: 'last_30_days',
    LAST_90_DAYS: 'last_90_days',
    LAST_YEAR: 'last_year',
    CUSTOM: 'custom',
  } as const,

  // Formatos de exportación
  EXPORT_FORMATS: {
    CSV: 'csv',
    XLSX: 'xlsx',
    PDF: 'pdf',
    JSON: 'json',
  } as const,

  // Configuración de tablas
  TABLE_CONFIG: {
    DEFAULT_PAGE_SIZE: 25,
    PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
    MAX_PAGE_SIZE: 100,
  } as const,

  // Configuración de gráficos
  CHART_CONFIG: {
    COLORS: [
      '#3B82F6', // Blue
      '#EF4444', // Red
      '#10B981', // Green
      '#F59E0B', // Yellow
      '#8B5CF6', // Purple
      '#F97316', // Orange
      '#06B6D4', // Cyan
      '#84CC16', // Lime
    ],
    DEFAULT_HEIGHT: 300,
    ANIMATION_DURATION: 750,
  } as const,

  // Mensajes de error
  ERROR_MESSAGES: {
    UNAUTHORIZED: 'No tienes permisos para realizar esta acción',
    FORBIDDEN: 'Acceso denegado',
    NOT_FOUND: 'Recurso no encontrado',
    VALIDATION_ERROR: 'Error de validación',
    SERVER_ERROR: 'Error interno del servidor',
    NETWORK_ERROR: 'Error de conexión',
    INVALID_CREDENTIALS: 'Credenciales inválidas',
    TOKEN_EXPIRED: 'Token expirado',
    USER_NOT_FOUND: 'Usuario no encontrado',
    INVALID_EMAIL: 'Email inválido',
    WEAK_PASSWORD: 'Contraseña muy débil',
    PASSWORDS_NOT_MATCH: 'Las contraseñas no coinciden',
  } as const,

  // Mensajes de éxito
  SUCCESS_MESSAGES: {
    LOGIN_SUCCESS: 'Inicio de sesión exitoso',
    LOGOUT_SUCCESS: 'Sesión cerrada exitosamente',
    USER_UPDATED: 'Usuario actualizado exitosamente',
    USER_BLOCKED: 'Usuario bloqueado exitosamente',
    USER_UNBLOCKED: 'Usuario desbloqueado exitosamente',
    USER_DELETED: 'Usuario eliminado exitosamente',
    TRIAL_EXTENDED: 'Trial extendido exitosamente',
    PREMIUM_CONVERTED: 'Usuario convertido a premium exitosamente',
    PASSWORD_CHANGED: 'Contraseña cambiada exitosamente',
    SETTINGS_UPDATED: 'Configuración actualizada exitosamente',
    DATA_EXPORTED: 'Datos exportados exitosamente',
  } as const,

  // Configuración de validación
  VALIDATION: {
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_REGEX: /^\+?[\d\s\-\(\)]+$/,
    PASSWORD_MIN_LENGTH: 8,
    REFERRAL_CODE_LENGTH: 8,
  } as const,

  // Configuración de cache
  CACHE_KEYS: {
    DASHBOARD_STATS: 'dashboard_stats',
    USER_LIST: 'user_list',
    ANALYTICS_DATA: 'analytics_data',
    REFERRAL_DATA: 'referral_data',
  } as const,

  // Configuración de cache TTL (Time To Live)
  CACHE_TTL: {
    STATS: 5 * 60 * 1000, // 5 minutos
    USER_LIST: 2 * 60 * 1000, // 2 minutos
    ANALYTICS: 10 * 60 * 1000, // 10 minutos
    REFERRALS: 5 * 60 * 1000, // 5 minutos
  } as const,
} as const

// Tipos derivados de las constantes
export type UserStatus = typeof APP_CONSTANTS.USER_STATUS[keyof typeof APP_CONSTANTS.USER_STATUS]
export type UserRole = typeof APP_CONSTANTS.USER_ROLES[keyof typeof APP_CONSTANTS.USER_ROLES]
export type PaymentType = typeof APP_CONSTANTS.PAYMENT_TYPES[keyof typeof APP_CONSTANTS.PAYMENT_TYPES]
export type ExpenseCategory = typeof APP_CONSTANTS.EXPENSE_CATEGORIES[keyof typeof APP_CONSTANTS.EXPENSE_CATEGORIES]
export type Currency = typeof APP_CONSTANTS.CURRENCIES[keyof typeof APP_CONSTANTS.CURRENCIES]
export type AdminAction = typeof APP_CONSTANTS.ADMIN_ACTIONS[keyof typeof APP_CONSTANTS.ADMIN_ACTIONS]
export type VerificationStatus = typeof APP_CONSTANTS.VERIFICATION_STATUS[keyof typeof APP_CONSTANTS.VERIFICATION_STATUS]
export type NotificationType = typeof APP_CONSTANTS.NOTIFICATION_TYPES[keyof typeof APP_CONSTANTS.NOTIFICATION_TYPES]
export type TimePeriod = typeof APP_CONSTANTS.TIME_PERIODS[keyof typeof APP_CONSTANTS.TIME_PERIODS]
export type ExportFormat = typeof APP_CONSTANTS.EXPORT_FORMATS[keyof typeof APP_CONSTANTS.EXPORT_FORMATS]


