/**
 * Helpers de autenticación para endpoints de admin
 * Proporciona funciones reutilizables para verificar autenticación
 */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { handleAuthError } from './errorHandler';
import { logger } from './logger';

const ELEVATED_COOKIE_NAME = 'admin-elevated';
const DEFAULT_ELEVATED_SECONDS = Number(process.env.ADMIN_ELEVATED_SECONDS || 15 * 60);

type ElevatedTokenPayload = {
  adminId: string;
  email: string;
  scope: 'admin:elevated';
  exp?: number;
};

const buildElevatedResponse = () =>
  NextResponse.json(
    {
      success: false,
      message: 'Se requiere revalidar con 2FA para continuar.',
      reauthRequired: true,
    },
    { status: 428 }
  );

/**
 * Obtiene el JWT_SECRET validado
 * ⚠️ CRÍTICO: No usar fallback en producción
 */
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret || secret.trim() === '' || secret === 'demo-secret-key-change-in-production') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET no está configurado. Es requerido en producción.');
    }
    // En desarrollo, usar secret temporal pero advertir
    logger.warn('⚠️ JWT_SECRET no configurado. Usando secret temporal. Configura JWT_SECRET en .env.local');
    return 'TEMPORARY-DEV-SECRET-CHANGE-IN-PRODUCTION';
  }
  
  // Validar que no sea placeholder
  if (secret.includes('your_') || secret.includes('_here') || secret.length < 16) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET parece ser un placeholder. Debe ser un secret real y seguro.');
    }
    logger.warn('⚠️ JWT_SECRET parece ser un placeholder. Usando secret temporal en desarrollo.');
    return 'TEMPORARY-DEV-SECRET-CHANGE-IN-PRODUCTION';
  }
  
  return secret;
};

export function createElevatedSessionToken(
  adminId: string,
  email: string,
  durationSeconds: number = DEFAULT_ELEVATED_SECONDS
): string {
  const JWT_SECRET = getJwtSecret();
  const seconds = Math.max(60, durationSeconds);
  return jwt.sign({ adminId, email, scope: 'admin:elevated' }, JWT_SECRET, {
    expiresIn: seconds,
  });
}

export function setElevatedSessionCookie(
  response: NextResponse,
  admin: { adminId: string; email: string },
  durationSeconds: number = DEFAULT_ELEVATED_SECONDS
) {
  const token = createElevatedSessionToken(admin.adminId, admin.email, durationSeconds);
  response.cookies.set(ELEVATED_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: Math.max(60, Math.floor(durationSeconds)),
    path: '/',
  });
}

export function clearElevatedSessionCookie(response: NextResponse) {
  response.cookies.set(ELEVATED_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
}

export function requireElevatedAccess(
  request: NextRequest,
  expectedAdminId?: string
): ElevatedTokenPayload | NextResponse {
  const token = request.cookies.get(ELEVATED_COOKIE_NAME)?.value;
  if (!token) {
    return buildElevatedResponse();
  }

  const JWT_SECRET = getJwtSecret();

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as ElevatedTokenPayload;
    if (decoded.scope !== 'admin:elevated') {
      return buildElevatedResponse();
    }

    if (expectedAdminId && decoded.adminId !== expectedAdminId) {
      return buildElevatedResponse();
    }

    return decoded;
  } catch (error) {
    console.warn('Elevated token invalid or expired:', error);
    return buildElevatedResponse();
  }
}

/**
 * Interfaz para datos de admin autenticado
 */
export interface AuthenticatedAdmin {
  adminId: string;
  email: string;
  role?: string;
}

/**
 * Verifica que el request tenga un token JWT válido
 * Retorna los datos del admin autenticado o un NextResponse con error
 * 
 * @param request El request de Next.js
 * @returns Datos del admin autenticado o NextResponse con error 401
 * 
 * @example
 * ```typescript
 * const auth = await requireAuth(request);
 * if (auth instanceof NextResponse) {
 *   return auth; // Error de autenticación
 * }
 * const { adminId, email } = auth;
 * // Continuar con lógica del endpoint...
 * ```
 */
export async function requireAuth(
  request: NextRequest
): Promise<AuthenticatedAdmin | NextResponse> {
  // Obtener token de las cookies
  const token = request.cookies.get('admin-token')?.value;

  if (!token) {
    return handleAuthError('No autenticado');
  }

  // Verificar token JWT
  // ⚠️ CRÍTICO: JWT_SECRET es requerido en producción, no usar fallback
  const JWT_SECRET = process.env.JWT_SECRET;
  
  if (!JWT_SECRET || JWT_SECRET.trim() === '' || JWT_SECRET === 'demo-secret-key-change-in-production') {
    if (process.env.NODE_ENV === 'production') {
      logger.error('❌ JWT_SECRET no está configurado. Es requerido en producción.');
      return handleAuthError('Error de configuración del servidor');
    }
    // En desarrollo, usar un secret temporal pero advertir
    logger.warn('⚠️ JWT_SECRET no configurado. Usando secret temporal. Configura JWT_SECRET en .env.local');
    const tempSecret = 'TEMPORARY-DEV-SECRET-CHANGE-IN-PRODUCTION';
    // Continuar con secret temporal solo en desarrollo
  }
  
  // Validar que el secret no sea un placeholder
  if (JWT_SECRET && (
    JWT_SECRET.includes('your_') ||
    JWT_SECRET.includes('_here') ||
    JWT_SECRET.length < 16
  )) {
    logger.error('❌ JWT_SECRET parece ser un placeholder o demasiado corto. Debe ser un secret real y seguro.');
    if (process.env.NODE_ENV === 'production') {
      return handleAuthError('Error de configuración del servidor');
    }
  }
  
  const secretToUse = JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'TEMPORARY-DEV-SECRET-CHANGE-IN-PRODUCTION' : '');
  
  if (!secretToUse) {
    return handleAuthError('Error de configuración del servidor');
  }
  
  try {
    const decoded = jwt.verify(token, secretToUse) as any;
    
    // Extraer datos del admin
    const adminId = decoded.id || decoded.adminId;
    const email = decoded.email;
    const role = decoded.role || 'admin';

    if (!adminId || !email) {
      return handleAuthError('Token inválido: faltan datos requeridos');
    }

    return {
      adminId,
      email,
      role,
    };
  } catch (error) {
    // Token inválido, expirado, o mal formado
    return handleAuthError('Token inválido o expirado');
  }
}

/**
 * Obtiene el ID del admin desde el token JWT sin validar
 * Útil para casos donde ya sabemos que el token es válido (después de requireAuth)
 * 
 * @param request El request de Next.js
 * @returns ID del admin o null si no hay token o es inválido
 */
export function getAdminIdFromRequest(request: NextRequest): string | null {
  try {
    const token = request.cookies.get('admin-token')?.value;
    if (!token) return null;

    // ⚠️ CRÍTICO: JWT_SECRET es requerido, usar función validada
    const JWT_SECRET = getJwtSecret();
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded.id || decoded.adminId || null;
  } catch (error) {
    return null;
  }
}

