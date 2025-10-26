import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Forzar renderizado dinámico - VERCEL CACHE BUSTER v2
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // Usar nextUrl en lugar de request.url
    const period = request.nextUrl.searchParams.get('period') || '7d'
    
    console.log('📊 Fetching charts v2 data for period:', period)

    // Datos simulados para evitar problemas de base de datos
    const transactions7Days = [
      { name: 'Lun', gastos: 150, ingresos: 200, neto: 50 },
      { name: 'Mar', gastos: 200, ingresos: 300, neto: 100 },
      { name: 'Mié', gastos: 180, ingresos: 250, neto: 70 },
      { name: 'Jue', gastos: 220, ingresos: 180, neto: -40 },
      { name: 'Vie', gastos: 300, ingresos: 400, neto: 100 },
      { name: 'Sáb', gastos: 250, ingresos: 350, neto: 100 },
      { name: 'Dom', gastos: 120, ingresos: 280, neto: 160 }
    ]

    const newUsers6Months = [
      { name: 'May', usuarios: 25, premium: 5 },
      { name: 'Jun', usuarios: 30, premium: 8 },
      { name: 'Jul', usuarios: 35, premium: 10 },
      { name: 'Ago', usuarios: 40, premium: 12 },
      { name: 'Sep', usuarios: 45, premium: 15 },
      { name: 'Oct', usuarios: 50, premium: 18 }
    ]

    const subscriptionDistribution = [
      { name: 'Free', value: 150, color: '#6B7280' },
      { name: 'Premium', value: 50, color: '#F59E0B' }
    ]

    const revenueByCountry = [
      { pais: 'Bolivia', usuarios: 80, ingresos: 5000 },
      { pais: 'Perú', usuarios: 60, ingresos: 4000 },
      { pais: 'Chile', usuarios: 40, ingresos: 3000 },
      { pais: 'Argentina', usuarios: 20, ingresos: 2000 }
    ]

    const categorySpending = [
      { categoria: 'Alimentación', monto: 2500, transacciones: 45 },
      { categoria: 'Transporte', monto: 1800, transacciones: 30 },
      { categoria: 'Entretenimiento', monto: 1200, transacciones: 25 },
      { categoria: 'Salud', monto: 900, transacciones: 15 }
    ]

    const monthlyGrowth = [
      { mes: 'Ene', usuarios: 50, ingresos: 2000, gastos: 1500 },
      { mes: 'Feb', usuarios: 55, ingresos: 2200, gastos: 1600 },
      { mes: 'Mar', usuarios: 60, ingresos: 2400, gastos: 1700 },
      { mes: 'Abr', usuarios: 65, ingresos: 2600, gastos: 1800 },
      { mes: 'May', usuarios: 70, ingresos: 2800, gastos: 1900 },
      { mes: 'Jun', usuarios: 75, ingresos: 3000, gastos: 2000 }
    ]

    const chartData = {
      transactions7Days,
      newUsers6Months,
      subscriptionDistribution,
      revenueByCountry,
      categorySpending,
      monthlyGrowth
    }

    console.log('📊 Charts v2 data generated successfully')

    return NextResponse.json({
      success: true,
      data: chartData
    })

  } catch (error: any) {
    console.error('💥 API Error fetching charts v2:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor', error: (error as Error).message },
      { status: 500 }
    )
  }
}
