import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering - Vercel cache buster
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BAILEYS_WORKER_URL = process.env.NEXT_PUBLIC_BAILEYS_WORKER_URL || 'http://localhost:3004';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'disconnect') {
      // 1. Llamar al worker para desconectar
      const workerResponse = await fetch(`${BAILEYS_WORKER_URL}/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!workerResponse.ok) {
        throw new Error('Failed to disconnect from worker');
      }

      // 2. Limpiar sesión en Supabase
      await supabase
        .from('whatsapp_session')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      return NextResponse.json({
        success: true,
        message: 'Desconectado exitosamente. Recarga la página para ver el QR.'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error disconnecting WhatsApp:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to disconnect',
      details: error.message 
    }, { status: 500 });
  }
}

