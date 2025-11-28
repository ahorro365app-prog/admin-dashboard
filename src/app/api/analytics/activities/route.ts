import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { logger } from '@/lib/logger'
import { adminApiRateLimit, getClientIdentifier, checkRateLimit } from '@/lib/rateLimit'
import { handleError } from '@/lib/errorHandler'

// Force dynamic rendering - Vercel cache buster
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * @deprecated Este endpoint está deprecado. 
 * Usar en su lugar:
 * - /api/analytics/recent-transactions para transacciones
 * - /api/analytics/recent-registrations para registros de usuarios
 * 
 * @swagger
 * /api/analytics/activities:
 *   get:
 *     summary: Obtiene actividades recientes del sistema
 *     description: Retorna las actividades más recientes del sistema incluyendo transacciones recientes, nuevos usuarios registrados y actualizaciones de suscripción. Ordenadas por timestamp descendente.
 *     tags: [Analytics]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Actividades recientes obtenidas exitosamente
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
 *                         example: "trans-123e4567-e89b-12d3-a456-426614174000"
 *                       type:
 *                         type: string
 *                         enum: [transaction, user_registration, subscription]
 *                       description:
 *                         type: string
 *                         example: "Gasto de $150.50"
 *                       user:
 *                         type: string
 *                         example: "Juan Pérez"
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       amount:
 *                         type: number
 *                         description: Solo presente para transacciones
 *                       status:
 *                         type: string
 *                         example: "success"
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
 * @route GET /api/analytics/activities
 * @description Obtiene actividades recientes del sistema
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

    logger.debug('📋 Fetching recent activities...')
    
    const supabase = getSupabaseAdmin()

    const activities: any[] = []

    // Obtener transacciones recientes
    const { data: transacciones, error: transError } = await supabase
      .from('transacciones')
      .select(`
        id,
        tipo,
        monto,
        fecha,
        usuarios!inner(nombre)
      `)
      .order('fecha', { ascending: false })
      .limit(10)

    if (!transError && transacciones) {
      transacciones.forEach(trans => {
        activities.push({
          id: `trans-${trans.id}`,
          type: 'transaction',
          description: `${trans.tipo === 'gasto' ? 'Gasto' : 'Ingreso'} de $${trans.monto}`,
          user: (trans as any).usuarios?.nombre || 'Usuario desconocido',
          timestamp: trans.fecha,
          amount: trans.monto,
          status: 'success'
        })
      })
    }

    // Obtener usuarios recientes (simulando registros)
    const { data: usuarios, error: usersError } = await supabase
      .from('usuarios')
      .select('id, nombre, suscripcion')
      .order('id', { ascending: false })
      .limit(5)

    if (!usersError && usuarios) {
      usuarios.forEach(user => {
        activities.push({
          id: `user-${user.id}`,
          type: 'user_registration',
          description: `Nuevo usuario registrado`,
          user: user.nombre,
          timestamp: new Date().toISOString(), // Simulamos timestamp reciente
          status: 'success'
        })

        if (user.suscripcion === 'premium') {
          activities.push({
            id: `sub-${user.id}`,
            type: 'subscription',
            description: `Actualización a Premium`,
            user: user.nombre,
            timestamp: new Date().toISOString(),
            status: 'success'
          })
        }
      })
    }

    // Ordenar por timestamp (más recientes primero)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Limitar a 15 actividades
    const recentActivities = activities.slice(0, 15)

    logger.debug('📋 Recent activities generated:', recentActivities.length)

    return NextResponse.json({
      success: true,
      data: recentActivities
    })

  } catch (error: any) {
    logger.error('💥 Error fetching activities:', (error as Error).message)
    return handleError(error, 'Error al obtener actividades recientes');
  }
}

