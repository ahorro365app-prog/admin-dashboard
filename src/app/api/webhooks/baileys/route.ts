import { NextRequest, NextResponse } from 'next/server';
import { groqWhisperService } from '@/services/groqWhisperService';
import { groqService } from '@/services/groqService';
import { createClient } from '@supabase/supabase-js';

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
    const { audioBase64, text, from, type, timestamp } = body;

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
      
      // IMPORTANTE: Retornamos SIN procesar el mensaje para no gastar recursos de Groq
      return NextResponse.json({
        success: false,
        error: 'user_not_registered',
        message: 'Usuario no está registrado en la plataforma'
      }, { status: 200 }); // Status 200 para que Baileys Worker maneje el mensaje
    } else {
      console.log('✅ Usuario existente encontrado:', user.id);
      console.log('💡 Continuando con procesamiento de', type, '...');
    }

    // 2. Obtener transcripción según el tipo de mensaje
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

    // 3. Extraer datos con Groq LLM con contexto por país
    const expenseData = await groqService.extractExpenseWithCountryContext(
      transcription,
      user.country_code || 'BOL'
    );
    console.log('✅ Expense extracted:', expenseData);

    // 6. Guardar predicción en predicciones_groq
    const { data: prediction } = await supabase
      .from('predicciones_groq')
      .insert({
        usuario_id: user.id,
        country_code: user.country_code || 'BOL',
        transcripcion: transcription,
        resultado: expenseData,
      })
      .select()
      .single();

    console.log('✅ Prediction saved:', prediction?.id);

    // 7. Crear transacción en tabla transacciones
    // Si expenseData es null, usar valores por defecto
    const { data: transaction } = await supabase
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
      transaction_id: transaction?.id,
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

