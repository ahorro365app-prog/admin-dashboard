import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Forzar renderizado dinámico - Vercel cache fix
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const period = request.nextUrl.searchParams.get('period') || '7d'
    
    console.log('📊 Fetching advanced charts data for period:', period)

    // Calcular fechas según el período
    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
    }

    // Transacciones por día (últimos 7 días) - Simulado por ahora
    const transactions7Days = [
      { name: 'Lun', gastos: 150, ingresos: 200, neto: 50 },
      { name: 'Mar', gastos: 200, ingresos: 300, neto: 100 },
      { name: 'Mié', gastos: 180, ingresos: 250, neto: 70 },
      { name: 'Jue', gastos: 220, ingresos: 180, neto: -40 },
      { name: 'Vie', gastos: 300, ingresos: 400, neto: 100 },
      { name: 'Sáb', gastos: 250, ingresos: 350, neto: 100 },
      { name: 'Dom', gastos: 120, ingresos: 280, neto: 160 }
    ]

    // Nuevos usuarios por mes (últimos 6 meses)
    const newUsers6Months = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      
      const monthUsers = await prisma.usuario.findMany({
        where: {
          // Simulamos fecha de creación ya que no existe en la tabla
        },
        take: Math.floor(Math.random() * 50) + 10 // Simulamos datos
      })

      const premiumUsers = (monthUsers as any[]).filter(u => u.suscripcion === 'premium').length

      newUsers6Months.push({
        name: date.toLocaleDateString('es-ES', { month: 'short' }),
        usuarios: monthUsers.length,
        premium: premiumUsers
      })
    }

    // Distribución de suscripciones
    const totalUsers = await prisma.usuario.count()
    const premiumUsers = await prisma.usuario.count({
      where: { suscripcion: 'premium' }
    })
    const freeUsers = totalUsers - premiumUsers

    const subscriptionDistribution = [
      { name: 'Free', value: freeUsers, color: '#6B7280' },
      { name: 'Premium', value: premiumUsers, color: '#F59E0B' }
    ]

    // Ingresos por país
    const usersByCountry = await prisma.usuario.findMany({
      select: { pais: true }
    })

    const countryStats = (usersByCountry as any[]).reduce((acc, user) => {
      const pais = user.pais || 'Unknown'
      if (!acc[pais]) {
        acc[pais] = { usuarios: 0, ingresos: 0 }
      }
      acc[pais].usuarios++
      acc[pais].ingresos += Math.floor(Math.random() * 1000) + 100 // Simulamos ingresos
      return acc
    }, {} as Record<string, { usuarios: number; ingresos: number }>)

    const revenueByCountry = Object.entries(countryStats)
      .map(([pais, stats]) => ({ pais, ...(stats as any) }))
      .sort((a, b) => b.ingresos - a.ingresos)
      .slice(0, 10)

    // Gastos por categoría
    const transactions = await prisma.transaccion.findMany({
      where: { tipo: 'gasto' },
      select: { categoria: true, monto: true }
    })

    const categoryStats = (transactions as any[]).reduce((acc, tx) => {
      const categoria = tx.categoria || 'Sin categoría'
      if (!acc[categoria]) {
        acc[categoria] = { monto: 0, transacciones: 0 }
      }
      acc[categoria].monto += tx.monto
      acc[categoria].transacciones++
      return acc
    }, {} as Record<string, { monto: number; transacciones: number }>)

    const categorySpending = Object.entries(categoryStats)
      .map(([categoria, stats]) => ({ categoria, ...(stats as any) }))
      .sort((a, b) => b.monto - a.monto)
      .slice(0, 8)

    // Crecimiento mensual (simulado)
    const monthlyGrowth = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      
      monthlyGrowth.push({
        mes: date.toLocaleDateString('es-ES', { month: 'short' }),
        usuarios: Math.floor(Math.random() * 100) + 50,
        ingresos: Math.floor(Math.random() * 5000) + 2000,
        gastos: Math.floor(Math.random() * 3000) + 1000
      })
    }

    const chartData = {
      transactions7Days,
      newUsers6Months,
      subscriptionDistribution,
      revenueByCountry,
      categorySpending,
      monthlyGrowth
    }

    console.log('📊 Advanced charts data generated successfully')

    return NextResponse.json({
      success: true,
      data: chartData
    })

  } catch (error: any) {
    console.error('💥 API Error fetching advanced charts:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor', error: (error as Error).message },
      { status: 500 }
    )
  }
}

