import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { adminApiRateLimit, getClientIdentifier, checkRateLimit } from '@/lib/rateLimit'
import { handleError } from '@/lib/errorHandler'

/**
 * @swagger
 * /api/stats/users:
 *   get:
 *     summary: Obtiene estadísticas de usuarios
 *     description: Retorna estadísticas agregadas de usuarios incluyendo total de usuarios, usuarios premium, transacciones del día actual y referidos.
 *     tags: [Analytics]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
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
 *                     totalUsers:
 *                       type: integer
 *                       description: Total de usuarios registrados
 *                       example: 1250
 *                     premiumUsers:
 *                       type: integer
 *                       description: Usuarios con suscripción premium
 *                       example: 320
 *                     todayTransactions:
 *                       type: integer
 *                       description: Transacciones realizadas hoy
 *                       example: 45
 *                     referrals:
 *                       type: integer
 *                       description: Referidos (placeholder)
 *                       example: 0
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
 * @route GET /api/stats/users
 * @description Obtiene estadísticas de usuarios
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

    logger.debug('📊 Fetching user stats using Prisma...')

    // Total Users
    const totalUsers = await prisma.usuario.count()

    // Premium Users - check for premium subscription
    const premiumUsers = await prisma.usuario.count({
      where: { 
        OR: [
          { suscripcion: 'premium' },
          { suscripcion: { contains: 'premium', mode: 'insensitive' } }
        ]
      }
    })

    // Today's Transactions - Filtrar por fecha de hoy
    let todayTransactions = 0
    try {
      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
      logger.debug('📅 Filtrando transacciones de hoy:', today)
      
      // Try different date approaches
      const startOfDay = `${today}T00:00:00`
      const endOfDay = `${today}T23:59:59`
      
      // First try with timestamp comparison
      todayTransactions = await prisma.transaccion.count({
        where: {
          fecha: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      })
      
      // Log for debugging
      logger.debug('📅 Filtrando transacciones de:', {
        today,
        startOfDay,
        endOfDay,
        found: todayTransactions
      })
    } catch (error) {
      logger.warn('Tabla transacciones no disponible o error en filtro de fecha:', error)
    }

    // Referrals (placeholder)
    const referrals = 0

    const stats = {
      totalUsers,
      premiumUsers,
      todayTransactions,
      referrals,
    }

    logger.success('📊 Stats calculated with Prisma:', stats)

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error: any) {
    logger.error('💥 API Error fetching user stats:', (error as Error).message)
    return handleError(error, 'Error al obtener estadísticas de usuarios');
  }
}

