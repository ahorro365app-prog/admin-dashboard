import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { adminApiRateLimit, getClientIdentifier, checkRateLimit } from '@/lib/rateLimit'
import { handleError } from '@/lib/errorHandler'

// Force dynamic rendering - Vercel cache buster
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * @swagger
 * /api/analytics/overview:
 *   get:
 *     summary: Obtiene resumen general de analytics
 *     description: Retorna métricas generales del sistema incluyendo ingresos totales, usuarios, tasa de conversión, valor promedio de transacciones, top países y top categorías de gastos.
 *     tags: [Analytics]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Resumen de analytics obtenido exitosamente
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
 *                     totalRevenue:
 *                       type: number
 *                       description: Ingresos totales
 *                       example: 150000.50
 *                     totalUsers:
 *                       type: integer
 *                       description: Total de usuarios
 *                       example: 1250
 *                     activeUsers:
 *                       type: integer
 *                       description: Usuarios activos (estimado)
 *                       example: 937
 *                     conversionRate:
 *                       type: number
 *                       description: Tasa de conversión a premium (%)
 *                       example: 25.5
 *                     avgTransactionValue:
 *                       type: number
 *                       description: Valor promedio de transacciones
 *                       example: 120.75
 *                     topCountries:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           pais:
 *                             type: string
 *                           usuarios:
 *                             type: integer
 *                     topCategories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           categoria:
 *                             type: string
 *                           monto:
 *                             type: number
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
 * @route GET /api/analytics/overview
 * @description Obtiene resumen general de analytics
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

    logger.debug('📊 Fetching analytics overview...')

    // Métricas básicas
    const totalUsers = await prisma.usuario.count()
    const premiumUsers = await prisma.usuario.count({
      where: { suscripcion: 'premium' }
    })
    const activeUsers = Math.floor(totalUsers * 0.75) // Simulamos usuarios activos

    // Transacciones
    const totalTransactions = await prisma.transaccion.count()
    const incomeTransactions = await prisma.transaccion.findMany({
      where: { tipo: 'ingreso' },
      select: { monto: true }
    })
    const expenseTransactions = await prisma.transaccion.findMany({
      where: { tipo: 'gasto' },
      select: { monto: true }
    })

    const totalRevenue = (incomeTransactions as any[]).reduce((sum, t) => sum + t.monto, 0)
    const totalExpenses = (expenseTransactions as any[]).reduce((sum, t) => sum + t.monto, 0)
    const avgTransactionValue = totalTransactions > 0 ? (totalRevenue + totalExpenses) / totalTransactions : 0

    // Conversión (simulada)
    const conversionRate = totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) : '0.0'

    // Top países
    const usersByCountry = await prisma.usuario.findMany({
      select: { pais: true }
    })

    const countryStats = (usersByCountry as any[]).reduce((acc, user) => {
      const pais = user.pais || 'Unknown'
      acc[pais] = (acc[pais] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topCountries = Object.entries(countryStats)
      .map(([pais, usuarios]) => ({ pais, usuarios: usuarios as number }))
      .sort((a, b) => b.usuarios - a.usuarios)
      .slice(0, 5)

    // Top categorías de gastos
    const expenseTransactionsForCategories = await prisma.transaccion.findMany({
      where: { tipo: 'gasto' },
      select: { categoria: true, monto: true }
    })

    const categoryStats = (expenseTransactionsForCategories as any[]).reduce((acc, tx) => {
      const categoria = tx.categoria || 'Sin categoría'
      acc[categoria] = (acc[categoria] || 0) + tx.monto
      return acc
    }, {} as Record<string, number>)

    const topCategories = Object.entries(categoryStats)
      .map(([categoria, monto]) => ({ categoria, monto: monto as number }))
      .sort((a, b) => b.monto - a.monto)
      .slice(0, 5)

    const analyticsData = {
      totalRevenue,
      totalUsers,
      activeUsers,
      conversionRate: parseFloat(conversionRate),
      avgTransactionValue,
      topCountries,
      topCategories
    }

    logger.success('📊 Analytics overview generated successfully')

    return NextResponse.json({
      success: true,
      data: analyticsData
    })

  } catch (error: any) {
    logger.error('💥 API Error fetching analytics overview:', error)
    return handleError(error, 'Error al obtener resumen de analytics');
  }
}

