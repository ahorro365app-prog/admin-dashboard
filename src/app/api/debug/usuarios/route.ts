import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug: Checking usuarios table specifically...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verificar tabla usuarios
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('*')
      .limit(10)

    console.log('👥 Usuarios query result:', { usuarios, error: usuariosError })

    return NextResponse.json({
      success: true,
      message: 'Usuarios table check completed',
      data: {
        usuarios: {
          count: usuarios?.length || 0,
          data: usuarios,
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





