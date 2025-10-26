import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

// Configuración JWT
const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key-change-in-production'
const JWT_EXPIRES_IN = '24h'
const REFRESH_EXPIRES_IN = '7d'

// Credenciales de administrador (en producción usar base de datos)
const ADMIN_CREDENTIALS = {
  email: process.env.ADMIN_EMAIL || 'admin@demo.com',
  password: process.env.ADMIN_PASSWORD || 'admin123'
}

console.log('🔧 Auth config loaded:')
console.log('  JWT_SECRET:', JWT_SECRET ? 'Set' : 'Not set')
console.log('  ADMIN_EMAIL:', ADMIN_CREDENTIALS.email)
console.log('  ADMIN_PASSWORD:', ADMIN_CREDENTIALS.password ? 'Set' : 'Not set')

export interface JWTPayload {
  email: string
  role: 'admin'
  iat?: number
  exp?: number
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
}

/**
 * Genera un token JWT
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

/**
 * Genera un refresh token
 */
export function generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_EXPIRES_IN })
}

/**
 * Verifica un token JWT
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

/**
 * Valida las credenciales de login
 */
export async function validateCredentials(credentials: LoginCredentials): Promise<boolean> {
  const { email, password } = credentials
  
  console.log('🔍 Validating credentials:')
  console.log('  Input email:', email)
  console.log('  Expected email:', ADMIN_CREDENTIALS.email)
  console.log('  Input password:', password)
  console.log('  Expected password:', ADMIN_CREDENTIALS.password)
  
  // Verificar email
  if (email !== ADMIN_CREDENTIALS.email) {
    console.log('❌ Email mismatch')
    return false
  }
  
  // Verificar contraseña
  const passwordMatch = password === ADMIN_CREDENTIALS.password
  console.log('🔑 Password match:', passwordMatch)
  
  return passwordMatch
}

/**
 * Procesa el login y retorna tokens
 */
export async function processLogin(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    const isValid = await validateCredentials(credentials)
    
    if (!isValid) {
      return {
        success: false,
        message: 'Credenciales inválidas'
      }
    }
    
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      email: credentials.email,
      role: 'admin'
    }
    
    const token = generateToken(payload)
    const refreshToken = generateRefreshToken(payload)
    
    return {
      success: true,
      message: 'Login exitoso',
      token,
      refreshToken
    }
  } catch (error) {
    console.error('Login process error:', error)
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

