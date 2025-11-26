import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

const CORE_API_URL =
  process.env.NEXT_PUBLIC_CORE_API_URL?.replace(/\/$/, '') || 'http://localhost:3000'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const response = await fetch(`${CORE_API_URL}/api/notifications/send`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const text = await response.text()
    let data: any = null
    try {
      data = text ? JSON.parse(text) : null
    } catch (parseError) {
      data = null
    }

    if (!response.ok) {
      const message =
        data?.message ||
        (typeof text === 'string' && text.trim().startsWith('<') ? response.statusText : text) ||
        'Error en el core'

      return NextResponse.json(
        { success: false, message, details: data?.details },
        { status: response.status }
      )
    }

    return NextResponse.json(
      data ?? { success: false, message: 'Respuesta vacía del core' },
      { status: response.status }
    )
  } catch (error: any) {
    logger.error('[proxy] Error en envío de notificaciones:', error)
    return NextResponse.json(
      { success: false, message: error?.message || 'Error interno en proxy notifications' },
      { status: 500 }
    )
  }
}


