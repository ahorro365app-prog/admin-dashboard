import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug Login: Starting...')
    
    const body = await request.json()
    console.log('📦 Request body:', body)
    
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: 'Email y contraseña son requeridos'
      }, { status: 400 })
    }

    console.log('🔍 Validating credentials for:', email)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Buscar el usuario administrador
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .eq('role', 'admin')
      .single()

    if (error) {
      console.log('❌ Error finding admin user:', (error as Error).message)
      return NextResponse.json({
        success: false,
        message: 'Error finding admin user: ' + (error as Error).message
      })
    }

    if (!admin) {
      console.log('❌ Admin user not found')
      return NextResponse.json({
        success: false,
        message: 'Admin user not found'
      })
    }

    console.log('✅ Admin user found:', admin.email)

    // Verificar contraseña
    if (password === admin.password_hash) {
      console.log('✅ Password match')
      
      return NextResponse.json({
        success: true,
        message: 'Login exitoso',
        user: {
          id: admin.id,
          email: admin.email,
          role: admin.role
        }
      })
    } else {
      console.log('❌ Password mismatch')
      console.log('Expected:', admin.password_hash)
      console.log('Received:', password)
      return NextResponse.json({
        success: false,
        message: 'Contraseña incorrecta'
      })
    }

  } catch (error) {
    console.error('💥 Debug Login error:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno: ' + (error as Error).message },
      { status: 500 }
    )
  }
}



