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
    const response = await fetch(`${CORE_API_URL}/api/notifications/triggers`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      cache: 'no-store',
    })

    const text = await response.text()
    const json = parseJson(text)

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: json?.message || text || 'No se pudo obtener el estado de triggers',
        },
        { status: response.status }
      )
    }

    return NextResponse.json(json ?? { success: false, message: 'Respuesta vacía del core' })
  } catch (error: any) {
    logger.error('[proxy] Error obteniendo triggers:', error)
    return NextResponse.json(
      { success: false, message: error?.message || 'Error interno en proxy triggers' },
      { status: 500 }
    )
  }
}






