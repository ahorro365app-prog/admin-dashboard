import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Configuración de tokens CSRF
 */
const CSRF_TOKEN_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_EXPIRY = 60 * 60 * 24; // 24 horas en segundos

/**
 * Genera un token CSRF aleatorio y seguro
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Obtiene el token CSRF de las cookies
 */
export function getCSRFTokenFromCookie(req: NextRequest): string | null {
  const cookieToken = req.cookies.get(CSRF_COOKIE_NAME);
  return cookieToken?.value || null;
}

/**
 * Obtiene el token CSRF del header de la request
 */
export function getCSRFTokenFromHeader(req: NextRequest): string | null {
  return req.headers.get(CSRF_HEADER_NAME) || null;
}

/**
 * Obtiene el token CSRF del body (para formData)
 * NOTA: Para JSON, el token debe venir en el header preferentemente.
 * Para formData, esta función consume el body y retorna el formData para reutilizar.
 */
export async function getCSRFTokenFromBody(req: NextRequest): Promise<{ token: string | null; formData?: FormData }> {
  try {
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Para formData, leerlo y retornar el formData también para reutilizarlo
      const formData = await req.formData();
      const token = (formData.get('csrfToken') as string) || null;
      return { token, formData };
    }
    // Para JSON, no leer el body aquí (se consume y no se puede reutilizar)
    // El token debe venir en el header o el endpoint debe extraerlo del body antes de validar CSRF
  } catch (error) {
    // Si no se puede parsear el body, retornar null
    return { token: null };
  }
  
  return { token: null };
}

/**
 * Valida que el token CSRF de la request coincida con el de la cookie
 * @param req - Request de Next.js
 * @param bodyToken - Token extraído del body (opcional, para JSON)
 */
export async function validateCSRFToken(
  req: NextRequest,
  bodyToken?: string
): Promise<{
  valid: boolean;
  error?: string;
  formData?: FormData; // Retornar formData si se leyó
}> {
  // Obtener token de la cookie
  const cookieToken = getCSRFTokenFromCookie(req);
  
  if (!cookieToken) {
    return {
      valid: false,
      error: 'Token CSRF no encontrado en cookies'
    };
  }

  // Obtener token de la request (header primero, luego body)
  let requestToken = getCSRFTokenFromHeader(req);
  let formData: FormData | undefined;
  
  if (!requestToken) {
    if (bodyToken) {
      // Si se pasó el token del body, usarlo
      requestToken = bodyToken;
    } else {
      // Intentar leer del body (solo para formData)
      const bodyResult = await getCSRFTokenFromBody(req);
      requestToken = bodyResult.token;
      formData = bodyResult.formData;
    }
  }

  if (!requestToken) {
    return {
      valid: false,
      error: 'Token CSRF no encontrado en la request'
    };
  }

  // Comparar tokens de forma segura (timing-safe)
  const isValid = crypto.timingSafeEqual(
    Buffer.from(cookieToken),
    Buffer.from(requestToken)
  );

  if (!isValid) {
    return {
      valid: false,
      error: 'Token CSRF inválido'
    };
  }

  return { valid: true, formData };
}

/**
 * Establece el token CSRF en una cookie HttpOnly
 */
export function setCSRFTokenCookie(response: NextResponse, token: string): void {
  try {
    response.cookies.set(CSRF_COOKIE_NAME, token, {
      httpOnly: true, // No accesible desde JavaScript
      secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
      sameSite: 'lax', // Cambiado de 'strict' a 'lax' para mejor compatibilidad
      maxAge: CSRF_TOKEN_EXPIRY,
      path: '/',
    });
  } catch (error) {
    console.error('Error setting CSRF cookie:', error);
    // No lanzar error, solo loggear - la cookie es opcional si el token está en el body
  }
}

/**
 * Middleware helper para validar CSRF en endpoints
 * Retorna null si es válido, o una NextResponse con error si no
 * 
 * Para endpoints con JSON body, extrae el token del body antes de llamar:
 * ```typescript
 * const body = await req.json();
 * const csrfError = await requireCSRF(req, body.csrfToken);
 * ```
 */
export async function requireCSRF(
  req: NextRequest,
  bodyToken?: string
): Promise<NextResponse | null> {
  // Solo validar métodos que modifican datos
  const method = req.method;
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return null; // No requiere CSRF para GET, HEAD, OPTIONS
  }

  const validation = await validateCSRFToken(req, bodyToken);
  
  if (!validation.valid) {
    return NextResponse.json(
      {
        success: false,
        error: 'Token CSRF inválido o faltante',
        message: validation.error
      },
      { status: 403 }
    );
  }

  return null; // Token válido
}

/**
 * Endpoint helper para obtener el token CSRF
 * Usar en: GET /api/csrf-token
 */
export async function getCSRFTokenEndpoint(req: NextRequest): Promise<NextResponse> {
  // Verificar si ya hay un token válido en las cookies
  const existingToken = getCSRFTokenFromCookie(req);
  
  let token: string;
  if (existingToken) {
    token = existingToken;
  } else {
    token = generateCSRFToken();
  }

  const response = NextResponse.json({
    success: true,
    csrfToken: token
  });

  // Establecer token en cookie
  setCSRFTokenCookie(response, token);

  return response;
}

