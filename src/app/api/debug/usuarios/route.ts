import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sanitizeDebugData, logDebugAccess } from '@/lib/debug-sanitizer'

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
    logDebugAccess('/api/debug/usuarios', request);
    
    console.log('🔍 Debug: Checking usuarios table specifically...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verificar tabla usuarios
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('*')
      .limit(10)

    // Sanitizar datos antes de retornar
    const sanitizedUsuarios = sanitizeDebugData(usuarios);
    
    console.log('👥 Usuarios query result:', { 
      count: sanitizedUsuarios?.length || 0, 
      error: usuariosError?.message 
    })

    return NextResponse.json({
      success: true,
      message: 'Usuarios table check completed',
      data: {
        usuarios: {
          count: sanitizedUsuarios?.length || 0,
          data: sanitizedUsuarios,
          error: usuariosError?.message
        }
      }
    })

  } catch (error: any) {
    console.error('💥 Debug error:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno: ' + (error as Error).message },
      { status: 500 }
    )
  }
}







