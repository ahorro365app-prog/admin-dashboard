import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Configuración de Security Headers para Admin Dashboard
 * Previene XSS, clickjacking, MIME sniffing, y otros ataques
 */

/**
 * Genera los security headers para todas las respuestas
 */
export function getSecurityHeaders(request: NextRequest): Record<string, string> {
  const isProduction = process.env.NODE_ENV === 'production';
  const origin = request.nextUrl.origin;

  // Content Security Policy para Admin Dashboard
  // Más restrictivo que la app principal
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.sentry.io", // unsafe-inline necesario para Next.js, Sentry para error tracking
    "style-src 'self' 'unsafe-inline'", // No necesita Google Fonts externos
    "font-src 'self' data:", // Solo fuentes locales
    "img-src 'self' data: https:", // Imágenes de cualquier origen HTTPS
    "connect-src 'self' https://*.supabase.co https://*.sentry.io wss://*.supabase.co", // Supabase, Sentry
    "frame-src 'none'", // No permite iframes
    "object-src 'none'", // No permite <object>, <embed>, <applet>
    "base-uri 'self'", // Solo permite <base> desde mismo origen
    "form-action 'self'", // Solo permite formularios a mismo origen
    "frame-ancestors 'none'", // Previene embedding (clickjacking)
    "upgrade-insecure-requests", // Upgrade HTTP a HTTPS
  ].join('; ');

  const headers: Record<string, string> = {
    // Content Security Policy
    'Content-Security-Policy': csp,

    // X-Frame-Options: Previene clickjacking
    'X-Frame-Options': 'DENY',

    // X-Content-Type-Options: Previene MIME sniffing
    'X-Content-Type-Options': 'nosniff',

    // X-XSS-Protection: Protección XSS (legacy, pero útil)
    'X-XSS-Protection': '1; mode=block',

    // Referrer-Policy: Controla qué información se envía en Referer header
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permissions-Policy: Controla qué APIs del navegador están disponibles
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'interest-cohort=()', // Deshabilita FLoC
    ].join(', '),
  };

  // Strict-Transport-Security: Solo en producción con HTTPS
  if (isProduction) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
  }

  return headers;
}

/**
 * Aplica security headers a una respuesta NextResponse
 */
export function applySecurityHeaders(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  const headers = getSecurityHeaders(request);

  // Aplicar cada header
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Middleware helper para aplicar security headers
 * Usar en: middleware.ts
 */
export function securityHeadersMiddleware(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  return applySecurityHeaders(response, request);
}

