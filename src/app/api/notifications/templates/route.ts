import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

const CORE_API_URL =
  process.env.NEXT_PUBLIC_CORE_API_URL?.replace(/\/$/, '') || 'http://localhost:3000'

// Helper para parsear JSON de forma segura
const parseJson = (text: string | null): any => {
  if (!text || !text.trim()) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const response = await fetch(`${CORE_API_URL}/api/notifications/templates`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
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
            'No se pudo obtener templates',
        },
        { status: response.status }
      )
    }

    return NextResponse.json(json ?? { success: false, message: 'Respuesta vacía del core' })
  } catch (error: any) {
    logger.error('[proxy] Error obteniendo templates:', error)
    return NextResponse.json(
      { success: false, message: error?.message || 'Error interno en proxy templates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const response = await fetch(`${CORE_API_URL}/api/notifications/templates`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
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
            'No se pudo crear el template',
        },
        { status: response.status }
      )
    }

    return NextResponse.json(json ?? { success: false, message: 'Respuesta vacía del core' })
  } catch (error: any) {
    logger.error('[proxy] Error creando template:', error)
    return NextResponse.json(
      { success: false, message: error?.message || 'Error interno en proxy templates' },
      { status: 500 }
    )
  }
}




