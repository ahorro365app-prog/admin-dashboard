import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateWeightedAccuracy } from '@/lib/calculateWeightedAccuracy';
import { adminApiRateLimit, getClientIdentifier, checkRateLimit } from '@/lib/rateLimit';
import { handleError, handleValidationError } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';
import { transactionEditSchema, validateWithZod } from '@/lib/validations';
import { logTransactionEdit } from '@/lib/audit-logger';
import { requireAuth } from '@/lib/auth-helpers';

// Force dynamic rendering - Vercel cache buster
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * @swagger
 * /api/transactions/edit:
 *   post:
 *     summary: Edita una transacción existente
 *     description: Permite editar una transacción validando los datos, actualizando la predicción, creando feedback con peso máximo (2.0), y recalculando la precisión ponderada. Puede habilitar modo automático si se alcanzan los umbrales.
 *     tags: [Transactions]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prediction_id
 *               - usuario_id
 *               - country_code
 *               - formData
 *             properties:
 *               prediction_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID de la predicción a editar
 *               usuario_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID del usuario propietario
 *               country_code:
 *                 type: string
 *                 description: Código de país para recalcular accuracy
 *               formData:
 *                 type: object
 *                 required:
 *                   - monto
 *                   - tipo
 *                   - categoria
 *                   - descripcion
 *                   - metodoPago
 *                   - moneda
 *                 properties:
 *                   monto:
 *                     type: number
 *                   tipo:
 *                     type: string
 *                     enum: [ingreso, gasto]
 *                   categoria:
 *                     type: string
 *                   descripcion:
 *                     type: string
 *                   metodoPago:
 *                     type: string
 *                   moneda:
 *                     type: string
 *           example:
 *             prediction_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *             usuario_id: "123e4567-e89b-12d3-a456-426614174000"
 *             country_code: "MX"
 *             formData:
 *               monto: 1500.50
 *               tipo: "gasto"
 *               categoria: "Comida"
 *               descripcion: "Almuerzo en restaurante"
 *               metodoPago: "tarjeta"
 *               moneda: "MXN"
 *     responses:
 *       200:
 *         description: Transacción editada exitosamente
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
 *                   example: "Transacción editada y validada (máximo peso)"
 *                 accuracy_recalculated:
 *                   type: boolean
 *                   example: true
 *                 accuracy:
 *                   type: number
 *                   example: 92.5
 *                 auto_enabled:
 *                   type: boolean
 *                   description: Solo presente si se habilitó modo automático
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
 *       404:
 *         description: Predicción no encontrada
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
 * @route POST /api/transactions/edit
 * @description Edita una transacción existente y recalcula accuracy
 * @security Requiere autenticación de administrador (cookie)
 * @rateLimit 100 requests / 15 minutos
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verificar autenticación
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) {
      return auth; // Error de autenticación
    }
    const { adminId } = auth;
    
    // 2. Rate limiting
    const identifier = getClientIdentifier(req as any);
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

    // 3. Leer y validar body
    const body = await req.json();
    
    const validation = validateWithZod(transactionEditSchema, body);
    if (!validation.success) {
      return handleValidationError(validation.error, validation.details);
    }

    const { prediction_id, usuario_id, country_code, formData } = validation.data;

    logger.debug(`✏️ Editando transacción: ${prediction_id}`);

    // ============================================================
    // OBTENER PREDICCIÓN (para timestamp original y datos anteriores)
    // ============================================================
    const { data: prediction } = await supabase
      .from('predicciones_groq')
      .select('original_timestamp, resultado, categoria_detectada')
      .eq('id', prediction_id)
      .single();

    if (!prediction) {
      return NextResponse.json({
        success: false,
        error: 'Predicción no encontrada'
      }, { status: 404 });
    }

    // Guardar datos anteriores para audit log
    const beforeData = {
      resultado: prediction.resultado,
      categoria: prediction.categoria_detectada
    };

    // ============================================================
    // PREPARAR DATOS ACTUALIZADOS
    // ============================================================
    const updatedResultado = {
      monto: parseFloat(formData.monto),
      tipo: formData.tipo,
      categoria: formData.categoria,
      descripcion: formData.descripcion,
      metodoPago: formData.metodoPago,
      moneda: formData.moneda
    };

    // ============================================================
    // ACTUALIZAR PREDICCIÓN
    // ============================================================
    await supabase
      .from('predicciones_groq')
      .update({
        resultado: updatedResultado,
        categoria_detectada: formData.categoria,
        confirmado: true,
        confirmado_por: 'app_edit',
        updated_at: new Date().toISOString()
      })
      .eq('id', prediction_id);

    logger.success('✅ Predicción actualizada');

    // ============================================================
    // ELIMINAR FEEDBACK ANTERIOR (si existe)
    // ============================================================
    await supabase
      .from('feedback_usuarios')
      .delete()
      .eq('prediction_id', prediction_id);

    logger.success('✅ Feedback anterior eliminado');

    // ============================================================
    // GUARDAR NUEVO FEEDBACK (weight=2.0 MÁXIMO)
    // ============================================================
    await supabase
      .from('feedback_usuarios')
      .insert({
        prediction_id,
        usuario_id,
        era_correcto: true,
        country_code,
        origen: 'app_edit',
        confiabilidad: 2.0
      });

    logger.success('✅ Feedback guardado (weight=2.0 MÁXIMO)');

    // ============================================================
    // CREAR TRANSACCIÓN CON TIMESTAMP ORIGINAL (NO cambia)
    // ============================================================
    await supabase
      .from('transacciones')
      .insert({
        usuario_id,
        tipo: formData.tipo,
        monto: parseFloat(formData.monto),
        categoria: formData.categoria,
        descripcion: formData.descripcion,
        fecha: prediction.original_timestamp, // ← TIMESTAMP ORIGINAL (NO CAMBIA)
        metodo_pago: formData.metodoPago,
        moneda: formData.moneda
      });

    logger.success('✅ Transacción creada con datos editados, timestamp original:', prediction.original_timestamp);

    // ============================================================
    // REGISTRAR EN AUDIT LOG (después de editar exitosamente)
    // ============================================================
    const afterData = {
      resultado: updatedResultado,
      categoria: formData.categoria
    };

    await logTransactionEdit(req, prediction_id, usuario_id, {
      before: beforeData,
      after: afterData
    });

    // ============================================================
    // RECALCULAR ACCURACY PONDERADA
    // ============================================================
    const { accuracy, verified_count } = await calculateWeightedAccuracy(supabase, country_code);

    await supabase
      .from('feedback_confirmation_config')
      .update({
        total_transactions: verified_count,
        accuracy: accuracy,
        updated_at: new Date().toISOString()
      })
      .eq('country_code', country_code);

    logger.success(`✅ Accuracy actualizada: ${accuracy}%`);

    // ============================================================
    // ¿CAMBIAR A AUTOMÁTICO?
    // ============================================================
    if (accuracy >= 90 && verified_count >= 1000) {
      logger.success(`🚀 ALERTA: ${country_code} alcanzó umbrales`);
      
      await supabase
        .from('feedback_confirmation_config')
        .update({
          require_confirmation: false,
          is_auto_enabled: true,
          updated_at: new Date().toISOString()
        })
        .eq('country_code', country_code);

      logger.success(`🚀 ${country_code} CAMBIADO A AUTOMÁTICO`);
      return NextResponse.json({
        success: true,
        message: 'Transacción editada y validada (máximo peso)',
        accuracy_recalculated: true,
        auto_enabled: true,
        accuracy: accuracy
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Transacción editada y validada (máximo peso)',
      accuracy_recalculated: true,
      accuracy: accuracy
    });

  } catch (error: any) {
    logger.error('❌ Error editando transacción:', error);
    return handleError(error, 'Error al editar transacción');
  }
}

