/**
 * Endpoint proxy para respuestas rápidas
 * Redirige al backend core-api
 */

import { NextRequest, NextResponse } from 'next/server';

const CORE_API_URL = process.env.NEXT_PUBLIC_CORE_API_URL || 'http://localhost:3002';

export async function GET(req: NextRequest) {
  try {
    const response = await fetch(`${CORE_API_URL}/api/whatsapp/support/quick-replies`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Error al obtener respuestas rápidas' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ Error en proxy de respuestas rápidas:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Error desconocido' },
      { status: 500 }
    );
  }
}

