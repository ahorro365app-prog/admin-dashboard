/**
 * Endpoint proxy para subir imágenes de respuestas rápidas
 * Redirige al backend core-api
 */

import { NextRequest, NextResponse } from 'next/server';

const CORE_API_URL = process.env.NEXT_PUBLIC_CORE_API_URL || 'http://localhost:3002';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const response = await fetch(`${CORE_API_URL}/api/whatsapp/support/quick-replies/upload-image`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Error al subir imagen' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ Error en proxy de subida de imagen:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Error desconocido' },
      { status: 500 }
    );
  }
}

