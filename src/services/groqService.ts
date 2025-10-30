/* Servicio para procesar texto transcrito usando Groq (API compatible con OpenAI)
   Requiere: NEXT_PUBLIC_GROQ_API_KEY en .env.local
*/

type GroqExtraction = {
  monto?: number | null;
  categoria?: string | null;
  tipo?: 'gasto' | 'ingreso' | null;
  descripcion?: string | null;
  metodoPago?: string | null;
  raw?: any;
  moneda?: string | null;
};

const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY || '';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-8b-instant';

async function processTextWithGroq(text: string, userCountryCode: string = 'BO'): Promise<GroqExtraction | null> {
  if (!text || !text.trim()) return null;
  if (!GROQ_API_KEY) {
    console.warn('⚠️ GROQ_API_KEY no configurada. Saltando procesamiento Groq.');
    return null;
  }

  try {
    const systemPrompt = `Eres un asistente experto en finanzas personales que extrae información de transacciones.

MONEDAS SOPORTADAS:
- Boliviano (BOB): "bolivianos", "bs", "boliviano"
- Dólar (USD): "dólares", "dolares", "usd", "$"
- Euro (EUR): "euros", "eur"
- Peso mexicano (MXN): "pesos mexicanos"
- Sol peruano (PEN): "soles"

CATEGORÍAS DISPONIBLES:
- comida: alimentos, restaurantes, supermercado
- transporte: taxi, bus, gasolina
- educacion: libros, cursos, fotocopias
- tecnologia: computadoras, celulares
- salud: medicinas, doctores
- entretenimiento: cine, juegos
- servicios: luz, agua, internet
- ropa: vestimenta, zapatos
- hogar: muebles, electrodomesticos
- otros: cualquier otra cosa

MÉTODOS DE PAGO:
- efectivo: dinero en efectivo
- tarjeta: tarjeta de crédito/débito
- transferencia: transferencia bancaria
- otro: cualquier otro método

Devuelve SOLO JSON con: { monto, categoria, tipo, descripcion, metodoPago, moneda }`;

    const userPrompt = `Extrae información de esta transacción: "${text}"`;

    const response = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.2,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) return { raw: data } as GroqExtraction;

    // Parsear JSON
    try {
      const parsed = JSON.parse(content);
      console.log('🤖 Groq result:', parsed);
      return { ...parsed, raw: data } as GroqExtraction;
    } catch {
      // Intentar extraer JSON del contenido
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          return { ...parsed, raw: data } as GroqExtraction;
        } catch {
          return { raw: data } as GroqExtraction;
        }
      }
      return { raw: data } as GroqExtraction;
    }
  } catch (err) {
    console.error('❌ Error procesando texto con Groq:', err);
    return null;
  }
}

export async function extractExpenseWithCountryContext(
  transcripcion: string,
  countryCode: string
): Promise<GroqExtraction | null> {
  return processTextWithGroq(transcripcion, countryCode);
}

export const groqService = {
  extractExpenseWithCountryContext
};

