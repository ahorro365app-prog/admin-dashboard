import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { logger } from '@/lib/logger'
import { adminApiRateLimit, getClientIdentifier, checkRateLimit } from '@/lib/rateLimit'
import { handleError } from '@/lib/errorHandler'

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * @swagger
 * /api/analytics/recent-transactions:
 *   get:
 *     summary: Obtiene transacciones recientes del sistema
 *     description: Retorna las transacciones más recientes ordenadas por fecha descendente
 *     tags: [Analytics]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Transacciones recientes obtenidas exitosamente
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
 *                       tipo:
 *                         type: string
 *                         enum: [gasto, ingreso]
 *                       monto:
 *                         type: number
 *                       fecha:
 *                         type: string
 *                         format: date-time
 *                       usuario:
 *                         type: object
 *                         properties:
 *                           nombre:
 *                             type: string
 *                           telefono:
 *                             type: string
 *       401:
 *         description: No autenticado
 *       429:
 *         description: Rate limit excedido
 *       500:
 *         description: Error interno del servidor
 * 
 * @route GET /api/analytics/recent-transactions
 * @description Obtiene transacciones recientes del sistema
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

    logger.debug('💰 Fetching recent transactions...')
    
    const supabase = getSupabaseAdmin()

    // Obtener transacciones recientes con información del usuario
    const { data: transacciones, error: transError } = await supabase
      .from('transacciones')
      .select(`
        id,
        tipo,
        monto,
        fecha,
        categoria,
        descripcion,
        usuarios!inner(
          id,
          nombre,
          telefono
        )
      `)
      .order('fecha', { ascending: false })
      .limit(10)

    if (transError) {
      logger.error('❌ Error fetching transactions:', transError)
      throw transError
    }

    // Formatear datos para el frontend
    const formattedTransactions = (transacciones || []).map(trans => ({
      id: trans.id,
      tipo: trans.tipo,
      monto: trans.monto,
      fecha: trans.fecha,
      categoria: trans.categoria,
      descripcion: trans.descripcion,
      usuario: {
        id: (trans as any).usuarios?.id,
        nombre: (trans as any).usuarios?.nombre || 'Usuario desconocido',
        telefono: (trans as any).usuarios?.telefono || null,
      }
    }))

    logger.debug(`💰 Recent transactions fetched: ${formattedTransactions.length}`)

    return NextResponse.json({
      success: true,
      data: formattedTransactions
    })

  } catch (error: any) {
    logger.error('💥 Error fetching recent transactions:', (error as Error).message)
    return handleError(error, 'Error al obtener transacciones recientes');
  }
}

