import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { logger } from '@/lib/logger';
import { adminApiRateLimit, getClientIdentifier, checkRateLimit } from '@/lib/rateLimit';
import { handleError, handleValidationError } from '@/lib/errorHandler';
import { whatsappEventSchema, validateWithZod } from '@/lib/validations';

// Force dynamic rendering - Vercel cache buster
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';



/**
 * @swagger
 * /api/whatsapp/events:
 *   get:
 *     summary: Obtiene eventos de WhatsApp
 *     description: Retorna una lista de eventos de WhatsApp ordenados por timestamp descendente. Permite limitar la cantidad de resultados.
 *     tags: [WhatsApp]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Límite de eventos a retornar
 *     responses:
 *       200:
 *         description: Lista de eventos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                   type:
 *                     type: string
 *                   user_id:
 *                     type: string
 *                     format: uuid
 *                     nullable: true
 *                   phone:
 *                     type: string
 *                     nullable: true
 *                   status:
 *                     type: string
 *                   message:
 *                     type: string
 *                   details:
 *                     type: object
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit excedido (100 requests / 15 minutos)
 *         headers:
 *           X-RateLimit-Limit:
 *             schema:
 *               type: integer
 *               example: 100
 *           Retry-After:
 *             schema:
 *               type: integer
 *               example: 900
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * @route GET /api/whatsapp/events
 * @description Obtiene eventos de WhatsApp
 * @security Requiere autenticación de administrador (cookie)
 * @rateLimit 100 requests / 15 minutos
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    // 1. Rate limiting
    const identifier = getClientIdentifier(request as any);
    const rateLimitResult = await checkRateLimit(adminApiRateLimit, identifier);
    if (!rateLimitResult?.success) {
      logger.warn(`⛔ Rate limit exceeded for ${identifier}`);
      return NextResponse.json(
        {
          success: false,
          message: 'Demasiadas solicitudes. Por favor, intenta más tarde.',
          retryAfter: rateLimitResult ? new Date(rateLimitResult.reset).toISOString() : 'unknown',
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult ? Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString() : '900',
            'X-RateLimit-Limit': rateLimitResult?.limit.toString() || '200',
            'X-RateLimit-Remaining': rateLimitResult?.remaining.toString() || '0',
            'X-RateLimit-Reset': rateLimitResult?.reset.toString() || Date.now().toString(),
          },
        }
      );
    }

    const limit = request.nextUrl.searchParams.get('limit') || '20';

    const { data: events } = await supabase
      .from('whatsapp_events')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(parseInt(limit));

    return NextResponse.json(events || []);
  } catch (error) {
    logger.error('Error fetching WhatsApp events:', error);
    return handleError(error, 'Error al obtener eventos de WhatsApp');
  }
}

/**
 * @swagger
 * /api/whatsapp/events:
 *   post:
 *     summary: Crea un nuevo evento de WhatsApp
 *     description: Crea un nuevo evento en el registro de eventos de WhatsApp. Útil para logging y auditoría.
 *     tags: [WhatsApp]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - status
 *               - message
 *             properties:
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 description: Timestamp del evento (opcional, usa fecha actual si no se proporciona)
 *               type:
 *                 type: string
 *                 description: Tipo de evento
 *               user_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: ID del usuario relacionado (opcional)
 *               phone:
 *                 type: string
 *                 nullable: true
 *                 description: Número de teléfono relacionado (opcional)
 *               status:
 *                 type: string
 *                 description: Estado del evento
 *               message:
 *                 type: string
 *                 description: Mensaje del evento
 *               details:
 *                 type: object
 *                 description: Detalles adicionales del evento (opcional)
 *           example:
 *             type: "message_received"
 *             status: "success"
 *             message: "Mensaje recibido correctamente"
 *             user_id: "123e4567-e89b-12d3-a456-426614174000"
 *             phone: "+521234567890"
 *             details:
 *               messageId: "msg_123"
 *     responses:
 *       200:
 *         description: Evento creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit excedido (100 requests / 15 minutos)
 *         headers:
 *           X-RateLimit-Limit:
 *             schema:
 *               type: integer
 *               example: 100
 *           Retry-After:
 *             schema:
 *               type: integer
 *               example: 900
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * @route POST /api/whatsapp/events
 * @description Crea un nuevo evento de WhatsApp
 * @security Requiere autenticación de administrador (cookie)
 * @rateLimit 100 requests / 15 minutos
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting
    const identifier = getClientIdentifier(request as any);
    const rateLimitResult = await checkRateLimit(adminApiRateLimit, identifier);
    if (!rateLimitResult?.success) {
      logger.warn(`⛔ Rate limit exceeded for ${identifier}`);
      return NextResponse.json(
        {
          success: false,
          message: 'Demasiadas solicitudes. Por favor, intenta más tarde.',
          retryAfter: rateLimitResult ? new Date(rateLimitResult.reset).toISOString() : 'unknown',
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult ? Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString() : '900',
            'X-RateLimit-Limit': rateLimitResult?.limit.toString() || '200',
            'X-RateLimit-Remaining': rateLimitResult?.remaining.toString() || '0',
            'X-RateLimit-Reset': rateLimitResult?.reset.toString() || Date.now().toString(),
          },
        }
      );
    }

    // 2. Leer y validar body
    const body = await request.json();
    
    const validation = validateWithZod(whatsappEventSchema, body);
    if (!validation.success) {
      return handleValidationError(validation.error, validation.details);
    }

    const { timestamp, type, user_id, phone, status, message, details } = validation.data;

    const { error } = await supabase
      .from('whatsapp_events')
      .insert({
        timestamp: timestamp || new Date().toISOString(),
        type,
        user_id: user_id || null,
        phone: phone || null,
        status,
        message,
        details: details || {}
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error creating WhatsApp event:', error);
    return handleError(error, 'Error al crear evento de WhatsApp');
  }
}
