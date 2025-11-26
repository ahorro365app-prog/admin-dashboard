import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { adminApiRateLimit, getClientIdentifier, checkRateLimit } from '@/lib/rateLimit';
import { handleError, handleValidationError } from '@/lib/errorHandler';
import { whatsappUpdateSessionSchema, validateWithZod } from '@/lib/validations';

// Force dynamic rendering - Vercel cache buster
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * @swagger
 * /api/whatsapp/update-session:
 *   post:
 *     summary: Actualiza la información de la sesión de WhatsApp
 *     description: Actualiza o crea la información de la sesión de WhatsApp en Supabase. Útil para sincronizar el estado de la conexión desde el Baileys Worker.
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
 *               - number
 *               - status
 *               - lastSync
 *             properties:
 *               number:
 *                 type: string
 *                 description: Número de teléfono de WhatsApp
 *                 example: "+521234567890"
 *               status:
 *                 type: string
 *                 description: Estado de la conexión
 *               lastSync:
 *                 type: string
 *                 format: date-time
 *                 description: Última sincronización
 *               uptime:
 *                 type: number
 *                 description: Porcentaje de uptime (opcional)
 *                 example: 99.8
 *               jid:
 *                 type: string
 *                 nullable: true
 *                 description: JID de la sesión (opcional)
 *           example:
 *             number: "+521234567890"
 *             status: "connected"
 *             lastSync: "2025-01-07T10:30:00Z"
 *             uptime: 99.8
 *             jid: "521234567890@s.whatsapp.net"
 *     responses:
 *       200:
 *         description: Sesión actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
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
 * @route POST /api/whatsapp/update-session
 * @description Actualiza la información de la sesión de WhatsApp
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
    
    const validation = validateWithZod(whatsappUpdateSessionSchema, body);
    if (!validation.success) {
      return handleValidationError(validation.error, validation.details);
    }

    const { number, status, lastSync, uptime, jid } = validation.data;

    // Actualizar o crear sesión en whatsapp_session
    const { data, error } = await supabase
      .from('whatsapp_session')
      .upsert({
        number,
        jid: jid || null,
        status,
        last_sync: lastSync,
        uptime_percentage: uptime || 99.8,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'number'
      });

    if (error) {
      logger.error('Error updating session:', error);
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.error('Error in update-session endpoint:', error);
    return handleError(error, 'Error al actualizar sesión de WhatsApp');
  }
}

