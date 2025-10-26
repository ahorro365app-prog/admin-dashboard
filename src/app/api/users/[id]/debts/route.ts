import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('💳 Fetching user debts for:', params.id)
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Obtener deudas del usuario
    const { data: debts, error } = await supabase
      .from('deudas')
      .select('*')
      .eq('usuario_id', params.id)
      .order('fecha_creacion', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching debts:', error.message)
      return NextResponse.json(
        { success: false, message: 'Error obteniendo deudas' },
        { status: 500 }
      )
    }

    console.log('✅ User debts fetched:', debts?.length || 0)

    return NextResponse.json({
      success: true,
      data: debts || []
    })

  } catch (error: any) {
    console.error('💥 Error fetching user debts:', error.message)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

