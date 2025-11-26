import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

const CORE_API_URL =
  process.env.NEXT_PUBLIC_CORE_API_URL?.replace(/\/$/, '') || 'http://localhost:3000'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) {
      return auth
    }

    const response = await fetch(`${CORE_API_URL}/api/admin/app-versions`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    const text = await response.text()

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: `Error ${response.status}: ${
            text || response.statusText || 'No se pudieron obtener las versiones'
          }`,
        },
        { status: response.status }
      )
    }

    return NextResponse.json(text ? JSON.parse(text) : { success: false, message: 'Respuesta vacía del core' })
  } catch (error: any) {
    console.error('[proxy] Error obteniendo versiones:', error)
    return NextResponse.json(
      { success: false, message: error?.message || 'Error interno en proxy app-versions' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticación
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) {
      return auth
    }

    const body = await request.json()

    const response = await fetch(`${CORE_API_URL}/api/admin/app-versions`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      body: JSON.stringify(body),
    })

    const text = await response.text()

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: `Error ${response.status}: ${
            text || response.statusText || 'No se pudo actualizar la versión'
          }`,
        },
        { status: response.status }
      )
    }

    return NextResponse.json(text ? JSON.parse(text) : { success: false, message: 'Respuesta vacía del core' })
  } catch (error: any) {
    console.error('[proxy] Error actualizando versión:', error)
    return NextResponse.json(
      { success: false, message: error?.message || 'Error interno en proxy app-versions' },
      { status: 500 }
    )
  }
}

