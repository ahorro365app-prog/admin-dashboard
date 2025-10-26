import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Fetching chart data...')
    
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

    console.log('📊 Chart data generated:', {
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
    console.error('💥 Error fetching chart data:', (error as Error).message)
    return NextResponse.json(
      { success: false, message: `Error interno del servidor: ${(error as Error).message}` },
      { status: 500 }
    )
  }
}


