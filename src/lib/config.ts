export const config = {
  // Configuración de la aplicación
  app: {
    name: "Admin Dashboard - Ahorro365",
    description: "Panel administrativo para gestionar usuarios y analytics",
    version: "1.0.0",
  },

  // Configuración de autenticación
  auth: {
    tokenExpiry: process.env.JWT_EXPIRY || "24h",
    refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || "7d",
    adminEmail: process.env.ADMIN_EMAIL || "admin@ahorro365.com",
  },

  // Configuración de base de datos
  database: {
    url: process.env.DATABASE_URL || "",
  },

  // Configuración de Supabase
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    key: process.env.NEXT_PUBLIC_SUPABASE_KEY || "",
  },

  // Configuración de API
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  },

  // Configuración de paginación
  pagination: {
    defaultLimit: 25,
    maxLimit: 100,
    limits: [10, 25, 50, 100],
  },

  // Configuración de fechas
  dateFormats: {
    display: "dd/MM/yyyy",
    displayWithTime: "dd/MM/yyyy HH:mm",
    api: "yyyy-MM-dd",
    apiWithTime: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
  },

  // Configuración de monedas
  currencies: {
    default: "USD",
    supported: ["USD", "BOB", "ARS", "BRL", "CLP", "COP", "PEN", "MXN"],
  },

  // Configuración de límites del sistema
  limits: {
    maxReferralsPerUser: 10,
    trialDays: 7,
    premiumPrice: 2.99,
    referralExtensionDays: 7,
  },

  // Configuración de rate limiting
  rateLimit: {
    login: {
      max: 5,
      window: "15m",
    },
    api: {
      max: 100,
      window: "15m",
    },
  },

  // Configuración de logs
  logs: {
    maxRetentionDays: 90,
    logLevel: process.env.NODE_ENV === "production" ? "error" : "debug",
  },

  // Configuración de exportación
  export: {
    maxRows: 10000,
    formats: ["csv", "xlsx", "pdf"],
  },

  // Configuración de notificaciones
  notifications: {
    enabled: true,
    channels: ["email", "dashboard"],
  },

  // Configuración de seguridad
  security: {
    passwordMinLength: 8,
    passwordRequireSpecialChars: true,
    sessionTimeout: 30 * 60 * 1000, // 30 minutos
  },
} as const

export type Config = typeof config





