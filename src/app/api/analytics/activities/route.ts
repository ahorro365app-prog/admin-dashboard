import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering - Vercel cache buster
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Fetching recent activities...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const activities: any[] = []

    // Obtener transacciones recientes
    const { data: transacciones, error: transError } = await supabase
      .from('transacciones')
      .select(`
        id,
        tipo,
        monto,
        fecha,
        usuarios!inner(nombre)
      `)
      .order('fecha', { ascending: false })
      .limit(10)

    if (!transError && transacciones) {
      transacciones.forEach(trans => {
        activities.push({
          id: `trans-${trans.id}`,
          type: 'transaction',
          description: `${trans.tipo === 'gasto' ? 'Gasto' : 'Ingreso'} de $${trans.monto}`,
          user: (trans as any).usuarios?.nombre || 'Usuario desconocido',
          timestamp: trans.fecha,
          amount: trans.monto,
          status: 'success'
        })
      })
    }

    // Obtener usuarios recientes (simulando registros)
    const { data: usuarios, error: usersError } = await supabase
      .from('usuarios')
      .select('id, nombre, suscripcion')
      .order('id', { ascending: false })
      .limit(5)

    if (!usersError && usuarios) {
      usuarios.forEach(user => {
        activities.push({
          id: `user-${user.id}`,
          type: 'user_registration',
          description: `Nuevo usuario registrado`,
          user: user.nombre,
          timestamp: new Date().toISOString(), // Simulamos timestamp reciente
          status: 'success'
        })

        if (user.suscripcion === 'premium') {
          activities.push({
            id: `sub-${user.id}`,
            type: 'subscription',
            description: `Actualización a Premium`,
            user: user.nombre,
            timestamp: new Date().toISOString(),
            status: 'success'
          })
        }
      })
    }

    // Ordenar por timestamp (más recientes primero)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Limitar a 15 actividades
    const recentActivities = activities.slice(0, 15)

    console.log('📋 Recent activities generated:', recentActivities.length)

    return NextResponse.json({
      success: true,
      data: recentActivities
    })

  } catch (error: any) {
    console.error('💥 Error fetching activities:', (error as Error).message)
    return NextResponse.json(
      { success: false, message: `Error interno del servidor: ${(error as Error).message}` },
      { status: 500 }
    )
  }
}

