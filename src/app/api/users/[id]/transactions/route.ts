import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import { adminApiRateLimit, getClientIdentifier, checkRateLimit } from '@/lib/rateLimit'
import { uuidSchema, validateWithZod } from '@/lib/validations'
import { handleError, handleValidationError } from '@/lib/errorHandler'

/**
 * @swagger
 * /api/users/{id}/transactions:
 *   get:
 *     summary: Obtiene transacciones de un usuario específico
 *     description: Retorna las transacciones de un usuario identificado por su UUID, ordenadas por fecha descendente (más recientes primero). Limitado a 50 transacciones.
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
 *         description: Transacciones obtenidas exitosamente
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       usuario_id:
 *                         type: string
 *                         format: uuid
 *                       tipo:
 *                         type: string
 *                         enum: [ingreso, gasto]
 *                       monto:
 *                         type: number
 *                       categoria:
 *                         type: string
 *                       descripcion:
 *                         type: string
 *                       fecha:
 *                         type: string
 *                         format: date-time
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
 * @route GET /api/users/{id}/transactions
 * @description Obtiene transacciones de un usuario específico
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

    logger.debug('📊 Fetching user transactions for:', validId)
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Obtener transacciones del usuario
    const { data: transactions, error } = await supabase
      .from('transacciones')
      .select('*')
      .eq('usuario_id', validId)
      .order('fecha', { ascending: false })
      .limit(50)

    if (error) {
      logger.error('Error fetching transactions:', error.message)
      return handleError(error, 'Error obteniendo transacciones');
    }

    logger.success('✅ User transactions fetched:', transactions?.length || 0)

    return NextResponse.json({
      success: true,
      data: transactions || []
    })

  } catch (error: any) {
    logger.error('💥 Error fetching user transactions:', error.message)
    return handleError(error, 'Error al obtener transacciones del usuario');
  }
}






