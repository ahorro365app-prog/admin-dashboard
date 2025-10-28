import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Obtener token de las cookies
    const token = request.cookies.get('admin-token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token no encontrado' },
        { status: 401 }
      )
    }

    // Verificar token
    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Token inválido' },
        { status: 401 }
      )
    }

    // Token válido
    return NextResponse.json({
      success: true,
      message: 'Token válido',
      user: {
        email: payload.email,
        role: payload.role
      }
    })

  } catch (error) {
    console.error('Verify API error:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Manejar método no permitido
export async function POST() {
  return NextResponse.json(
    { success: false, message: 'Método no permitido' },
    { status: 405 }
  )
}





