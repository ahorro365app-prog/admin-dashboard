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

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const status = params.get('status')
    const limit = params.get('limit')
    const offset = params.get('offset')

    const url = new URL('/api/notifications/campaigns', CORE_API_URL)
    if (status) url.searchParams.set('status', status)
    if (limit) url.searchParams.set('limit', limit)
    if (offset) url.searchParams.set('offset', offset)

    const response = await fetch(url.toString(), {
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
            json?.message ||
            text ||
            response.statusText ||
            'No se pudo obtener la lista de campañas',
        },
        { status: response.status }
      )
    }

    return NextResponse.json(json ?? { success: false, message: 'Respuesta vacía del core' })
  } catch (error: any) {
    logger.error('[proxy] Error obteniendo campañas:', error)
    return NextResponse.json(
      { success: false, message: error?.message || 'Error interno en proxy campaigns' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text()
    const response = await fetch(`${CORE_API_URL}/api/notifications/campaigns`, {
      method: 'POST',
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
            json?.message ||
            text ||
            response.statusText ||
            'No se pudo crear la campaña',
        },
        { status: response.status }
      )
    }

    return NextResponse.json(json ?? { success: false, message: 'Respuesta vacía del core' })
  } catch (error: any) {
    logger.error('[proxy] Error creando campaña:', error)
    return NextResponse.json(
      { success: false, message: error?.message || 'Error interno en proxy campaigns' },
      { status: 500 }
    )
  }
}

