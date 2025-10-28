import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Verificar conexión a Supabase
    const { error } = await supabase.from('whatsapp_session').select('id').limit(1);
    const supabaseOk = !error;

    // Estado básico de Baileys usando last_sync
    const { data: session } = await supabase
      .from('whatsapp_session')
      .select('last_sync')
      .single();

    const lastSync = session?.last_sync ? new Date(session.last_sync) : null;
    const now = new Date();
    const isConnected = lastSync ? (now.getTime() - lastSync.getTime()) < 120000 : false;

    return NextResponse.json({
      baileys: { status: isConnected ? 'ok' : 'degraded', lastSync: session?.last_sync || null },
      supabase: { status: supabaseOk ? 'ok' : 'error' },
      backend: { status: 'ok', time: now.toISOString() },
    });
  } catch (e) {
    return NextResponse.json({
      baileys: { status: 'error' },
      supabase: { status: 'error' },
      backend: { status: 'error' },
    }, { status: 500 });
  }
}
