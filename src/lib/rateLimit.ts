import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Cliente Redis de Upstash
 * Requiere variables de entorno:
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 */
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

/**
 * Rate limiter para login admin (5 intentos por 15 minutos)
 */
export const adminLoginRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: true,
  prefix: '@upstash/ratelimit/admin-login',
});

/**
 * Rate limiter para API admin (200 requests por 15 minutos)
 */
export const adminApiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(200, '15 m'),
  analytics: true,
  prefix: '@upstash/ratelimit/admin-api',
});

/**
 * Obtiene el identificador del cliente desde la request
 * Prioridad: IP address > User ID > 'anonymous'
 */
export function getClientIdentifier(req: Request): string {
  // Intentar obtener IP del header (Vercel, Cloudflare, etc.)
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  
  const ip = cfConnectingIp || realIp || (forwarded ? forwarded.split(',')[0].trim() : null);
  
  if (ip) {
    return ip;
  }
  
  // Intentar obtener userId del header (si está autenticado)
  const userId = req.headers.get('x-user-id');
  if (userId) {
    return `user:${userId}`;
  }
  
  // Fallback: usar 'anonymous'
  return 'anonymous';
}

/**
 * Verifica rate limit y retorna respuesta si excede el límite
 */
export async function checkRateLimit(
  rateLimiter: Ratelimit,
  identifier: string
): Promise<{ success: boolean; limit: number; remaining: number; reset: number } | null> {
  try {
    const { success, limit, remaining, reset } = await rateLimiter.limit(identifier);
    
    return {
      success,
      limit,
      remaining,
      reset,
    };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    // En producción: rechazar si Redis falla (fail closed)
    // Esto previene ataques DDoS si Redis está caído
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️ Redis falló en producción, rechazando request por seguridad (fail-closed)');
      return {
        success: false, // Rechazar en producción
        limit: 0,
        remaining: 0,
        reset: 0,
      };
    }
    // En desarrollo: permitir la request (fail open) para no bloquear desarrollo
    console.debug('⚠️ Redis falló en desarrollo, permitiendo request (fail-open)');
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
    };
  }
}

