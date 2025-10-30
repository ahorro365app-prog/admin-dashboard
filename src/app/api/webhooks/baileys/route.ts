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
      hasAudio: !!body.audioBase64
    });

    // Baileys envía: { audioBase64: string, from: string, type: 'audio', timestamp: number }
    const { audioBase64, from, type, timestamp } = body;

    if (type !== 'audio') {
      console.log('❌ Message is not audio');
      return NextResponse.json({ status: 'ignored', message: 'Only audio messages are processed' });
    }

    if (!audioBase64) {
      console.error('❌ No audio data in message');
      return NextResponse.json({ error: 'No audio data' }, { status: 400 });
    }

    const phoneNumber = from.replace('@s.whatsapp.net', '');
    console.log('📱 WhatsApp audio from:', phoneNumber);

    // 1. Buscar o crear usuario por teléfono
    let { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('telefono', phoneNumber)
      .single();

    if (userError || !user) {
      console.log('👤 Usuario no existe, creando automáticamente...');
      
      // Crear usuario automáticamente
      const { data: newUser, error: createError } = await supabase
        .from('usuarios')
        .insert([{
          nombre: `Usuario ${phoneNumber}`,
          telefono: phoneNumber,
          contrasena: 'auto-created',
          moneda: 'BOB',
          pais: 'Bolivia',
          country_code: 'BOL',
          suscripcion: 'free',
          whatsapp_habilitado: true,
          notificaciones_whatsapp: true
        }])
        .select()
        .single();
      
      if (createError || !newUser) {
        console.error('❌ Error creando usuario:', createError);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }
      
      user = newUser;
      console.log('✅ Usuario creado automáticamente:', user.id);
    } else {
      console.log('✅ Usuario existente encontrado:', user.id);
    }

    // 2. Convertir base64 a Blob
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const audioBlob = new Blob([audioBuffer], { type: 'audio/ogg; codecs=opus' });
    console.log('✅ Audio converted from base64:', audioBlob.size, 'bytes');

    // 3. Convertir blob a File
    const audioFile = new File([audioBlob], 'audio.ogg', { type: 'audio/ogg; codecs=opus' });

    // 4. Transcribir con Groq Whisper
    const transcription = await groqWhisperService.transcribe(audioFile, 'es');
    console.log('✅ Transcription:', transcription);

    // 5. Extraer datos con Groq LLM con contexto por país
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
    const { data: transaction } = await supabase
      .from('transacciones')
      .insert({
        usuario_id: user.id,
        tipo: 'gasto',
        monto: expenseData.monto || 0,
        categoria: expenseData.categoria || 'otros',
        descripcion: expenseData.descripcion || transcription,
        fecha: new Date(timestamp).toISOString(),
      })
      .select()
      .single();

    console.log('✅ Transaction created:', transaction?.id);

    return NextResponse.json({
      success: true,
      transaction_id: transaction?.id,
      transcription,
      expense_data: expenseData,
      amount: expenseData.monto,
      currency: expenseData.moneda || 'BOB',
      category: expenseData.categoria,
      processing_time_ms: Date.now() - startTime,
    });

  } catch (error: any) {
    console.error('❌ Error processing Baileys webhook:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

