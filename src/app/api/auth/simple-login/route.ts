import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  console.log('🔐 Simple Login API called')
  
  try {
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

    // Configuración de Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Supabase credentials not configured')
      return NextResponse.json({
        success: false,
        message: 'Configuración de Supabase no encontrada'
      }, { status: 500 })
    }

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
        message: 'Usuario administrador no encontrado'
      })
    }

    console.log('✅ Admin user found:', admin.email)

    // Verificar contraseña (comparación directa ya que está en texto plano)
    if (password === admin.password_hash) {
      console.log('✅ Password match')
      
      // Generar token JWT
      const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key-change-in-production'
      const token = jwt.sign(
        { 
          id: admin.id, 
          email: admin.email, 
          role: admin.role 
        }, 
        JWT_SECRET, 
        { expiresIn: '24h' }
      )

      console.log('✅ Token generated')

      // Crear respuesta exitosa
      const response = NextResponse.json({
        success: true,
        message: 'Login exitoso',
        user: {
          id: admin.id,
          email: admin.email,
          role: admin.role
        }
      })

      // Configurar cookie
      response.cookies.set('admin-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
        path: '/'
      })

      console.log('🎉 Login completed successfully')
      return response
      
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
    console.error('💥 Simple Login API error:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    success: false,
    message: 'Use POST method for login'
  }, { status: 405 })
}

