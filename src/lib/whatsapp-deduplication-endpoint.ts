/**
 * Servicio de deduplicación para ENDPOINT
 * ⚠️ Centralizado en el backend (NO en el Worker)
 * El Worker envía wa_message_id en el payload
 */

import { getSupabaseAdmin } from './supabaseAdmin';

/**
 * Verifica si un mensaje WhatsApp ya fue procesado
 * @param waMessageId - msg.key.id desde Baileys
 */
export async function checkDuplicateWhatsAppMessage(waMessageId: string) {
  if (!waMessageId) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('predicciones_groq')
    .select('id, resultado, confirmado, created_at')
    .eq('wa_message_id', waMessageId)
    .single();

  if (error && (error as any).code !== 'PGRST116') {
    console.error('❌ Error verificando duplicado:', error);
    return null;
  }

  return data || null;
}

/**
 * Inserta predicción con deduplicación WhatsApp
 * @param payload - datos de predicción (incluir wa_message_id)
 */
export async function insertPredictionWithDedup(payload: {
  usuario_id: string;
  country_code: string;
  transcripcion: string;
  resultado: Record<string, any>;
  wa_message_id?: string;
  mensaje_origen?: string;
  original_timestamp?: string;
  parent_message_id?: string;
}) {
  // 1. Si tiene wa_message_id, verificar si ya existe
  if (payload.wa_message_id) {
    const existing = await checkDuplicateWhatsAppMessage(payload.wa_message_id);
    if (existing) {
      console.log('📦 Mensaje duplicado en caché, devolviendo respuesta previa');
      return {
        cached: true,
        data: existing
      } as const;
    }
  }

  // 2. Insertar nueva predicción
  // Poblar categoria_detectada desde resultado.categoria
  const categoria = (payload.resultado as any)?.categoria || 'desconocida';
  
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('predicciones_groq')
    .insert({
      usuario_id: payload.usuario_id,
      country_code: payload.country_code,
      transcripcion: payload.transcripcion,
      resultado: payload.resultado,
      wa_message_id: payload.wa_message_id || null,
      mensaje_origen: payload.mensaje_origen || 'app',
      categoria_detectada: categoria,
      original_timestamp: payload.original_timestamp || new Date().toISOString(),
      parent_message_id: payload.parent_message_id || null
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error insertando predicción:', error);
    throw error;
  }

  return {
    cached: false,
    data
  } as const;
}


