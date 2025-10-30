/**
 * Servicio Groq Whisper para transcripción de audio
 * Reemplaza Google Colab para mayor confiabilidad
 * Requiere: GROQ_API_KEY en variables de entorno
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY || '';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/audio/transcriptions';

export async function transcribeAudioWithGroq(
  audioFile: File | Blob | Buffer,
  language: string = 'es'
): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY no configurada. Agrega la variable de entorno.');
  }

  try {
    console.log('🎤 Transcribiendo audio con Groq Whisper...');

    // Convertir a FormData para enviar el archivo
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', 'whisper-large-v3'); // Usar el mejor modelo de Groq
    formData.append('language', language);
    formData.append('response_format', 'json');
    formData.append('timestamp_granularities', 'word');

    const response = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error en transcripción Groq:', errorText);
      throw new Error(`Groq Whisper error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const transcription = data.text || data.transcription || '';
    
    console.log('✅ Transcripción completada:', transcription);
    return transcription;

  } catch (error: any) {
    console.error('❌ Error transcribiendo con Groq:', error);
    throw error;
  }
}

export const groqWhisperService = {
  transcribe: transcribeAudioWithGroq
};

