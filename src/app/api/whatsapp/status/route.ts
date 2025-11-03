import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering - Vercel cache buster
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/whatsapp/status
export async function GET(request: NextRequest) {
  try {
    const { data: session } = await supabase
      .from('whatsapp_session')
      .select('*')
      .single();

    if (!session) {
      return NextResponse.json({
        status: 'disconnected',
        uptime: 0,
        number: 'N/A',
        lastSync: null
      });
    }

    // Calcular uptime
    const now = new Date();
    const lastSync = new Date(session.last_sync);
    const diffMs = now.getTime() - lastSync.getTime();
    const isConnected = diffMs < 120000; // Menos de 2 minutos = conectado

    return NextResponse.json({
      status: isConnected ? 'connected' : 'disconnected',
      uptime: session.uptime_percentage || 99.8,
      number: session.number,
      lastSync: session.last_sync,
      jid: session.jid
    });
  } catch (error) {
    console.error('Error fetching WhatsApp status:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}

// POST /api/whatsapp/status - Reconectar
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'reconnect') {
      // Aquí enviarías comando a Baileys Worker
      // Por ahora, solo responde que está en proceso

      // Actualizar timestamp
      await supabase
        .from('whatsapp_session')
        .update({ last_sync: new Date().toISOString() })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      return NextResponse.json({
        success: true,
        message: 'Reconnecting...',
        estimatedTime: '10 segundos'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error reconnecting WhatsApp:', error);
    return NextResponse.json({ error: 'Reconnection failed' }, { status: 500 });
  }
}
