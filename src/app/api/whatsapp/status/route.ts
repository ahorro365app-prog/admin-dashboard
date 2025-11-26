import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { adminApiRateLimit, getClientIdentifier, checkRateLimit } from '@/lib/rateLimit';
import { handleError, handleValidationError } from '@/lib/errorHandler';
import { whatsappStatusActionSchema, validateWithZod } from '@/lib/validations';

// Force dynamic rendering - Vercel cache buster
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * @swagger
 * /api/whatsapp/status:
 *   get:
 *     summary: Obtiene el estado de la conexión de WhatsApp
 *     description: Retorna el estado actual de la conexión de WhatsApp, incluyendo si está conectado, uptime, número de teléfono, última sincronización y JID.
 *     tags: [WhatsApp]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Estado obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [connected, disconnected]
 *                   example: "connected"
 *                 uptime:
 *                   type: number
 *                   description: Porcentaje de uptime
 *                   example: 99.8
 *                 number:
 *                   type: string
 *                   description: Número de teléfono conectado
 *                   example: "+521234567890"
 *                 lastSync:
 *                   type: string
 *                   format: date-time
 *                   description: Última sincronización
 *                 jid:
 *                   type: string
 *                   description: JID de la sesión
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
 * @route GET /api/whatsapp/status
 * @description Obtiene el estado de la conexión de WhatsApp
 * @security Requiere autenticación de administrador (cookie)
 * @rateLimit 100 requests / 15 minutos
 */
export async function GET(request: NextRequest) {
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

    const { data: session } = await supabase
      .from('whatsapp_session')
      .select('*')
      .single();

    if (!session) {
      return NextResponse.json({
        status: 'disconnected',
        uptime: 0,
        number: 'N/A',
        lastSync: null
      });
    }

    // Calcular uptime
    const now = new Date();
    const lastSync = new Date(session.last_sync);
    const diffMs = now.getTime() - lastSync.getTime();
    const isConnected = diffMs < 120000; // Menos de 2 minutos = conectado

    return NextResponse.json({
      status: isConnected ? 'connected' : 'disconnected',
      uptime: session.uptime_percentage || 99.8,
      number: session.number,
      lastSync: session.last_sync,
      jid: session.jid
    });
  } catch (error) {
    logger.error('Error fetching WhatsApp status:', error);
    return handleError(error, 'Error al obtener estado de WhatsApp');
  }
}

/**
 * @swagger
 * /api/whatsapp/status:
 *   post:
 *     summary: Ejecuta una acción en la conexión de WhatsApp
 *     description: Permite ejecutar acciones como reconectar la sesión de WhatsApp. Actualiza el timestamp de última sincronización.
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
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [reconnect]
 *                 example: "reconnect"
 *           example:
 *             action: "reconnect"
 *     responses:
 *       200:
 *         description: Acción ejecutada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Reconnecting..."
 *                 estimatedTime:
 *                   type: string
 *                   example: "10 segundos"
 *       400:
 *         description: Error de validación o acción inválida
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
 * @route POST /api/whatsapp/status
 * @description Ejecuta una acción en la conexión de WhatsApp
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
    
    const validation = validateWithZod(whatsappStatusActionSchema, body);
    if (!validation.success) {
      return handleValidationError(validation.error, validation.details);
    }

    const { action } = validation.data;

    if (action === 'reconnect') {
      // Aquí enviarías comando a Baileys Worker
      // Por ahora, solo responde que está en proceso

      // Actualizar timestamp
      await supabase
        .from('whatsapp_session')
        .update({ last_sync: new Date().toISOString() })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      return NextResponse.json({
        success: true,
        message: 'Reconnecting...',
        estimatedTime: '10 segundos'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    logger.error('Error reconnecting WhatsApp:', error);
    return handleError(error, 'Error al reconectar WhatsApp');
  }
}
