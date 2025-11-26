import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import { adminApiRateLimit, getClientIdentifier, checkRateLimit } from '@/lib/rateLimit'
import { handleError } from '@/lib/errorHandler'

// Force dynamic rendering - Vercel cache buster
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * @swagger
 * /api/analytics/charts:
 *   get:
 *     summary: Obtiene datos para gráficos de analytics
 *     description: Retorna datos agregados para visualización en gráficos: transacciones de los últimos 7 días, usuarios de los últimos 6 meses, y distribución de suscripciones.
 *     tags: [Analytics]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Datos de gráficos obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactions7Days:
 *                       type: array
 *                       description: Transacciones por día (últimos 7 días)
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "Lun"
 *                           value:
 *                             type: integer
 *                             example: 45
 *                     users6Months:
 *                       type: array
 *                       description: Usuarios por mes (últimos 6 meses)
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "Ene"
 *                           value:
 *                             type: integer
 *                             example: 120
 *                     subscriptionData:
 *                       type: array
 *                       description: Distribución de suscripciones
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             enum: [Free, Premium]
 *                           value:
 *                             type: integer
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
 * @route GET /api/analytics/charts
 * @description Obtiene datos para gráficos de analytics
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

    logger.debug('📊 Fetching chart data...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Datos de transacciones por día (últimos 7 días)
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const { count } = await supabase
        .from('transacciones')
        .select('*', { count: 'exact', head: true })
        .gte('fecha', `${dateStr}T00:00:00`)
        .lte('fecha', `${dateStr}T23:59:59`)
      
      last7Days.push({
        name: date.toLocaleDateString('es-ES', { weekday: 'short' }),
        value: count || 0
      })
    }

    // Datos de usuarios por mes (últimos 6 meses)
    const last6Months = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStr = date.toISOString().substring(0, 7) // YYYY-MM
      
      const { count } = await supabase
        .from('usuarios')
        .select('*', { count: 'exact', head: true })
        .like('created_at', `${monthStr}%`)
      
      last6Months.push({
        name: date.toLocaleDateString('es-ES', { month: 'short' }),
        value: count || 0
      })
    }

    // Datos de distribución de suscripciones
    const { count: totalUsers } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true })

    const { count: premiumUsers } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true })
      .eq('suscripcion', 'premium')

    const freeUsers = (totalUsers || 0) - (premiumUsers || 0)

    const subscriptionData = [
      { name: 'Free', value: freeUsers },
      { name: 'Premium', value: premiumUsers || 0 }
    ]

    logger.debug('📊 Chart data generated:', {
      transactions7Days: last7Days.length,
      users6Months: last6Months.length,
      subscriptionData: subscriptionData.length
    })

    return NextResponse.json({
      success: true,
      data: {
        transactions7Days: last7Days,
        users6Months: last6Months,
        subscriptionData
      }
    })

  } catch (error: any) {
    logger.error('💥 Error fetching chart data:', (error as Error).message)
    return handleError(error, 'Error al obtener datos de gráficos');
  }
}







