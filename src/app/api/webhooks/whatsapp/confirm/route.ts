import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseConfirmation } from '@/lib/parseConfirmation';
import { calculateWeightedAccuracy } from '@/lib/calculateWeightedAccuracy';

// Force dynamic rendering - Vercel cache buster
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
    // Intentar buscar con ambos formatos (con y sin +)
    const phoneWithPlus = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    const phoneWithoutPlus = phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;
    
    // Intentar buscar primero con el formato con +
    let { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('id, country_code')
      .eq('telefono', phoneWithPlus)
      .single();

    // Si no se encontró con +, intentar sin +
    if (userError || !user) {
      console.log('⚠️ No encontrado con formato +, intentando sin +...');
      const { data: user2, error: userError2 } = await supabase
        .from('usuarios')
        .select('id, country_code')
        .eq('telefono', phoneWithoutPlus)
        .single();
      
      user = user2;
      userError = userError2;
    }

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
    let parent_message_id: string | null = null;
    
    // Si no viene prediction_id, obtener la transacción pendiente más reciente
    if (!prediction_id_to_use) {
      console.log('🔍 No hay prediction_id, buscando transacción pendiente más reciente...');
      const { data: pendingConf } = await supabase
        .from('pending_confirmations')
        .select('prediction_id, parent_message_id')
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
      parent_message_id = pendingConf.parent_message_id;
      console.log(`✅ Transacción pendiente encontrada: ${prediction_id_to_use}`);
      
      if (parent_message_id) {
        console.log(`✅ Parent message ID detectado: ${parent_message_id} (múltiples TX)`);
      }
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
    // CONFIRMAR (SIMPLE o MÚLTIPLE)
    // ============================================================
    let predictionsToConfirm: any[] = [];
    
    if (parent_message_id) {
      // MODO MÚLTIPLE: Confirmar todas las predicciones del mismo parent_message_id
      console.log(`📦 MODO MÚLTIPLE: Confirmando grupo ${parent_message_id}`);
      
      const { data: allGroupPendings } = await supabase
        .from('pending_confirmations')
        .select('prediction_id')
        .eq('usuario_id', usuario_id)
        .eq('parent_message_id', parent_message_id)
        .is('confirmed', null);
      
      if (!allGroupPendings || allGroupPendings.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'No se encontraron transacciones del grupo para confirmar'
        }, { status: 404 });
      }
      
      // Obtener todas las predicciones del grupo
      const predictionIds = allGroupPendings.map(p => p.prediction_id);
      const { data: groupPredictions } = await supabase
        .from('predicciones_groq')
        .select('*')
        .in('id', predictionIds);
      
      predictionsToConfirm = groupPredictions || [];
      console.log(`✅ Grupo detectado: ${predictionsToConfirm.length} transacciones`);
    } else {
      // MODO SIMPLE: Confirmar solo una
      console.log('📝 MODO SIMPLE: Confirmando 1 transacción');
      predictionsToConfirm = [prediction];
    }
    
    // Procesar cada predicción
    for (const pred of predictionsToConfirm) {
      // Actualizar predicción
      const { error: updatePredError } = await supabase
        .from('predicciones_groq')
        .update({
          confirmado: true,
          confirmado_por: 'whatsapp_reaction',
          updated_at: new Date().toISOString()
        })
        .eq('id', pred.id);
      
      if (updatePredError) {
        console.error(`❌ Error actualizando predicción ${pred.id}:`, updatePredError);
      } else {
        console.log(`✅ Predicción ${pred.id} actualizada (MANUAL)`);
      }
      
      // Guardar feedback
      const { error: feedbackError } = await supabase
        .from('feedback_usuarios')
        .insert({
          prediction_id: pred.id,
          usuario_id,
          era_correcto: true,
          country_code,
          origen: 'whatsapp_reaction',
          confiabilidad: 1.0
        });
      
      if (feedbackError) {
        console.error(`❌ Error guardando feedback ${pred.id}:`, feedbackError);
      }
      
      // Crear transacción
      if (pred?.resultado) {
        const { error: txError } = await supabase
          .from('transacciones')
          .insert({
            usuario_id,
            tipo: pred.resultado?.tipo || 'gasto',
            monto: pred.resultado?.monto,
            categoria: pred.resultado?.categoria,
            descripcion: pred.resultado?.descripcion,
            fecha: pred.original_timestamp,
            metodo_pago: pred.resultado?.metodoPago,
            moneda: pred.resultado?.moneda || 'BOB'
          });
        
        if (txError) {
          console.error(`❌ Error creando transacción ${pred.id}:`, txError);
        } else {
          console.log(`✅ Transacción ${pred.id} creada con timestamp original`);
        }
      }
      
      // Marcar confirmación
      const { error: confirmError } = await supabase
        .from('pending_confirmations')
        .update({
          confirmed: true,
          confirmed_at: new Date().toISOString()
        })
        .eq('prediction_id', pred.id);
      
      if (confirmError) {
        console.error(`❌ Error marcando confirmación ${pred.id}:`, confirmError);
      } else {
        console.log(`✅ Confirmación pendiente ${pred.id} marcada`);
      }
    }
    
    console.log(`✅ Total confirmadas: ${predictionsToConfirm.length}`);

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
        message: predictionsToConfirm.length > 1 
          ? `✅ Perfecto. ${predictionsToConfirm.length} transacciones guardadas.` 
          : '✅ Perfecto. Transacción guardada.',
        confirmado: true,
        auto_enabled: true,
        accuracy: accuracy
      });
    }

    return NextResponse.json({
      success: true,
      message: predictionsToConfirm.length > 1 
        ? `✅ Perfecto. ${predictionsToConfirm.length} transacciones guardadas.` 
        : '✅ Perfecto. Transacción guardada.',
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

