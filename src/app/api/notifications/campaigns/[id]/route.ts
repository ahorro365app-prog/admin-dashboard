import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

const CORE_API_URL =
  process.env.NEXT_PUBLIC_CORE_API_URL?.replace(/\/$/, '') || 'http://localhost:3000'

const parseJson = (text: string | null) => {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const response = await fetch(`${CORE_API_URL}/api/notifications/campaigns/${params.id}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    const text = await response.text()
    const json = parseJson(text)

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            json?.message || text || response.statusText || 'No se pudo obtener la campaña',
        },
        { status: response.status }
      )
    }

    return NextResponse.json(json ?? { success: false, message: 'Respuesta vacía del core' })
  } catch (error: any) {
    logger.error('[proxy] Error obteniendo campaña:', error)
    return NextResponse.json(
      { success: false, message: error?.message || 'Error interno en proxy campaigns' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = await request.text()
    const response = await fetch(`${CORE_API_URL}/api/notifications/campaigns/${params.id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload,
      cache: 'no-store',
    })

    const text = await response.text()
    const json = parseJson(text)

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            json?.message || text || response.statusText || 'No se pudo actualizar la campaña',
        },
        { status: response.status }
      )
    }

    return NextResponse.json(json ?? { success: false, message: 'Respuesta vacía del core' })
  } catch (error: any) {
    logger.error('[proxy] Error actualizando campaña:', error)
    return NextResponse.json(
      { success: false, message: error?.message || 'Error interno en proxy campaigns' },
      { status: 500 }
    )
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const response = await fetch(`${CORE_API_URL}/api/notifications/campaigns/${params.id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    const text = await response.text()
    const json = parseJson(text)

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            json?.message || text || response.statusText || 'No se pudo cancelar la campaña',
        },
        { status: response.status }
      )
    }

    return NextResponse.json(json ?? { success: false, message: 'Respuesta vacía del core' })
  } catch (error: any) {
    logger.error('[proxy] Error cancelando campaña:', error)
    return NextResponse.json(
      { success: false, message: error?.message || 'Error interno en proxy campaigns' },
      { status: 500 }
    )
  }
}

