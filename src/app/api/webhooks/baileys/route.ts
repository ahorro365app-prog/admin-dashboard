import { NextRequest, NextResponse } from 'next/server';
import { groqWhisperService } from '@/services/groqWhisperService';
import { groqService } from '@/services/groqService';
import { createClient } from '@supabase/supabase-js';
import { insertPredictionWithDedup, checkDuplicateWhatsAppMessage } from '@/lib/whatsapp-deduplication-endpoint';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();

    console.log('📱 Webhook Baileys recibido:', {
      from: body.from,
      type: body.type,
      hasAudio: !!body.audioBase64,
      hasText: !!body.text
    });

    // Baileys envía: 
    // Audio: { audioBase64: string, from: string, type: 'audio', timestamp: number }
    // Texto: { text: string, from: string, type: 'text', timestamp: number }
    const { audioBase64, text, from, type, timestamp, wa_message_id } = body;

    // Solo procesar audio o texto
    if (type !== 'audio' && type !== 'text') {
      console.log('❌ Message type not supported:', type);
      return NextResponse.json({ status: 'ignored', message: 'Only audio and text messages are processed' });
    }

    // Validar que tenga los datos necesarios según el tipo
    if (type === 'audio' && !audioBase64) {
      console.error('❌ No audio data in message');
      return NextResponse.json({ error: 'No audio data' }, { status: 400 });
    }

    if (type === 'text' && !text) {
      console.error('❌ No text data in message');
      return NextResponse.json({ error: 'No text data' }, { status: 400 });
    }

    const phoneNumber = from.replace('@s.whatsapp.net', '');
    console.log(`📱 WhatsApp ${type} from:`, phoneNumber);

    // 1. VERIFICAR SI EL USUARIO ESTÁ REGISTRADO (ANTES de procesar con Groq)
    let { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('telefono', phoneNumber)
      .single();

    if (userError || !user) {
      console.log('❌ Usuario no está registrado:', phoneNumber);
      console.log('💡 Retornando SIN procesar mensaje (ahorro de recursos de Groq)');
      
      // 2. Verificar rate limit para mensajes de invitación (evitar spam)
      // Solo enviar mensaje de invitación si han pasado más de 24 horas desde el último
      const { data: rateLimitCheck } = await supabase.rpc('debe_enviar_mensaje_invitacion', {
        telefono_param: phoneNumber
      });

      const debeEnviarMensaje = rateLimitCheck === true;

      if (debeEnviarMensaje) {
        console.log('✅ Rate limit OK: Puede enviar mensaje de invitación');
        // Registrar que se enviará el mensaje (se registrará después de que el worker lo envíe)
        await supabase.rpc('registrar_mensaje_invitacion', {
          telefono_param: phoneNumber
        });
      } else {
        console.log('⏸️ Rate limit: Ya se envió mensaje recientemente (últimas 24h)');
        console.log('💡 Ignorando mensaje para evitar spam');
      }

      // IMPORTANTE: Retornamos SIN procesar el mensaje para no gastar recursos de Groq
      return NextResponse.json({
        success: false,
        error: 'user_not_registered',
        message: 'Usuario no está registrado en la plataforma',
        should_send_invitation: debeEnviarMensaje // Flag para indicar si debe enviar mensaje
      }, { status: 200 }); // Status 200 para que Baileys Worker maneje el mensaje
    } else {
      console.log('✅ Usuario existente encontrado:', user.id);
      console.log('💡 Continuando con procesamiento de', type, '...');
    }

    // 2. Si viene wa_message_id y ya existe en BD, devolver caché sin reprocesar
    if (wa_message_id) {
      const cached = await checkDuplicateWhatsAppMessage(wa_message_id);
      if (cached) {
        console.log('📦 Mensaje duplicado en caché (early return)');
        const result = (cached as any).resultado || null;
        return NextResponse.json({
          success: true,
          cached: true,
          transaction_id: cached.id,
          transcription: result?.transcripcion || text || '',
          expense_data: result,
          amount: result?.monto || 0,
          currency: result?.moneda || 'BOB',
          category: result?.categoria || 'otros',
          processing_time_ms: Date.now() - startTime,
          message_type: type,
        });
      }
    }

    // 3. Obtener transcripción según el tipo de mensaje
    let transcription: string;

    if (type === 'audio') {
      // Para audio: convertir base64 a File y transcribir
      const audioBuffer = Buffer.from(audioBase64, 'base64');
      const audioBlob = new Blob([audioBuffer], { type: 'audio/ogg; codecs=opus' });
      console.log('✅ Audio converted from base64:', audioBlob.size, 'bytes');

      const audioFile = new File([audioBlob], 'audio.ogg', { type: 'audio/ogg; codecs=opus' });

      // Transcribir con Groq Whisper
      transcription = await groqWhisperService.transcribe(audioFile, 'es');
      console.log('✅ Transcription:', transcription);
    } else {
      // Para texto: usar directamente el texto como "transcripción"
      transcription = text;
      console.log('✅ Using text as transcription:', transcription);
    }

    // 4. Extraer datos con Groq LLM con contexto por país
    const expenseData = await groqService.extractExpenseWithCountryContext(
      transcription,
      user.country_code || 'BOL'
    );
    console.log('✅ Expense extracted:', expenseData);

    // 5. Guardar predicción con deduplicación (si trae wa_message_id)
    const { cached, data: prediction } = await insertPredictionWithDedup({
      usuario_id: user.id,
      country_code: user.country_code || 'BOL',
      transcripcion: transcription,
      resultado: expenseData || {},
      wa_message_id: wa_message_id,
      mensaje_origen: 'whatsapp'
    });
    console.log('✅ Prediction saved (cached? %s): %s', cached, prediction?.id);

    // 6. Crear transacción en tabla transacciones (solo si no es caché)
    // Si expenseData es null, usar valores por defecto
    const { data: transaction } = cached 
      ? { data: null } as any 
      : await supabase
          .from('transacciones')
          .insert({
            usuario_id: user.id,
            tipo: 'gasto',
            monto: expenseData?.monto || 0,
            categoria: expenseData?.categoria || 'otros',
            descripcion: expenseData?.descripcion || transcription,
            fecha: new Date(timestamp).toISOString(),
          })
          .select()
          .single();

    console.log('✅ Transaction created:', transaction?.id);

    return NextResponse.json({
      success: true,
      cached,
      transaction_id: transaction?.id || prediction?.id,
      transcription, // Para audio: transcripción, para texto: el texto original
      expense_data: expenseData,
      amount: expenseData?.monto || 0,
      currency: expenseData?.moneda || 'BOB',
      category: expenseData?.categoria || 'otros',
      processing_time_ms: Date.now() - startTime,
      message_type: type, // Indicar si fue audio o texto
    });

  } catch (error: any) {
    console.error('❌ Error processing Baileys webhook:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

