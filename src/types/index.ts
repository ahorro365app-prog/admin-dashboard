// Tipos principales del sistema
export interface User {
  id: string
  email: string
  phone_number?: string
  whatsapp_verified: boolean
  whatsapp_verified_at?: Date
  status: 'trial' | 'premium' | 'blocked'
  trial_expires_at?: Date
  premium_until?: Date
  referral_code: string
  referred_by?: string
  audio_count: number
  created_at: Date
  last_activity?: Date
  updated_at: Date
}

export interface Referral {
  id: string
  referrer_id: string
  referred_id: string
  referral_code: string
  verified_at?: Date
  created_at: Date
  referrer: User
  referred: User
}

export interface Expense {
  id: string
  user_id: string
  amount: number
  currency: string
  item: string
  category: string
  payment_type: string
  created_at: Date
  user: User
}

export interface AdminLog {
  id: string
  admin_id: string
  action: string
  target_user_id?: string
  details?: string
  ip_address?: string
  created_at: Date
  admin: User
}

// Tipos para API responses
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pages: number
  limit: number
}

// Tipos para filtros
export interface UserFilters {
  status?: 'trial' | 'premium' | 'blocked'
  whatsapp_verified?: boolean
  search?: string
  date_from?: string
  date_to?: string
  page?: number
  limit?: number
  sort_by?: 'email' | 'created_at' | 'last_activity' | 'audio_count'
  sort_order?: 'asc' | 'desc'
}

export interface ReferralFilters {
  verified?: boolean
  search?: string
  date_from?: string
  date_to?: string
  page?: number
  limit?: number
}

// Tipos para estadísticas
export interface DashboardStats {
  total_users: number
  premium_users: number
  trial_users: number
  blocked_users: number
  revenue_today: number
  conversion_rate: number
  new_users_today: number
  active_users_today: number
}

export interface AnalyticsData {
  date: string
  users: number
  revenue: number
  conversions: number
}

// Tipos para formularios
export interface LoginForm {
  email: string
  password: string
}

export interface UserUpdateForm {
  status?: 'trial' | 'premium' | 'blocked'
  trial_expires_at?: Date
  premium_until?: Date
  blocked?: boolean
}

export interface ExtendTrialForm {
  days: number
}

export interface ChangePasswordForm {
  current_password: string
  new_password: string
  confirm_password: string
}

// Tipos para configuración
export interface SystemSettings {
  max_referrals_per_user: number
  trial_days: number
  premium_price: number
  referral_extension_days: number
}

// Tipos para autenticación
export interface AuthUser {
  id: string
  email: string
  role: 'admin'
}

export interface AuthTokens {
  token: string
  refresh_token: string
  expires_in: number
}

// Tipos para componentes
export interface TableColumn<T> {
  key: keyof T
  label: string
  sortable?: boolean
  render?: (value: any, item: T) => React.ReactNode
}

export interface ChartData {
  name: string
  value: number
  color?: string
}

export interface TimeSeriesData {
  date: string
  value: number
  label?: string
}


