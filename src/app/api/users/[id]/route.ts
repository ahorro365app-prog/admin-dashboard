import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { adminApiRateLimit, getClientIdentifier, checkRateLimit } from '@/lib/rateLimit'
import { uuidSchema, validateWithZod } from '@/lib/validations'
import { handleError, handleValidationError, handleNotFoundError } from '@/lib/errorHandler'

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Obtiene detalles de un usuario por ID
 *     description: Retorna la información detallada de un usuario específico identificado por su UUID
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID del usuario
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Usuario obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Error de validación (ID inválido)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Usuario no encontrado
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
 * 
 * @route GET /api/users/{id}
 * @description Obtiene detalles de un usuario por ID
 * @security Requiere autenticación de administrador (cookie)
 * @rateLimit 100 requests / 15 minutos
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // 2. Validar ID
    const validation = validateWithZod(uuidSchema, params.id);
    if (!validation.success) {
      return handleValidationError(validation.error, validation.details);
    }

    const validId = validation.data;

    logger.debug('👤 Fetching user details for:', validId)
    
    // Obtener usuario por ID
    const user = await prisma.usuario.findUnique({
      where: { id: validId },
      select: {
        id: true,
        nombre: true,
        correo: true,
        telefono: true,
        pais: true,
        moneda: true,
        presupuesto_diario: true,
        suscripcion: true
      }
    })

    if (!user) {
      return handleNotFoundError('Usuario');
    }

    logger.success('✅ User details fetched:', (user as any).nombre)

    return NextResponse.json({
      success: true,
      data: user
    })

  } catch (error: any) {
    logger.error('💥 Error fetching user details:', error.message)
    return handleError(error, 'Error al obtener detalles del usuario');
  }
}
