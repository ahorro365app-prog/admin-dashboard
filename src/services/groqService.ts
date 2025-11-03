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

export type GroqTransaction = {
  monto: number | null;
  categoria: string | null;
  tipo: 'gasto' | 'ingreso' | null;
  descripcion: string | null;
  metodoPago: string | null;
  moneda?: string | null;
  esPagoDeuda?: boolean;
  nombreDeuda?: string | null;
  fechaTexto?: string | null;
};

export type GroqMultipleResponse = {
  transacciones: GroqTransaction[];
  esMultiple: boolean;
};

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY || '';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-8b-instant';

// Mapeo de países a zonas horarias
const countryTimezones: Record<string, string> = {
  'BO': 'America/La_Paz',      // Bolivia
  'AR': 'America/Argentina/Buenos_Aires', // Argentina
  'BR': 'America/Sao_Paulo',   // Brasil
  'CL': 'America/Santiago',    // Chile
  'CO': 'America/Bogota',      // Colombia
  'EC': 'America/Guayaquil',   // Ecuador
  'PE': 'America/Lima',        // Perú
  'PY': 'America/Asuncion',    // Paraguay
  'UY': 'America/Montevideo',  // Uruguay
  'VE': 'America/Caracas',     // Venezuela
  'MX': 'America/Mexico_City', // México
  'US': 'America/New_York',    // Estados Unidos
  'EU': 'Europe/Berlin',       // Eurozona
};

// Función auxiliar para obtener la fecha actual en zona horaria específica del país
function getCountryDate(countryCode: string = 'BO'): Date {
  const now = new Date();
  const timezone = countryTimezones[countryCode] || countryTimezones['BO'];
  return new Date(now.toLocaleString("en-US", {timeZone: timezone}));
}

// Función para procesar fechas relativas (simplificada para WhatsApp)
function processRelativeDate(dateText: string, userCountryCode: string = 'BO'): string | null {
  const normalizedText = dateText.toLowerCase().trim();
  const countryTime = getCountryDate(userCountryCode);
  const year = countryTime.getFullYear();
  const month = countryTime.getMonth();
  const day = countryTime.getDate();
  
  let targetDate: Date | null = null;
  
  if (normalizedText.includes('ayer') || normalizedText.includes('el día de ayer') || normalizedText.includes('hace 1 día')) {
    targetDate = new Date(year, month, day - 1);
  } else if (normalizedText.includes('hace 2 días') || normalizedText.includes('hace dos días')) {
    targetDate = new Date(year, month, day - 2);
  } else if (normalizedText.includes('hace 3 días') || normalizedText.includes('hace tres días')) {
    targetDate = new Date(year, month, day - 3);
  } else if (normalizedText.includes('hace una semana') || normalizedText.includes('hace 7 días')) {
    targetDate = new Date(year, month, day - 7);
  }
  
  if (!targetDate) return null;
  return `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
}

async function processTextWithGroq(text: string, userCountryCode: string = 'BO'): Promise<GroqExtraction | null> {
  if (!text || !text.trim()) return null;
  if (!GROQ_API_KEY) {
    console.warn('⚠️ GROQ_API_KEY no configurada. Saltando procesamiento Groq.');
    return null;
  }

  try {
    const systemPrompt = `Eres un asistente experto en finanzas personales que extrae información de transacciones.

MONEDAS SOPORTADAS (reconoce estas monedas y sus variaciones):
- Boliviano (BOB): "bolivianos", "bs", "boliviano", "bolivianos bolivianos"
- Dólar estadounidense (USD): "dólares", "dolares", "usd", "dollar", "dollars", "$"
- Euro (EUR): "euros", "eur", "euro"
- Peso mexicano (MXN): "pesos mexicanos", "pesos", "mxn", "peso mexicano"
- Peso argentino (ARS): "pesos argentinos", "pesos", "ars", "peso argentino"
- Peso chileno (CLP): "pesos chilenos", "pesos", "clp", "peso chileno"
- Sol peruano (PEN): "soles", "pen", "sol peruano", "soles peruanos"
- Peso colombiano (COP): "pesos colombianos", "pesos", "cop", "peso colombiano"

CATEGORÍAS DISPONIBLES (usa estas como referencia, pero puedes crear otras más específicas si es apropiado):
- comida: alimentos, restaurantes, supermercado
- transporte: taxi, bus, gasolina, uber
- educacion: libros, cursos, fotocopias, material escolar
- tecnologia: computadoras, celulares, software
- salud: medicinas, doctores, hospital
- entretenimiento: cine, juegos, deportes
- servicios: luz, agua, internet, telefono
- ropa: vestimenta, zapatos, accesorios
- hogar: muebles, electrodomesticos, limpieza
- otros: cualquier cosa que no encaje en las anteriores

MÉTODOS DE PAGO DISPONIBLES:
- efectivo: dinero en efectivo, billetes, monedas
- tarjeta: tarjeta de crédito, débito, visa, mastercard
- transferencia: transferencia bancaria, pago móvil
- cheque: cheque, cheque bancario
- crypto: criptomonedas, bitcoin, ethereum
- otro: cualquier otro método no especificado

DETECCIÓN DE PAGOS DE DEUDAS:
Si el texto menciona pagos de deudas, préstamos o cuentas específicas, marca esPagoDeuda: true y extrae el nombre de la deuda.
Ejemplos de pagos de deudas:
- "acabo de pagar 500 bs de la deuda de abed nego" → esPagoDeuda: true, nombreDeuda: "abed nego"
- "pagué 200 bolivianos de mi préstamo del banco" → esPagoDeuda: true, nombreDeuda: "préstamo del banco"
- "cancelé 100 bs de mi cuenta de la tienda" → esPagoDeuda: true, nombreDeuda: "cuenta de la tienda"

INSTRUCCIONES IMPORTANTES:
1. Extrae el monto exacto mencionado
2. Identifica la categoría más apropiada
3. Determina si es gasto o ingreso
4. Extrae la descripción del producto/servicio
5. Identifica el método de pago (por defecto "efectivo" si no se especifica)
6. RECONOCE TODAS LAS MONEDAS: Detecta cualquier moneda mencionada y extrae el monto correctamente
7. Si encuentras una categoría más específica y útil que las predeterminadas, úsala
8. Si no se especifica método de pago, usa "efectivo" por defecto
9. Detecta métodos de pago mencionados en el texto (ej: "pagué con tarjeta", "transferencia", "en efectivo")
10. DETECTA PAGOS DE DEUDAS: Si menciona pagar una deuda específica, marca esPagoDeuda: true y extrae el nombre de la deuda

Devuelve SOLO JSON válido con: { monto, categoria, tipo, descripcion, metodoPago, moneda }`;

    const userPrompt = `Extrae información de esta transacción: "${text}"

Ejemplos:
- "Gasté 50 bolivianos en comida" → {"monto": 50, "categoria": "comida", "tipo": "gasto", "descripcion": "comida", "metodoPago": "efectivo", "moneda": "BOB"}
- "Pagué 30 euros de transporte" → {"monto": 30, "categoria": "transporte", "tipo": "gasto", "descripcion": "transporte", "metodoPago": "efectivo", "moneda": "EUR"}
- "Compré ropa por 100 bs" → {"monto": 100, "categoria": "ropa", "tipo": "gasto", "descripcion": "ropa", "metodoPago": "efectivo", "moneda": "BOB"}
- "Acabo de comprar una casaca en 120 bs" → {"monto": 120, "categoria": "ropa", "tipo": "gasto", "descripcion": "casaca", "metodoPago": "efectivo", "moneda": "BOB"}
- "Ahorré 200 soles para mi meta" → {"monto": 200, "categoria": "otros", "tipo": "ingreso", "descripcion": "ahorro para meta", "metodoPago": "efectivo", "moneda": "PEN"}

Devuelve solo JSON válido:`;

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

// Nueva función para múltiples transacciones
export async function processTranscriptionMultiple(
  text: string,
  userCountryCode: string = 'BO'
): Promise<GroqMultipleResponse | null> {
  if (!text || !text.trim()) return null;
  if (!GROQ_API_KEY) {
    console.warn('⚠️ GROQ_API_KEY no configurada. Saltando procesamiento Groq.');
    return null;
  }

  try {
    const systemPrompt = `Eres un asistente experto en finanzas personales que extrae información de transacciones.

MONEDAS SOPORTADAS:
- Boliviano (BOB): "bolivianos", "bs", "boliviano"
- Dólar (USD): "dólares", "dolares", "usd", "dollar", "$"
- Euro (EUR): "euros", "eur"
- Peso mexicano (MXN): "pesos mexicanos", "pesos", "mxn"
- Peso argentino (ARS): "pesos argentinos", "ars"
- Sol peruano (PEN): "soles", "pen"

CATEGORÍAS: comida, transporte, educacion, tecnologia, salud, entretenimiento, servicios, ropa, hogar, otros

MÉTODOS DE PAGO: efectivo, tarjeta, transferencia, cheque, crypto, otro

INSTRUCCIONES:
1. Extrae el monto exacto mencionado
2. Identifica la categoría más apropiada
3. Determina si es gasto o ingreso
4. Extrae la descripción del producto/servicio
5. Identifica el método de pago (por defecto "efectivo")
6. RECONOCE TODAS LAS MONEDAS
7. SEPARA TRANSACCIONES: Si hay múltiples compras, servicios o pagos mencionados, sepáralas en transacciones individuales, incluso si son de la misma categoría

FORMATO DE RESPUESTA:
Devuelve SOLO un JSON válido. NO incluyas texto explicativo.

{
  "transacciones": [
    {
      "monto": número,
      "categoria": "string",
      "tipo": "gasto" o "ingreso",
      "descripcion": "string",
      "metodoPago": "string",
      "moneda": "string"
    }
  ],
  "esMultiple": boolean
}`;

    const userPrompt = `Analiza esta transacción: "${text}"

Ejemplos:
- "Compré comida por 20 bolivianos y pagué 5 bolivianos de fotocopias" →
  {
    "transacciones": [
      {"monto": 20, "categoria": "comida", "tipo": "gasto", "descripcion": "comida", "metodoPago": "efectivo", "moneda": "BOB"},
      {"monto": 5, "categoria": "educacion", "tipo": "gasto", "descripcion": "fotocopias", "metodoPago": "efectivo", "moneda": "BOB"}
    ],
    "esMultiple": true
  }

- "Compré 5 bs de pan, pagué 10 de taxi, compré 70 de carne" →
  {
    "transacciones": [
      {"monto": 5, "categoria": "comida", "tipo": "gasto", "descripcion": "pan", "metodoPago": "efectivo", "moneda": "BOB"},
      {"monto": 10, "categoria": "transporte", "tipo": "gasto", "descripcion": "taxi", "metodoPago": "efectivo", "moneda": "BOB"},
      {"monto": 70, "categoria": "comida", "tipo": "gasto", "descripcion": "carne", "metodoPago": "efectivo", "moneda": "BOB"}
    ],
    "esMultiple": true
  }

- "Compré pan por 5 bolivianos" →
  {
    "transacciones": [
      {"monto": 5, "categoria": "comida", "tipo": "gasto", "descripcion": "pan", "metodoPago": "efectivo", "moneda": "BOB"}
    ],
    "esMultiple": false
  }

Devuelve solo JSON válido:`;

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
    if (!content) return null;

    // Parsear JSON
    try {
      const parsed: GroqMultipleResponse = JSON.parse(content);
      console.log('🤖 Groq multiple result:', parsed);
      return parsed;
    } catch {
      // Intentar extraer JSON del contenido
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const parsed: GroqMultipleResponse = JSON.parse(match[0]);
          console.log('🤖 Groq multiple result (extracted):', parsed);
          return parsed;
        } catch {
          return null;
        }
      }
      return null;
    }
  } catch (err) {
    console.error('❌ Error procesando texto con Groq:', err);
    return null;
  }
}

export const groqService = {
  extractExpenseWithCountryContext,
  processTranscriptionMultiple
};

