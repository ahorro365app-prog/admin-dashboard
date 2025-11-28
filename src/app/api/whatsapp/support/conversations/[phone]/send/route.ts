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

    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'El mensaje no puede estar vacío' },
        { status: 400 }
      );
    }

    const url = `${CORE_API_URL}/api/whatsapp/support/conversations/${encodeURIComponent(phone)}/send`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: `Error del servidor: ${response.status}` };
      }
      
      console.error('❌ Error en core-api:', response.status, errorData);
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.error || `Error del servidor: ${response.status}`,
          errorCode: errorData.errorCode,
          errorType: errorData.errorType
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ Error en /api/whatsapp/support/conversations/[phone]/send:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al enviar mensaje' },
      { status: 500 }
    );
  }
}

