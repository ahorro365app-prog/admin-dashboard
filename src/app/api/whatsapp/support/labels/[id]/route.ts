/**
 * Endpoint proxy para etiquetas específicas
 * Redirige al backend core-api
 */

import { NextRequest, NextResponse } from 'next/server';

const CORE_API_URL = process.env.NEXT_PUBLIC_CORE_API_URL || 'http://localhost:3002';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    
    const response = await fetch(`${CORE_API_URL}/api/whatsapp/support/labels/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Error al actualizar etiqueta' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ Error en proxy de etiquetas:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Error desconocido' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const response = await fetch(`${CORE_API_URL}/api/whatsapp/support/labels/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Error al eliminar etiqueta' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ Error en proxy de etiquetas:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Error desconocido' },
      { status: 500 }
    );
  }
}

