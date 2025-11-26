import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { handleError } from '@/lib/errorHandler'
import { adminApiRateLimit, getClientIdentifier, checkRateLimit } from '@/lib/rateLimit'
import { paginationSchema, validateWithZod } from '@/lib/validations'
import { handleValidationError } from '@/lib/errorHandler'

export const dynamic = 'force-dynamic'

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Obtiene lista de usuarios con paginación
 *     description: Retorna una lista paginada de usuarios usando Prisma. Permite especificar límite y offset para la paginación.
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: Límite de resultados a retornar
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Número de resultados a saltar (para paginación)
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     limit:
 *                       type: integer
 *                       example: 50
 *                     offset:
 *                       type: integer
 *                       example: 0
 *                     total:
 *                       type: integer
 *                       example: 100
 *       400:
 *         description: Error de validación
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
 * @route GET /api/users
 * @description Obtiene lista de usuarios con paginación
 * @security Requiere autenticación de administrador (cookie)
 * @rateLimit 100 requests / 15 minutos
 */
export async function GET(request: NextRequest) {
  logger.debug('👥 Fetching usuarios using Prisma...')
  
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

    // 2. Validar query params
    const searchParams = request.nextUrl.searchParams;
    const params = {
      limit: searchParams.get('limit') || '50',
      offset: searchParams.get('offset') || '0'
    };
    
    const validation = validateWithZod(paginationSchema, params);
    if (!validation.success) {
      return handleValidationError(validation.error, validation.details);
    }

    const { limit, offset } = validation.data;

    logger.debug('📋 Params:', { limit, offset })

    // Usar Prisma para obtener usuarios
    const usuarios = await prisma.usuario.findMany({
      take: limit,
      skip: offset,
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

    const total = await prisma.usuario.count()

    logger.success('✅ Usuarios fetched with Prisma:', usuarios.length)
    
    return NextResponse.json({
      success: true,
      data: usuarios,
      pagination: {
        limit,
        offset,
        total
      }
    })

  } catch (error: any) {
    // Usar error handler seguro
    return handleError(error, 'Error al obtener usuarios');
  }
}

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Método no permitido
 *     description: Este endpoint solo acepta GET. Usa GET para obtener la lista de usuarios.
 *     tags: [Users]
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
 *                   example: "Método no permitido"
 * 
 * @route POST /api/users
 * @description Método no permitido - usar GET
 */
export async function POST() {
  return NextResponse.json(
    { success: false, message: 'Método no permitido' },
    { status: 405 }
  )
}

