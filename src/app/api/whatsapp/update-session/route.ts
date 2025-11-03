import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering - Vercel cache buster
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { number, status, lastSync, uptime, jid } = body;

    // Actualizar o crear sesión en whatsapp_session
    const { data, error } = await supabase
      .from('whatsapp_session')
      .upsert({
        number,
        jid: jid || null,
        status,
        last_sync: lastSync,
        uptime_percentage: uptime || 99.8,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'number'
      });

    if (error) {
      console.error('Error updating session:', error);
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in update-session endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

