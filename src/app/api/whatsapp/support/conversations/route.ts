import { NextRequest, NextResponse } from 'next/server';

const CORE_API_URL = process.env.NEXT_PUBLIC_CORE_API_URL || 'http://localhost:3002';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';

    const url = new URL(`${CORE_API_URL}/api/whatsapp/support/conversations`);
    url.searchParams.set('limit', limit);
    url.searchParams.set('offset', offset);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error en core-api:', response.status, errorText);
      return NextResponse.json(
        { success: false, error: `Error del servidor: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ Error en /api/whatsapp/support/conversations:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener conversaciones' },
      { status: 500 }
    );
  }
}

