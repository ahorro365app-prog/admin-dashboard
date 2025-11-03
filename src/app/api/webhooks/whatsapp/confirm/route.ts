import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseConfirmation } from '@/lib/parseConfirmation';
import { calculateWeightedAccuracy } from '@/lib/calculateWeightedAccuracy';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Procesa confirmaciones de WhatsApp (sí/ok/perfecto/está bien)
 * Actualiza predicciones_groq.confirmado = true
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prediction_id, phone_number, message } = body;

    console.log(`📝 Confirmación recibida: "${message}"`);

    // ============================================================
    // OBTENER USUARIO Y PAÍS
    // ============================================================
    const phoneNumber = phone_number?.replace('@s.whatsapp.net', '') || phone_number;
    const { data: user } = await supabase
      .from('usuarios')
      .select('id, country_code')
      .eq('telefono', phoneNumber)
      .single();

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'user not found'
      }, { status: 404 });
    }

    const usuario_id = user.id;
    const country_code = user.country_code || 'BOL';

    console.log(`✅ Usuario: ${usuario_id}, País: ${country_code}`);

    // ============================================================
    // PARSEAR CONFIRMACIÓN
    // ============================================================
    const { type, confidence } = parseConfirmation(message);
    console.log(`📊 Tipo: ${type}, Confianza: ${confidence}`);

    // Si no es confirmación positiva, rechazar
    if (type !== 'confirm') {
      console.log('⚠️ No es confirmación positiva');
      return NextResponse.json({
        success: false,
        error: 'Respuesta no entendida',
        suggestion: 'Responde: sí, ok, perfecto, está bien'
      }, { status: 400 });
    }

    // ============================================================
    // OBTENER PREDICCIÓN (usar prediction_id si viene, sino la más reciente)
    // ============================================================
    let prediction_id_to_use = prediction_id;
    
    // Si no viene prediction_id, obtener la transacción pendiente más reciente
    if (!prediction_id_to_use) {
      console.log('🔍 No hay prediction_id, buscando transacción pendiente más reciente...');
      const { data: pendingConf } = await supabase
        .from('pending_confirmations')
        .select('prediction_id')
        .eq('usuario_id', usuario_id)
        .is('confirmed', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!pendingConf) {
        return NextResponse.json({
          success: false,
          message: '❌ No hay ninguna transacción pendiente para confirmar'
        }, { status: 404 });
      }

      prediction_id_to_use = pendingConf.prediction_id;
      console.log(`✅ Transacción pendiente encontrada: ${prediction_id_to_use}`);
    }

    const { data: prediction } = await supabase
      .from('predicciones_groq')
      .select('resultado, original_timestamp, id')
      .eq('id', prediction_id_to_use)
      .single();

    if (!prediction) {
      return NextResponse.json({
        success: false,
        error: 'Predicción no encontrada'
      }, { status: 404 });
    }

    // ============================================================
    // ACTUALIZAR PREDICCIÓN
    // ============================================================
    await supabase
      .from('predicciones_groq')
      .update({
        confirmado: true,
        confirmado_por: 'whatsapp_reaction',
        updated_at: new Date().toISOString()
      })
      .eq('id', prediction_id_to_use);

    console.log('✅ Predicción actualizada');

    // ============================================================
    // GUARDAR FEEDBACK (weight=1.0)
    // ============================================================
    await supabase
      .from('feedback_usuarios')
      .insert({
        prediction_id: prediction_id_to_use,
        usuario_id,
        era_correcto: true,
        country_code,
        origen: 'whatsapp_reaction',
        confiabilidad: 1.0
      });

    console.log('✅ Feedback guardado (weight=1.0)');

    // ============================================================
    // CREAR TRANSACCIÓN CON TIMESTAMP ORIGINAL
    // ============================================================
    if (prediction?.resultado) {
      await supabase
        .from('transacciones')
        .insert({
          usuario_id,
          tipo: prediction.resultado?.tipo || 'gasto',
          monto: prediction.resultado?.monto,
          categoria: prediction.resultado?.categoria,
          descripcion: prediction.resultado?.descripcion,
          fecha: prediction.original_timestamp, // ← TIMESTAMP ORIGINAL
          metodo_pago: prediction.resultado?.metodoPago,
          moneda: prediction.resultado?.moneda || 'BOB'
        });

      console.log('✅ Transacción creada con timestamp original:', prediction.original_timestamp);
    }

    // ============================================================
    // MARCAR CONFIRMACIÓN COMO COMPLETADA
    // ============================================================
    await supabase
      .from('pending_confirmations')
      .update({
        confirmed: true,
        confirmed_at: new Date().toISOString()
      })
      .eq('prediction_id', prediction_id_to_use);

    console.log('✅ Confirmación pendiente marcada');

    // ============================================================
    // RECALCULAR ACCURACY PONDERADA
    // ============================================================
    const { accuracy, verified_count } = await calculateWeightedAccuracy(supabase, country_code);

    await supabase
      .from('feedback_confirmation_config')
      .update({
        total_transactions: verified_count,
        accuracy: accuracy,
        updated_at: new Date().toISOString()
      })
      .eq('country_code', country_code);

    console.log(`✅ Accuracy actualizada: ${accuracy}%`);

    // ============================================================
    // ¿CAMBIAR A AUTOMÁTICO?
    // ============================================================
    if (accuracy >= 90 && verified_count >= 1000) {
      console.log(`🚀 ALERTA: ${country_code} alcanzó umbrales para AUTO`);
      
      await supabase
        .from('feedback_confirmation_config')
        .update({
          require_confirmation: false,
          is_auto_enabled: true,
          updated_at: new Date().toISOString()
        })
        .eq('country_code', country_code);

      console.log(`🚀 ${country_code} CAMBIADO A AUTOMÁTICO`);
      return NextResponse.json({
        success: true,
        message: '✅ Perfecto. Transacción guardada.',
        confirmado: true,
        auto_enabled: true,
        accuracy: accuracy
      });
    }

    return NextResponse.json({
      success: true,
      message: '✅ Perfecto. Transacción guardada.',
      confirmado: true,
      accuracy: accuracy
    });

  } catch (error: any) {
    console.error('❌ Error en confirmación:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

