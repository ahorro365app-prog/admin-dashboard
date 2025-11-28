import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { logger } from '@/lib/logger';
import { adminApiRateLimit, getClientIdentifier, checkRateLimit } from '@/lib/rateLimit';
import { handleError, handleValidationError } from '@/lib/errorHandler';
import { whatsappMetricsSchema, validateWithZod } from '@/lib/validations';

// Force dynamic rendering - Vercel cache buster
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';



/**
 * @swagger
 * /api/whatsapp/metrics:
 *   get:
 *     summary: Obtiene métricas de WhatsApp del día actual
 *     description: Retorna las métricas de WhatsApp para el día actual, incluyendo conteo de audios, tasa de éxito, errores, transacciones y monto total
 *     tags: [WhatsApp]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Métricas obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 audios:
 *                   type: integer
 *                   description: Número de audios procesados
 *                   example: 150
 *                 successRate:
 *                   type: integer
 *                   description: Tasa de éxito en porcentaje
 *                   example: 85
 *                 errors:
 *                   type: integer
 *                   description: Número de errores
 *                   example: 5
 *                 transactions:
 *                   type: integer
 *                   description: Número de transacciones creadas
 *                   example: 120
 *                 totalAmount:
 *                   type: number
 *                   description: Monto total procesado
 *                   example: 45000.50
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
 * @route GET /api/whatsapp/metrics
 * @description Obtiene métricas de WhatsApp del día actual
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

    const today = new Date().toISOString().split('T')[0];

    const { data: metrics } = await supabase
      .from('whatsapp_metrics')
      .select('*')
      .eq('date', today)
      .single();

    if (!metrics) {
      return NextResponse.json({
        audios: 0,
        successRate: 0,
        errors: 0,
        transactions: 0,
        totalAmount: 0
      });
    }

    const successRate = metrics.audios_count > 0 
      ? Math.round((metrics.success_count / metrics.audios_count) * 100)
      : 0;

    return NextResponse.json({
      audios: metrics.audios_count,
      successRate,
      errors: metrics.error_count,
      transactions: metrics.transactions_count,
      totalAmount: metrics.total_amount
    });
  } catch (error) {
    logger.error('Error fetching WhatsApp metrics:', error);
    return handleError(error, 'Error al obtener métricas de WhatsApp');
  }
}

/**
 * @swagger
 * /api/whatsapp/metrics:
 *   post:
 *     summary: Actualiza métricas de WhatsApp
 *     description: Actualiza o crea las métricas de WhatsApp para el día actual. Si ya existe un registro para hoy, lo actualiza; si no, crea uno nuevo.
 *     tags: [WhatsApp]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               audios_count:
 *                 type: integer
 *                 description: Número de audios procesados
 *                 example: 150
 *               success_count:
 *                 type: integer
 *                 description: Número de audios procesados exitosamente
 *                 example: 128
 *               error_count:
 *                 type: integer
 *                 description: Número de errores
 *                 example: 5
 *               transactions_count:
 *                 type: integer
 *                 description: Número de transacciones creadas
 *                 example: 120
 *               total_amount:
 *                 type: number
 *                 description: Monto total procesado
 *                 example: 45000.50
 *           example:
 *             audios_count: 150
 *             success_count: 128
 *             error_count: 5
 *             transactions_count: 120
 *             total_amount: 45000.50
 *     responses:
 *       200:
 *         description: Métricas actualizadas exitosamente
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
 * @route POST /api/whatsapp/metrics
 * @description Actualiza métricas de WhatsApp del día actual
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
    
    const validation = validateWithZod(whatsappMetricsSchema, body);
    if (!validation.success) {
      return handleValidationError(validation.error, validation.details);
    }

    const { audios_count, success_count, error_count, transactions_count, total_amount } = validation.data;

    const today = new Date().toISOString().split('T')[0];

    // Verificar si existe registro de hoy
    const { data: existing } = await supabase
      .from('whatsapp_metrics')
      .select('*')
      .eq('date', today)
      .single();

    if (existing) {
      // Actualizar
      const { error } = await supabase
        .from('whatsapp_metrics')
        .update({
          audios_count: audios_count ?? existing.audios_count,
          success_count: success_count ?? existing.success_count,
          error_count: error_count ?? existing.error_count,
          transactions_count: transactions_count ?? existing.transactions_count,
          total_amount: total_amount ?? existing.total_amount
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Crear nuevo
      const { error } = await supabase
        .from('whatsapp_metrics')
        .insert({
          date: today,
          audios_count: audios_count || 0,
          success_count: success_count || 0,
          error_count: error_count || 0,
          transactions_count: transactions_count || 0,
          total_amount: total_amount || 0
        });

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error updating WhatsApp metrics:', error);
    return handleError(error, 'Error al actualizar métricas de WhatsApp');
  }
}
