import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = Number(searchParams.get('limit') || 20);

  const status = searchParams.get('status');
  const detailed = searchParams.get('detailed') === 'true';

  const baseSelect =
    'id, user_id, type, title, body, status, sent_at, error_message';
  const detailedSelect =
    'id, user_id, type, title, body, status, sent_at, delivered_at, opened_at, clicked_at, dismissed_at, last_event_at, error_message, filters, data';

  let selectColumns = detailed ? detailedSelect : baseSelect;

  let query = supabase
    .from('notification_logs')
    .select(selectColumns)
    .order('sent_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', status);
  }

  let { data, error } = await query;

  if (error && detailed && /column.*does not exist/i.test(error.message || '')) {
    selectColumns = baseSelect;
    query = supabase
      .from('notification_logs')
      .select(selectColumns)
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    ({ data, error } = await query);
  }

  if (error) {
    logger.error('Error fetching notification logs:', error);
    return NextResponse.json(
      { success: false, message: 'Error obteniendo historial' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: data || [] });
}



