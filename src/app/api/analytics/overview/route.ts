import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Fetching analytics overview...')

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

    console.log('📊 Analytics overview generated successfully')

    return NextResponse.json({
      success: true,
      data: analyticsData
    })

  } catch (error: any) {
    console.error('💥 API Error fetching analytics overview:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor', error: (error as Error).message },
      { status: 500 }
    )
  }
}

