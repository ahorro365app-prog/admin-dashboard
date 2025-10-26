import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🚪 Logout API called')

    // Crear respuesta exitosa
    const response = NextResponse.json({
      success: true,
      message: 'Logout exitoso'
    })

    // Limpiar cookies
    response.cookies.set('admin-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    })

    response.cookies.set('admin-refresh-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    })

    console.log('✅ Logout completed, cookies cleared')
    return response

  } catch (error) {
    console.error('💥 Logout API error:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    success: false,
    message: 'Use POST method for logout'
  }, { status: 405 })
}

