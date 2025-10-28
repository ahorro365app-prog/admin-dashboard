import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/whatsapp/events
export async function GET(request: NextRequest) {
  try {
    const limit = request.nextUrl.searchParams.get('limit') || '20';

    const { data: events } = await supabase
      .from('whatsapp_events')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(parseInt(limit));

    return NextResponse.json(events || []);
  } catch (error) {
    console.error('Error fetching WhatsApp events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

// POST /api/whatsapp/events - Crear evento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { error } = await supabase
      .from('whatsapp_events')
      .insert({
        timestamp: body.timestamp || new Date().toISOString(),
        type: body.type,
        user_id: body.user_id || null,
        phone: body.phone || null,
        status: body.status,
        message: body.message,
        details: body.details || {}
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating WhatsApp event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
