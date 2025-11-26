import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { securityHeadersMiddleware } from '@/lib/securityHeaders'

/**
 * Middleware de autenticación y seguridad
 * 
 * ⚠️ POLÍTICA DE LOGGING:
 * - NO agregar logs que expongan información sensible (tokens, rutas protegidas, IPs, user agents)
 * - Si es necesario agregar logs, usar logger condicional que solo funciona en desarrollo:
 *   import { logger } from '@/lib/logger';
 *   logger.debug('Mensaje'); // Solo se muestra en desarrollo
 * - NUNCA usar console.log directamente
 * - NUNCA loguear tokens JWT completos
 * - NUNCA loguear rutas protegidas específicas
 * 
 * El middleware debe ser silencioso en producción para evitar exposición de información.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ['/login', '/api/', '/setup', '/quick-setup', '/manual-setup', '/test']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Si es una ruta pública, permitir acceso
  if (isPublicRoute) {
    const response = NextResponse.next()
    return securityHeadersMiddleware(request, response)
  }

  // Para rutas protegidas, verificar token
  const token = request.cookies.get('admin-token')?.value

  if (!token) {
    const response = NextResponse.redirect(new URL('/login', request.nextUrl.origin))
    return securityHeadersMiddleware(request, response)
  }

  const response = NextResponse.next()
  return securityHeadersMiddleware(request, response)
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

