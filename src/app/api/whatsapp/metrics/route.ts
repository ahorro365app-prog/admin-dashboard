import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/whatsapp/metrics
export async function GET(request: NextRequest) {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: metrics } = await supabase
      .from('whatsapp_metrics')
      .select('*')
      .eq('date', today)
      .single();

    if (!metrics) {
      return NextResponse.json({
        audios: 0,
        successRate: 0,
        errors: 0,
        transactions: 0,
        totalAmount: 0
      });
    }

    const successRate = metrics.audios_count > 0 
      ? Math.round((metrics.success_count / metrics.audios_count) * 100)
      : 0;

    return NextResponse.json({
      audios: metrics.audios_count,
      successRate,
      errors: metrics.error_count,
      transactions: metrics.transactions_count,
      totalAmount: metrics.total_amount
    });
  } catch (error) {
    console.error('Error fetching WhatsApp metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}

// POST /api/whatsapp/metrics - Actualizar métricas
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const today = new Date().toISOString().split('T')[0];

    // Verificar si existe registro de hoy
    const { data: existing } = await supabase
      .from('whatsapp_metrics')
      .select('*')
      .eq('date', today)
      .single();

    if (existing) {
      // Actualizar
      const { error } = await supabase
        .from('whatsapp_metrics')
        .update({
          audios_count: body.audios_count ?? existing.audios_count,
          success_count: body.success_count ?? existing.success_count,
          error_count: body.error_count ?? existing.error_count,
          transactions_count: body.transactions_count ?? existing.transactions_count,
          total_amount: body.total_amount ?? existing.total_amount
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Crear nuevo
      const { error } = await supabase
        .from('whatsapp_metrics')
        .insert({
          date: today,
          audios_count: body.audios_count || 0,
          success_count: body.success_count || 0,
          error_count: body.error_count || 0,
          transactions_count: body.transactions_count || 0,
          total_amount: body.total_amount || 0
        });

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating WhatsApp metrics:', error);
    return NextResponse.json({ error: 'Failed to update metrics' }, { status: 500 });
  }
}
