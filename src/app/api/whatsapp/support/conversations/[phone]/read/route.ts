import { NextRequest, NextResponse } from 'next/server';

const CORE_API_URL = process.env.NEXT_PUBLIC_CORE_API_URL || 'http://localhost:3002';

export async function POST(
  request: NextRequest,
  { params }: { params: { phone: string } }
) {
  try {
    const phone = params.phone;
    
    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Número de teléfono requerido' },
        { status: 400 }
      );
    }

    const url = `${CORE_API_URL}/api/whatsapp/support/conversations/${encodeURIComponent(phone)}/read`;

    const response = await fetch(url, {
      method: 'POST',
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
    console.error('❌ Error en /api/whatsapp/support/conversations/[phone]/read:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al marcar como leída' },
      { status: 500 }
    );
  }
}

