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
  // En desarrollo, permitir conexiones a localhost para backend local
  const coreApiUrl = process.env.NEXT_PUBLIC_CORE_API_URL?.replace(/\/$/, '') || '';
  const connectSrcParts = [
    "'self'",
    'https://*.supabase.co',
    'wss://*.supabase.co',
    'https://*.sentry.io',
  ];
  
  // En desarrollo, agregar localhost para backend local
  if (!isProduction) {
    connectSrcParts.push('http://localhost:3000', 'http://localhost:3002', 'ws://localhost:3000', 'ws://localhost:3002');
  }
  
  // Si hay una URL de core-api configurada y no es localhost, agregarla
  if (coreApiUrl && !coreApiUrl.includes('localhost')) {
    connectSrcParts.push(coreApiUrl);
  }

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.sentry.io", // unsafe-inline necesario para Next.js, Sentry para error tracking
    "style-src 'self' 'unsafe-inline'", // No necesita Google Fonts externos
    "font-src 'self' data:", // Solo fuentes locales
    "img-src 'self' data: https:", // Imágenes de cualquier origen HTTPS
    `connect-src ${connectSrcParts.join(' ')}`, // Supabase, Sentry, y backend local en desarrollo
    "frame-src 'none'", // No permite iframes
    "object-src 'none'", // No permite <object>, <embed>, <applet>
    "base-uri 'self'", // Solo permite <base> desde mismo origen
    "form-action 'self'", // Solo permite formularios a mismo origen
    "frame-ancestors 'none'", // Previene embedding (clickjacking)
    ...(isProduction ? ["upgrade-insecure-requests"] : []), // Upgrade HTTP a HTTPS solo en producción
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

