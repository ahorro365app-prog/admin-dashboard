import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { adminApiRateLimit, getClientIdentifier, checkRateLimit } from '@/lib/rateLimit'
import { paymentsQuerySchema, validateWithZod } from '@/lib/validations'
import { handleError, handleValidationError } from '@/lib/errorHandler'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Obtiene lista de pagos con filtros
 *     description: Retorna una lista de pagos con opciones de filtrado por estado. Incluye estadísticas de pagos.
 *     tags: [Payments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [all, pendiente, verificado, rechazado]
 *           default: all
 *         description: Filtro por estado del pago
 *     responses:
 *       200:
 *         description: Lista de pagos obtenida exitosamente
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
 *                       monto:
 *                         type: number
 *                       estado:
 *                         type: string
 *                         enum: [pendiente, verificado, rechazado]
 *                       fecha_pago:
 *                         type: string
 *                         format: date-time
 *                       usuario:
 *                         type: object
 *                         properties:
 *                           nombre:
 *                             type: string
 *                           correo:
 *                             type: string
 *                           telefono:
 *                             type: string
 *                 stats:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     pendientes:
 *                       type: integer
 *                     verificados:
 *                       type: integer
 *                     rechazados:
 *                       type: integer
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
 * 
 * @route GET /api/payments
 * @description Obtiene lista de pagos con filtros y estadísticas
 * @security Requiere autenticación de administrador (cookie)
 * @rateLimit 100 requests / 15 minutos
 */
export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    const params = {
      estado: searchParams.get('estado') || 'all'
    };
    
    const validation = validateWithZod(paymentsQuerySchema, params);
    if (!validation.success) {
      return handleValidationError(validation.error, validation.details);
    }

    const { estado } = validation.data;

    // Construir query base
    let query = supabase
      .from('pagos')
      .select(`
        *,
        usuario:usuario_id (
          nombre,
          correo,
          telefono
        )
      `)
      .order('fecha_pago', { ascending: false })

    // Aplicar filtro de estado si existe
    if (estado && estado !== 'all') {
      query = query.eq('estado', estado)
    }

    const { data: payments, error } = await query

    if (error) {
      logger.error('Error fetching payments:', error)
      return handleError(error, 'Error al obtener pagos');
    }

    // Calcular estadísticas
    const { data: allPayments } = await supabase
      .from('pagos')
      .select('estado')

    const stats = {
      total: allPayments?.length || 0,
      pendientes: allPayments?.filter(p => p.estado === 'pendiente').length || 0,
      verificados: allPayments?.filter(p => p.estado === 'verificado').length || 0,
      rechazados: allPayments?.filter(p => p.estado === 'rechazado').length || 0
    }

    return NextResponse.json({
      success: true,
      data: payments || [],
      stats
    })

  } catch (error: any) {
    logger.error('Error in payments API:', error)
    return handleError(error, 'Error al obtener pagos');
  }
}

