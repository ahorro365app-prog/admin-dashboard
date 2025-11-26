import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sanitizeDebugData, logDebugAccess } from '@/lib/debug-sanitizer'

// Force dynamic rendering - Vercel cache buster
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // ⚠️ ENDPOINT DE DEBUG - SOLO PARA DESARROLLO
  // Bloquear en producción por seguridad
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Endpoint no disponible en producción' },
      { status: 404 }
    );
  }

  try {
    // Logging de acceso
    logDebugAccess('/api/debug/transacciones', request);
    
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

    // Sanitizar datos antes de retornar
    const sanitizedTransacciones = sanitizeDebugData(transacciones);
    
    console.log('📅 Campos de fecha encontrados:', camposFechaEncontrados)
    console.log('📊 Muestra de transacciones (sanitizada):', {
      count: sanitizedTransacciones?.length || 0,
      campos: camposEncontrados
    })

    return NextResponse.json({
      success: true,
      message: '✅ Análisis de campos de fecha completado',
      data: {
        todosLosCampos: camposEncontrados,
        camposFechaEncontrados,
        muestraTransacciones: sanitizedTransacciones,
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

