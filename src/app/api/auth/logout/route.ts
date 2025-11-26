import { NextRequest, NextResponse } from 'next/server'
import { logLogout } from '@/lib/audit-logger'
import { logger } from '@/lib/logger'
import { adminApiRateLimit, getClientIdentifier, checkRateLimit } from '@/lib/rateLimit'
import { handleError } from '@/lib/errorHandler'
import { clearElevatedSessionCookie } from '@/lib/auth-helpers'

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cierra sesión del administrador
 *     description: Cierra la sesión del administrador actual, elimina las cookies de autenticación y registra el evento en el audit log.
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logout exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Logout exitoso"
 *         headers:
 *           Set-Cookie:
 *             description: Cookies eliminadas (admin-token, admin-refresh-token)
 *             schema:
 *               type: string
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit excedido (100 requests / 15 minutos)
 *         headers:
 *           X-RateLimit-Limit:
 *             schema:
 *               type: integer
 *               example: 100
 *           Retry-After:
 *             schema:
 *               type: integer
 *               example: 900
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * @route POST /api/auth/logout
 * @description Cierra sesión del administrador
 * @security Requiere autenticación de administrador (cookie)
 * @rateLimit 100 requests / 15 minutos
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting
    const identifier = getClientIdentifier(request as any);
    const rateLimitResult = await checkRateLimit(adminApiRateLimit, identifier);
    if (!rateLimitResult?.success) {
      logger.warn(`⛔ Rate limit exceeded for ${identifier}`);
      return NextResponse.json(
        {
          success: false,
          message: 'Demasiadas solicitudes. Por favor, intenta más tarde.',
          retryAfter: rateLimitResult ? new Date(rateLimitResult.reset).toISOString() : 'unknown',
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult ? Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString() : '900',
            'X-RateLimit-Limit': rateLimitResult?.limit.toString() || '200',
            'X-RateLimit-Remaining': rateLimitResult?.remaining.toString() || '0',
            'X-RateLimit-Reset': rateLimitResult?.reset.toString() || Date.now().toString(),
          },
        }
      );
    }

    logger.debug('🚪 Logout API called')

    // Crear respuesta exitosa
    const response = NextResponse.json({
      success: true,
      message: 'Logout exitoso'
    })

    // Limpiar cookies
    response.cookies.set('admin-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    })

    response.cookies.set('admin-refresh-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    })

    clearElevatedSessionCookie(response)

    logger.success('✅ Logout completed, cookies cleared')
    await logLogout(request);
    return response

  } catch (error) {
    logger.error('💥 Logout API error:', error)
    return handleError(error, 'Error al procesar logout');
  }
}

/**
 * @swagger
 * /api/auth/logout:
 *   get:
 *     summary: Método no permitido
 *     description: Este endpoint solo acepta POST. Usa POST para cerrar sesión.
 *     tags: [Auth]
 *     responses:
 *       405:
 *         description: Método no permitido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Use POST method for logout"
 * 
 * @route GET /api/auth/logout
 * @description Método no permitido - usar POST
 */
export async function GET() {
  return NextResponse.json({
    success: false,
    message: 'Use POST method for logout'
  }, { status: 405 })
}

