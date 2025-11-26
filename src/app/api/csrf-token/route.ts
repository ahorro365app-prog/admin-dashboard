import { NextRequest, NextResponse } from 'next/server';
import { getCSRFTokenEndpoint } from '@/lib/csrf';
import { adminApiRateLimit, getClientIdentifier, checkRateLimit } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';

/**
 * @swagger
 * /api/csrf-token:
 *   get:
 *     summary: Obtiene token CSRF
 *     description: Genera o retorna un token CSRF necesario para realizar requests POST/PUT/DELETE. El token se establece en una cookie HttpOnly y también se retorna en el body.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Token CSRF generado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 csrfToken:
 *                   type: string
 *                   description: Token CSRF para incluir en requests
 *         headers:
 *           Set-Cookie:
 *             description: Cookie HttpOnly con token CSRF
 *             schema:
 *               type: string
 *       429:
 *         description: Rate limit excedido (200 requests / 15 minutos)
 *         headers:
 *           X-RateLimit-Limit:
 *             schema:
 *               type: integer
 *               example: 200
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
 * @route GET /api/csrf-token
 * @description Obtiene o genera un token CSRF y lo establece en una cookie HttpOnly
 * @rateLimit 200 requests / 15 minutos (más generoso ya que se llama frecuentemente)
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Rate limiting (más generoso para CSRF token ya que se llama frecuentemente)
    const identifier = getClientIdentifier(req as any);
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

    return getCSRFTokenEndpoint(req);
  } catch (error) {
    logger.error('Error in CSRF token endpoint:', error);
    return NextResponse.json(
      { success: false, message: 'Error al generar token CSRF' },
      { status: 500 }
    );
  }
}

