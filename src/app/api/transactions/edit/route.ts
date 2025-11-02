import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateWeightedAccuracy } from '@/lib/calculateWeightedAccuracy';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prediction_id, usuario_id, country_code, formData } = body;

    console.log(`✏️ Editando transacción: ${prediction_id}`);

    // ============================================================
    // OBTENER PREDICCIÓN (para timestamp original)
    // ============================================================
    const { data: prediction } = await supabase
      .from('predicciones_groq')
      .select('original_timestamp')
      .eq('id', prediction_id)
      .single();

    if (!prediction) {
      return NextResponse.json({
        success: false,
        error: 'Predicción no encontrada'
      }, { status: 404 });
    }

    // ============================================================
    // PREPARAR DATOS ACTUALIZADOS
    // ============================================================
    const updatedResultado = {
      monto: parseFloat(formData.monto),
      tipo: formData.tipo,
      categoria: formData.categoria,
      descripcion: formData.descripcion,
      metodoPago: formData.metodoPago,
      moneda: formData.moneda
    };

    // ============================================================
    // ACTUALIZAR PREDICCIÓN
    // ============================================================
    await supabase
      .from('predicciones_groq')
      .update({
        resultado: updatedResultado,
        categoria_detectada: formData.categoria,
        confirmado: true,
        confirmado_por: 'app_edit',
        updated_at: new Date().toISOString()
      })
      .eq('id', prediction_id);

    console.log('✅ Predicción actualizada');

    // ============================================================
    // ELIMINAR FEEDBACK ANTERIOR (si existe)
    // ============================================================
    await supabase
      .from('feedback_usuarios')
      .delete()
      .eq('prediction_id', prediction_id);

    console.log('✅ Feedback anterior eliminado');

    // ============================================================
    // GUARDAR NUEVO FEEDBACK (weight=2.0 MÁXIMO)
    // ============================================================
    await supabase
      .from('feedback_usuarios')
      .insert({
        prediction_id,
        usuario_id,
        era_correcto: true,
        country_code,
        origen: 'app_edit',
        confiabilidad: 2.0
      });

    console.log('✅ Feedback guardado (weight=2.0 MÁXIMO)');

    // ============================================================
    // CREAR TRANSACCIÓN CON TIMESTAMP ORIGINAL (NO cambia)
    // ============================================================
    await supabase
      .from('transacciones')
      .insert({
        usuario_id,
        tipo: formData.tipo,
        monto: parseFloat(formData.monto),
        categoria: formData.categoria,
        descripcion: formData.descripcion,
        fecha: prediction.original_timestamp, // ← TIMESTAMP ORIGINAL (NO CAMBIA)
        metodo_pago: formData.metodoPago,
        moneda: formData.moneda
      });

    console.log('✅ Transacción creada con datos editados, timestamp original:', prediction.original_timestamp);

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
      console.log(`🚀 ALERTA: ${country_code} alcanzó umbrales`);
      
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
        message: 'Transacción editada y validada (máximo peso)',
        accuracy_recalculated: true,
        auto_enabled: true,
        accuracy: accuracy
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Transacción editada y validada (máximo peso)',
      accuracy_recalculated: true,
      accuracy: accuracy
    });

  } catch (error: any) {
    console.error('❌ Error editando transacción:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

