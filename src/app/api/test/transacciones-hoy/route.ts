import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  // ⚠️ ENDPOINT DE TEST - SOLO PARA DESARROLLO
  // Bloquear en producción por seguridad
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Endpoint no disponible en producción' },
      { status: 404 }
    );
  }

  try {
    console.log('🔍 Verificando filtro de transacciones de hoy...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    console.log('📅 Fecha de hoy:', today)

    // Contar todas las transacciones
    const { count: totalTransacciones, error: totalError } = await supabase
      .from('transacciones')
      .select('*', { count: 'exact', head: true })

    if (totalError) {
      console.error('❌ Error contando total transacciones:', (totalError as Error).message)
    }

    // Contar transacciones de hoy
    const { count: transaccionesHoy, error: hoyError } = await supabase
      .from('transacciones')
      .select('*', { count: 'exact', head: true })
      .gte('fecha', `${today}T00:00:00`)
      .lte('fecha', `${today}T23:59:59`)

    if (hoyError) {
      console.error('❌ Error contando transacciones de hoy:', (hoyError as Error).message)
    }

    // Obtener algunas transacciones de hoy para verificar
    const { data: transaccionesHoyData, error: dataError } = await supabase
      .from('transacciones')
      .select('id, fecha, tipo, monto')
      .gte('fecha', `${today}T00:00:00`)
      .lte('fecha', `${today}T23:59:59`)
      .limit(5)

    if (dataError) {
      console.error('❌ Error obteniendo transacciones de hoy:', (dataError as Error).message)
    }

    console.log('📊 Resultados:', {
      totalTransacciones: totalTransacciones || 0,
      transaccionesHoy: transaccionesHoy || 0,
      muestraTransaccionesHoy: transaccionesHoyData?.length || 0
    })

    return NextResponse.json({
      success: true,
      message: '✅ Filtro de transacciones verificado',
      data: {
        fechaHoy: today,
        totalTransacciones: totalTransacciones || 0,
        transaccionesHoy: transaccionesHoy || 0,
        muestraTransaccionesHoy: transaccionesHoyData || [],
        filtroFuncionando: (transaccionesHoy || 0) < (totalTransacciones || 0)
      }
    })

  } catch (error: any) {
    console.error('❌ Error:', (error as Error).message)
    
    return NextResponse.json({
      success: false,
      message: 'Error: ' + (error as Error).message,
      error: (error as Error).message
    }, { status: 500 })
  }
}

