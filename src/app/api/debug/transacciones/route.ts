import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug: Analizando campos de fecha en transacciones...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Obtener una muestra de transacciones con todos los campos
    const { data: transacciones, error } = await supabase
      .from('transacciones')
      .select('*')
      .limit(2)

    if (error) {
      console.error('❌ Error fetching transacciones:', (error as Error).message)
      return NextResponse.json({
        success: false,
        message: 'Error fetching transacciones: ' + (error as Error).message
      }, { status: 500 })
    }

    // Analizar qué campos podrían ser de fecha
    const camposPosiblesFecha = ['fecha', 'date', 'created_at', 'updated_at', 'timestamp']
    const camposEncontrados = transacciones?.[0] ? Object.keys(transacciones[0]) : []
    const camposFechaEncontrados = camposEncontrados.filter(campo => 
      camposPosiblesFecha.some(posible => campo.toLowerCase().includes(posible.toLowerCase()))
    )

    console.log('📅 Campos de fecha encontrados:', camposFechaEncontrados)
    console.log('📊 Muestra de transacciones:', transacciones)

    return NextResponse.json({
      success: true,
      message: '✅ Análisis de campos de fecha completado',
      data: {
        todosLosCampos: camposEncontrados,
        camposFechaEncontrados,
        muestraTransacciones: transacciones,
        camposPosiblesFecha
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

