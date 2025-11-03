import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    // Verificar CRON_SECRET
    const authHeader = req.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    
    if (authHeader !== expectedAuth) {
      console.log('❌ CRON_SECRET inválido');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🕐 Iniciando cron: confirm-expired');

    // ============================================================
    // OBTENER CONFIRMACIONES EXPIRADAS
    // ============================================================
    const { data: expired, error: selectError } = await supabase
      .from('pending_confirmations')
      .select('*')
      .lt('expires_at', new Date().toISOString())
      .is('confirmed', null);

    if (selectError) {
      console.error('❌ Error obteniendo expiradas:', selectError);
      return NextResponse.json(
        { success: false, error: selectError.message },
        { status: 500 }
      );
    }

    if (!expired || expired.length === 0) {
      console.log('ℹ️ Sin confirmaciones expiradas');
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'Sin confirmaciones expiradas'
      });
    }

    console.log(`⏰ Encontradas ${expired.length} confirmaciones expiradas`);

    // ============================================================
    // PROCESAR CADA EXPIRADA
    // ============================================================
    let processed = 0;
    let errors = 0;

    for (const exp of expired) {
      try {
        // Obtener predicción completa
        const { data: prediction } = await supabase
          .from('predicciones_groq')
          .select('resultado, usuario_id, original_timestamp')
          .eq('id', exp.prediction_id)
          .single();

        if (!prediction) {
          console.warn(`⚠️ Predicción no encontrada: ${exp.prediction_id}`);
          errors++;
          continue;
        }

        // Actualizar predicción (confirmado_por='timeout')
        await supabase
          .from('predicciones_groq')
          .update({
            confirmado: true,
            confirmado_por: 'timeout',
            updated_at: new Date().toISOString()
          })
          .eq('id', exp.prediction_id);

        // Crear transacción con timestamp original
        if (prediction?.resultado) {
          await supabase
            .from('transacciones')
            .insert({
              usuario_id: prediction.usuario_id,
              tipo: prediction.resultado?.tipo || 'gasto',
              monto: prediction.resultado?.monto,
              categoria: prediction.resultado?.categoria,
              descripcion: prediction.resultado?.descripcion,
              fecha: prediction.original_timestamp, // ← TIMESTAMP ORIGINAL
              metodo_pago: prediction.resultado?.metodoPago,
              moneda: prediction.resultado?.moneda || 'BOB'
            });
          
          console.log(`✅ Transacción creada (timeout): ${prediction.original_timestamp}`);
        }

        // Marcar confirmación como completada
        await supabase
          .from('pending_confirmations')
          .update({
            confirmed: true,
            confirmed_at: new Date().toISOString()
          })
          .eq('id', exp.id);

        console.log(`✅ Auto-guardada (TIMEOUT 30min): ${exp.prediction_id}`);
        processed++;

      } catch (err) {
        console.error(`❌ Error procesando ${exp.prediction_id}:`, err);
        errors++;
      }
    }

    console.log(`
🎉 CRON COMPLETADO:
   - Procesadas: ${processed}
   - Errores: ${errors}
   - Total: ${processed + errors}
    `);

    return NextResponse.json({
      success: true,
      processed,
      errors,
      message: `Procesadas ${processed} confirmaciones expiradas`
    });

  } catch (error: any) {
    console.error('❌ Error crítico en cron:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

