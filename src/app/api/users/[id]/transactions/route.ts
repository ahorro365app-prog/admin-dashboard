import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('📊 Fetching user transactions for:', params.id)
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Obtener transacciones del usuario
    const { data: transactions, error } = await supabase
      .from('transacciones')
      .select('*')
      .eq('usuario_id', params.id)
      .order('fecha', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching transactions:', error.message)
      return NextResponse.json(
        { success: false, message: 'Error obteniendo transacciones' },
        { status: 500 }
      )
    }

    console.log('✅ User transactions fetched:', transactions?.length || 0)

    return NextResponse.json({
      success: true,
      data: transactions || []
    })

  } catch (error: any) {
    console.error('💥 Error fetching user transactions:', error.message)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}






