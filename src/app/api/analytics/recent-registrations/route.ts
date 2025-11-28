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
 * /api/analytics/recent-registrations:
 *   get:
 *     summary: Obtiene registros recientes de usuarios
 *     description: Retorna los usuarios más recientemente registrados ordenados por fecha de creación
 *     tags: [Analytics]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Registros recientes obtenidos exitosamente
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
 *                       nombre:
 *                         type: string
 *                       telefono:
 *                         type: string
 *                       pais:
 *                         type: string
 *                       suscripcion:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: No autenticado
 *       429:
 *         description: Rate limit excedido
 *       500:
 *         description: Error interno del servidor
 * 
 * @route GET /api/analytics/recent-registrations
 * @description Obtiene registros recientes de usuarios
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

    logger.debug('👤 Fetching recent user registrations...')
    
    const supabase = getSupabaseAdmin()

    // Obtener usuarios recientes ordenados por fecha_creacion (campo en español)
    // Intentar primero con fecha_creacion, luego con created_at, luego con id
    let usuarios: any[] = []
    let usersError: any = null

    // Intentar con fecha_creacion (esquema en español)
    const { data: usuariosFechaCreacion, error: errorFechaCreacion } = await supabase
      .from('usuarios')
      .select(`
        id,
        nombre,
        telefono,
        pais,
        country_code,
        suscripcion,
        fecha_creacion
      `)
      .order('fecha_creacion', { ascending: false, nullsFirst: false })
      .limit(10)

    if (!errorFechaCreacion && usuariosFechaCreacion && usuariosFechaCreacion.length > 0) {
      usuarios = usuariosFechaCreacion
      logger.debug('✅ Using fecha_creacion field')
    } else {
      // Intentar con created_at (esquema en inglés)
      logger.debug('⚠️ Trying created_at field...')
      const { data: usuariosCreatedAt, error: errorCreatedAt } = await supabase
        .from('usuarios')
        .select(`
          id,
          nombre,
          telefono,
          pais,
          country_code,
          suscripcion,
          created_at
        `)
        .order('created_at', { ascending: false, nullsFirst: false })
        .limit(10)

      if (!errorCreatedAt && usuariosCreatedAt && usuariosCreatedAt.length > 0) {
        usuarios = usuariosCreatedAt
        logger.debug('✅ Using created_at field')
      } else {
        // Fallback: ordenar por id
        logger.debug('⚠️ Using fallback: ordering by id...')
        const { data: usuariosFallback, error: fallbackError } = await supabase
          .from('usuarios')
          .select(`
            id,
            nombre,
            telefono,
            pais,
            country_code,
            suscripcion
          `)
          .order('id', { ascending: false })
          .limit(10)

        if (fallbackError) {
          logger.error('❌ Error fetching users:', fallbackError)
          throw fallbackError
        }

        usuarios = usuariosFallback || []
        usersError = fallbackError
      }
    }

    // Formatear datos para el frontend
    const formattedRegistrations = usuarios.map(user => {
      // Determinar la fecha de creación (puede ser fecha_creacion o created_at)
      const fechaCreacion = (user as any).fecha_creacion || (user as any).created_at || new Date().toISOString()
      
      return {
        id: user.id,
        nombre: user.nombre,
        telefono: user.telefono,
        pais: user.pais,
        country_code: user.country_code,
        suscripcion: user.suscripcion || 'free',
        created_at: fechaCreacion,
      }
    })

    logger.debug(`👤 Recent registrations fetched: ${formattedRegistrations.length}`)

    return NextResponse.json({
      success: true,
      data: formattedRegistrations
    })

  } catch (error: any) {
    logger.error('💥 Error fetching recent registrations:', (error as Error).message)
    return handleError(error, 'Error al obtener registros recientes');
  }
}

