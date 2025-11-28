import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'
import { comparePassword, isBcryptHash } from './bcrypt-helpers'

/**
 * Obtiene el cliente de Supabase de forma lazy
 * Solo se crea cuando se necesita, evitando errores durante el build
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration is missing. NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) are required.');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Obtiene el cliente público de Supabase de forma lazy
 */
function getSupabasePublicClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration is missing. NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

// Lazy getters para los clientes
const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    return getSupabaseClient()[prop as keyof ReturnType<typeof createClient>];
  }
});

const supabasePublic = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    return getSupabasePublicClient()[prop as keyof ReturnType<typeof createClient>];
  }
});

// Configuración JWT
const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key-change-in-production'
const JWT_EXPIRES_IN = '24h'
const REFRESH_EXPIRES_IN = '7d'

// Logging de configuración (solo en runtime, no durante build)
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('🔧 Supabase config loaded:')
  console.log('  URL:', supabaseUrl ? 'Set' : 'Not set')
  console.log('  Anon Key:', supabaseAnonKey ? 'Set' : 'Not set')
  console.log('  Service Key:', supabaseServiceKey ? 'Set' : 'Not set (using anon key as fallback)')
}

export interface AdminUser {
  id: string
  email: string
  password_hash: string
  role: 'admin'
  created_at: string
  updated_at: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  message: string
  token?: string
  refreshToken?: string
  user?: {
    id: string
    email: string
    role: string
  }
}

/**
 * Valida las credenciales contra la base de datos real
 */
export async function validateCredentials(credentials: LoginCredentials): Promise<AdminUser | null> {
  const { email, password } = credentials
  
  console.log('🔍 Validating credentials against real Supabase for:', email)
  
  try {
    // Buscar el usuario administrador en la tabla real
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .eq('role', 'admin')
      .single()

    if (error) {
      console.log('❌ Error finding admin user:', (error as Error).message)
      return null
    }

    if (!admin) {
      console.log('❌ Admin user not found')
      return null
    }

    console.log('✅ Admin user found:', admin.email)

    // Verificar contraseña con bcrypt
    // Soporta migración: si el hash no es bcrypt, compara en texto plano (temporal)
    let passwordMatch = false;
    
    if (isBcryptHash(admin.password_hash)) {
      // Hash bcrypt válido, usar comparación segura
      passwordMatch = await comparePassword(password, admin.password_hash);
    } else {
      // Hash en texto plano (migración temporal)
      // Si coincide, hashear y actualizar en la BD
      if (password === admin.password_hash) {
        console.log('⚠️ Password en texto plano detectado, migrando a bcrypt...');
        const { hashPassword } = await import('./bcrypt-helpers');
        const hashedPassword = await hashPassword(password);
        
        // Actualizar contraseña en la BD
        await supabase
          .from('admin_users')
          .update({ password_hash: hashedPassword })
          .eq('id', admin.id);
        
        passwordMatch = true;
        console.log('✅ Contraseña migrada a bcrypt');
      }
    }

    if (passwordMatch) {
      console.log('✅ Password match')
      return admin
    } else {
      console.log('❌ Password mismatch')
      return null
    }

  } catch (error) {
    console.error('💥 Error validating credentials:', error)
    return null
  }
}

/**
 * Genera un token JWT
 */
export function generateToken(payload: { email: string; role: string; id: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

/**
 * Genera un refresh token
 */
export function generateRefreshToken(payload: { email: string; role: string; id: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_EXPIRES_IN })
}

/**
 * Verifica un token JWT
 */
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

/**
 * Procesa el login y retorna tokens
 */
export async function processLogin(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    console.log('🔐 Processing login for:', credentials.email)
    
    const admin = await validateCredentials(credentials)
    
    if (!admin) {
      return {
        success: false,
        message: 'Credenciales inválidas'
      }
    }
    
    const payload = {
      email: admin.email,
      role: admin.role,
      id: admin.id
    }
    
    const token = generateToken(payload)
    const refreshToken = generateRefreshToken(payload)
    
    console.log('✅ Login successful, tokens generated')
    
    return {
      success: true,
      message: 'Login exitoso',
      token,
      refreshToken,
      user: {
        id: admin.id,
        email: admin.email,
        role: admin.role
      }
    }
  } catch (error) {
    console.error('💥 Login process error:', error)
    return {
      success: false,
      message: 'Error interno del servidor'
    }
  }
}

/**
 * Obtiene estadísticas de usuarios desde la base de datos real
 */
export async function getUserStats() {
  try {
    console.log('📊 Fetching user stats from real database...')
    
    // Obtener total de usuarios
    const { count: totalUsers, error: totalError } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true })

    if (totalError) {
      console.error('Error getting total users:', totalError)
    }

    // Obtener usuarios premium
    const { count: premiumUsers, error: premiumError } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true })
      .eq('subscription', 'premium')

    if (premiumError) {
      console.error('Error getting premium users:', premiumError)
    }

    // Obtener transacciones de hoy
    const today = new Date().toISOString().split('T')[0]
    const { count: todayTransactions, error: todayError } = await supabase
      .from('transacciones')
      .select('*', { count: 'exact', head: true })
      .gte('fecha', `${today}T00:00:00`)
      .lte('fecha', `${today}T23:59:59`)

    if (todayError) {
      console.error('Error getting today transactions:', todayError)
    }

    // Obtener referidos (si existe la tabla)
    let referrals = 0
    try {
      const { count: referralsCount, error: referralsError } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })

      if (!referralsError) {
        referrals = referralsCount || 0
      }
    } catch (error) {
      console.log('Referrals table might not exist, using 0')
    }

    return {
      totalUsers: totalUsers || 0,
      premiumUsers: premiumUsers || 0,
      todayTransactions: todayTransactions || 0,
      referrals: referrals
    }

  } catch (error) {
    console.error('💥 Error fetching user stats:', error)
    return {
      totalUsers: 0,
      premiumUsers: 0,
      todayTransactions: 0,
      referrals: 0
    }
  }
}

/**
 * Obtiene lista de usuarios desde la base de datos real
 */
export async function getUsers(limit: number = 50, offset: number = 0) {
  try {
    console.log('👥 Fetching users from real database...')
    
    const { data: users, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching users:', error)
      return []
    }

    return users || []

  } catch (error) {
    console.error('💥 Error fetching users:', error)
    return []
  }
}

/**
 * Configuración de cookies seguras
 */
export const COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 24 * 60 * 60 * 1000, // 24 horas
  path: '/'
}

export const REFRESH_COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
  path: '/'
}

/**
 * Crear usuario administrador inicial en la base de datos real
 */
export async function createInitialAdmin(): Promise<boolean> {
  try {
    console.log('🔧 Creating initial admin user in real database...')
    
    // Hashear contraseña con bcrypt
    const { hashPassword } = await import('./bcrypt-helpers');
    const hashedPassword = await hashPassword('admin123');
    
    const adminData = {
      email: 'admin@demo.com',
      password_hash: hashedPassword, // Contraseña hasheada con bcrypt
      role: 'admin' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('admin_users')
      .insert([adminData])
      .select()

    if (error) {
      console.log('⚠️ Admin user might already exist:', (error as Error).message)
      return false
    }

    console.log('✅ Initial admin user created:', data)
    return true

  } catch (error) {
    console.error('💥 Error creating initial admin:', error)
    return false
  }
}

