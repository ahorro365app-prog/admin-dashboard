import { NextRequest, NextResponse } from 'next/server'
import { processLogin, COOKIE_CONFIG, REFRESH_COOKIE_CONFIG } from '@/lib/supabase-auth'

// Force dynamic rendering - Vercel cache buster
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  console.log('🔐 Real Supabase Login API called')
  
  try {
    const body = await request.json()
    console.log('📦 Request body:', body)
    
    const { email, password } = body

    // Validar datos de entrada
    if (!email || !password) {
      console.log('❌ Missing email or password')
      return NextResponse.json(
        { success: false, message: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    console.log('✅ Validating credentials for:', email)
    
    // Procesar login con Supabase real
    const result = await processLogin({ email, password })
    console.log('🔍 Login result:', result)

    if (!result.success) {
      console.log('❌ Login failed:', result.message)
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 401 }
      )
    }

    console.log('✅ Login successful, setting cookies')
    
    // Crear respuesta exitosa
    const response = NextResponse.json({
      success: true,
      message: 'Login exitoso',
      user: result.user
    })

    // Configurar cookies seguras
    if (result.token) {
      console.log('🍪 Setting admin-token cookie')
      response.cookies.set('admin-token', result.token, COOKIE_CONFIG)
    }

    if (result.refreshToken) {
      console.log('🍪 Setting admin-refresh-token cookie')
      response.cookies.set('admin-refresh-token', result.refreshToken, REFRESH_COOKIE_CONFIG)
    }

    console.log('🎉 Real Supabase Login API completed successfully')
    return response

  } catch (error) {
    console.error('💥 Real Supabase Login API error:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Manejar método no permitido
export async function GET() {
  return NextResponse.json(
    { success: false, message: 'Método no permitido' },
    { status: 405 }
  )
}

