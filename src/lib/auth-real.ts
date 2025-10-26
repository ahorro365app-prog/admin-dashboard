import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Cliente de Supabase con permisos de servicio
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Configuración JWT
const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key-change-in-production'
const JWT_EXPIRES_IN = '24h'
const REFRESH_EXPIRES_IN = '7d'

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
 * Valida las credenciales contra Supabase
 */
export async function validateCredentials(credentials: LoginCredentials): Promise<AdminUser | null> {
  const { email, password } = credentials
  
  console.log('🔍 Validating credentials against Supabase for:', email)
  
  try {
    // Buscar el usuario administrador
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

    // Verificar contraseña (en producción usar bcrypt)
    if (password === admin.password_hash) {
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
 * Crear usuario administrador inicial
 */
export async function createInitialAdmin(): Promise<boolean> {
  try {
    console.log('🔧 Creating initial admin user...')
    
    const adminData = {
      email: 'admin@demo.com',
      password_hash: 'admin123', // En producción usar bcrypt
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


