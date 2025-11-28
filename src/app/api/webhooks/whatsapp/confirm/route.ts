import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { parseConfirmation } from '@/lib/parseConfirmation';
import { calculateWeightedAccuracy } from '@/lib/calculateWeightedAccuracy';
import { handleError, handleNotFoundError } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';

/**
 * Procesa confirmaciones de WhatsApp (sí/ok/perfecto/está bien)
 * Actualiza predicciones_groq.confirmado = true
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    
    const body = await request.json();
    const { prediction_id, phone_number, message } = body;

    logger.debug(`📝 Confirmación recibida: "${message}"`);

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
      return handleNotFoundError('Usuario');
    }

    const usuario_id = user.id;
    const country_code = user.country_code || 'BOL';

    logger.debug(`✅ Usuario: ${usuario_id}, País: ${country_code}`);

    // ============================================================
    // PARSEAR CONFIRMACIÓN
    // ============================================================
    const { type, confidence } = parseConfirmation(message);
    logger.debug(`📊 Tipo: ${type}, Confianza: ${confidence}`);

    // Si no es confirmación positiva, rechazar
    if (type !== 'confirm') {
      logger.warn('⚠️ No es confirmación positiva');
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
      logger.debug('🔍 No hay prediction_id, buscando transacción pendiente más reciente...');
      const { data: pendingConf } = await supabase
        .from('pending_confirmations')
        .select('prediction_id, parent_message_id')
        .eq('usuario_id', usuario_id)
        .is('confirmed', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!pendingConf) {
        return handleNotFoundError('Transacción pendiente');
      }

      prediction_id_to_use = pendingConf.prediction_id;
      parent_message_id = pendingConf.parent_message_id;
      logger.debug(`✅ Transacción pendiente encontrada: ${prediction_id_to_use}`);
      
      if (parent_message_id) {
        logger.debug(`✅ Parent message ID detectado: ${parent_message_id} (múltiples TX)`);
      }
    }

    const { data: prediction } = await supabase
      .from('predicciones_groq')
      .select('resultado, original_timestamp, id')
      .eq('id', prediction_id_to_use)
      .single();

    if (!prediction) {
      return handleNotFoundError('Predicción');
    }

    // ============================================================
    // CONFIRMAR (SIMPLE o MÚLTIPLE)
    // ============================================================
    let predictionsToConfirm: any[] = [];
    
    if (parent_message_id) {
      // MODO MÚLTIPLE: Confirmar todas las predicciones del mismo parent_message_id
      logger.debug(`📦 MODO MÚLTIPLE: Confirmando grupo ${parent_message_id}`);
      
      const { data: allGroupPendings } = await supabase
        .from('pending_confirmations')
        .select('prediction_id')
        .eq('usuario_id', usuario_id)
        .eq('parent_message_id', parent_message_id)
        .is('confirmed', null);
      
      if (!allGroupPendings || allGroupPendings.length === 0) {
        return handleNotFoundError('Transacciones del grupo');
      }
      
      // Obtener todas las predicciones del grupo
      const predictionIds = allGroupPendings.map(p => p.prediction_id);
      const { data: groupPredictions } = await supabase
        .from('predicciones_groq')
        .select('*')
        .in('id', predictionIds);
      
      predictionsToConfirm = groupPredictions || [];
      logger.debug(`✅ Grupo detectado: ${predictionsToConfirm.length} transacciones`);
    } else {
      // MODO SIMPLE: Confirmar solo una
      logger.debug('📝 MODO SIMPLE: Confirmando 1 transacción');
      predictionsToConfirm = [prediction];
    }
    
    // Procesar cada predicción
    for (const pred of predictionsToConfirm) {
      // Actualizar predicción
      await supabase
        .from('predicciones_groq')
        .update({
          confirmado: true,
          confirmado_por: 'whatsapp_reaction',
          updated_at: new Date().toISOString()
        })
        .eq('id', pred.id);
      
      logger.debug(`✅ Predicción ${pred.id} actualizada (MANUAL)`);
      
      // Guardar feedback
      await supabase
        .from('feedback_usuarios')
        .insert({
          prediction_id: pred.id,
          usuario_id,
          era_correcto: true,
          country_code,
          origen: 'whatsapp_reaction',
          confiabilidad: 1.0
        });
      
      // Crear transacción
      if (pred?.resultado) {
        await supabase
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
        
        logger.debug(`✅ Transacción ${pred.id} creada con timestamp original`);
      }
      
      // Marcar confirmación
      await supabase
        .from('pending_confirmations')
        .update({
          confirmed: true,
          confirmed_at: new Date().toISOString()
        })
        .eq('prediction_id', pred.id);
      
      logger.debug(`✅ Confirmación pendiente ${pred.id} marcada`);
    }
    
    logger.success(`✅ Total confirmadas: ${predictionsToConfirm.length}`);

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

    logger.success(`✅ Accuracy actualizada: ${accuracy}%`);

    // ============================================================
    // ¿CAMBIAR A AUTOMÁTICO?
    // ============================================================
    if (accuracy >= 90 && verified_count >= 1000) {
      logger.success(`🚀 ALERTA: ${country_code} alcanzó umbrales para AUTO`);
      
      await supabase
        .from('feedback_confirmation_config')
        .update({
          require_confirmation: false,
          is_auto_enabled: true,
          updated_at: new Date().toISOString()
        })
        .eq('country_code', country_code);

      logger.success(`🚀 ${country_code} CAMBIADO A AUTOMÁTICO`);
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
    logger.error('❌ Error en confirmación:', error);
    return handleError(error, 'Error al procesar confirmación de WhatsApp');
  }
}

