import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { logPaymentAction } from '@/lib/audit-logger'
import { logger } from '@/lib/logger'
import jwt from 'jsonwebtoken'
import { requireCSRF } from '@/lib/csrf'
import { adminApiRateLimit, getClientIdentifier, checkRateLimit } from '@/lib/rateLimit'
import { uuidSchema, paymentActionSchema, validateWithZod } from '@/lib/validations'
import { handleError, handleValidationError, handleAuthError, handleNotFoundError } from '@/lib/errorHandler'

/**
 * @swagger
 * /api/payments/{id}/verify:
 *   post:
 *     summary: Verifica y aprueba un pago pendiente
 *     description: Verifica un pago pendiente, lo marca como verificado, activa o renueva el plan Pro del usuario (30 días), y registra la acción en el audit log. Si el usuario ya tiene premium activo, se agregan 30 días a la fecha de expiración existente.
 *     tags: [Payments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID del pago a verificar
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - csrfToken
 *             properties:
 *               csrfToken:
 *                 type: string
 *                 description: Token CSRF obtenido de /api/csrf-token
 *           example:
 *             csrfToken: "csrf-token-string"
 *     responses:
 *       200:
 *         description: Pago verificado y plan activado/renovado exitosamente
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
 *                   example: "Pago verificado y plan Pro activado exitosamente (30 días desde hoy)"
 *                 data:
 *                   type: object
 *                   properties:
 *                     newExpirationDate:
 *                       type: string
 *                       format: date-time
 *                     daysRemaining:
 *                       type: integer
 *                     wasRenewal:
 *                       type: boolean
 *                     previousDaysRemaining:
 *                       type: integer
 *                       nullable: true
 *       400:
 *         description: Error de validación o pago ya procesado
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
 *         description: Pago no encontrado
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
 * @route POST /api/payments/{id}/verify
 * @description Verifica y aprueba un pago pendiente
 * @security Requiere autenticación de administrador (cookie) y CSRF token
 * @rateLimit 100 requests / 15 minutos
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // 2. Validar payment ID
    const validation = validateWithZod(uuidSchema, params.id);
    if (!validation.success) {
      return handleValidationError(validation.error, validation.details);
    }

    const paymentId = validation.data;

    // 3. Leer body y validar CSRF
    const body = await request.json();
    const csrfError = await requireCSRF(request, body.csrfToken);
    if (csrfError) {
      return csrfError;
    }

    // 4. Validar body con Zod
    const bodyValidation = validateWithZod(paymentActionSchema, body);
    if (!bodyValidation.success) {
      return handleValidationError(bodyValidation.error, bodyValidation.details);
    }

    // 5. Obtener el pago
    const supabase = getSupabaseAdmin();
    const { data: payment, error: paymentError } = await supabase
      .from('pagos')
      .select('*')
      .eq('id', paymentId)
      .single()

    if (paymentError || !payment) {
      return handleNotFoundError('Pago');
    }

    if (payment.estado !== 'pendiente') {
      return NextResponse.json(
        { success: false, message: 'Este pago ya fue procesado' },
        { status: 400 }
      )
    }

    // 6. Obtener el admin que está verificando (desde el token)
    const token = request.cookies.get('admin-token')?.value;
    if (!token) {
      return handleAuthError('No autenticado');
    }
    
    const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key-change-in-production';
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return handleAuthError('Token inválido');
    }
    
    const adminId = decoded.id;

    // 3. Actualizar el pago como verificado
    const { error: updateError } = await supabase
      .from('pagos')
      .update({
        estado: 'verificado',
        verificador_id: adminId,
        fecha_verificacion: new Date().toISOString()
      })
      .eq('id', paymentId)

    if (updateError) {
      logger.error('Error updating payment:', updateError)
      return handleError(updateError, 'Error al actualizar pago');
    }

    // 4. Obtener información del usuario para calcular la nueva fecha de expiración
    const { data: user, error: userFetchError } = await supabase
      .from('usuarios')
      .select('fecha_expiracion_suscripcion, suscripcion')
      .eq('id', payment.usuario_id)
      .single()

    if (userFetchError || !user) {
      logger.error('Error fetching user:', userFetchError)
      // Si no se puede obtener el usuario, revertir el estado del pago
      await supabase
        .from('pagos')
        .update({
          estado: 'pendiente',
          verificador_id: null,
          fecha_verificacion: null
        })
        .eq('id', paymentId)
      
      return handleError(userFetchError, 'Error al obtener información del usuario. El pago ha sido revertido a pendiente.');
    }

    // 5. Calcular nueva fecha de expiración (30 días)
    const now = new Date()
    let newExpirationDate: Date
    let daysRemainingBefore = 0

    if (
      user.fecha_expiracion_suscripcion &&
      new Date(user.fecha_expiracion_suscripcion) > now
    ) {
      // Usuario ya tiene premium activo: agregar 30 días a la fecha existente
      const currentExpiration = new Date(user.fecha_expiracion_suscripcion)
      daysRemainingBefore = Math.ceil((currentExpiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      newExpirationDate = new Date(currentExpiration)
      newExpirationDate.setDate(newExpirationDate.getDate() + 30) // Agregar 30 días
      
      logger.success(`✅ Usuario tiene ${daysRemainingBefore} días restantes. Agregando 30 días más. Nueva expiración: ${newExpirationDate.toISOString()}`)
    } else {
      // Usuario no tiene premium o ya expiró: establecer 30 días desde hoy
      newExpirationDate = new Date(now)
      newExpirationDate.setDate(newExpirationDate.getDate() + 30) // 30 días desde hoy
      
      logger.success('✅ Usuario sin premium activo. Estableciendo 30 días desde hoy.')
    }

    // 6. Activar/renovar plan Pro para el usuario
    const { error: userUpdateError } = await supabase
      .from('usuarios')
      .update({
        suscripcion: 'pro',
        fecha_expiracion_suscripcion: newExpirationDate.toISOString(),
        fecha_ultima_renovacion: now.toISOString()
      })
      .eq('id', payment.usuario_id)

    if (userUpdateError) {
      logger.error('Error updating user subscription:', userUpdateError)
      // Revertir el estado del pago si falla la actualización del usuario
      await supabase
        .from('pagos')
        .update({
          estado: 'pendiente',
          verificador_id: null,
          fecha_verificacion: null
        })
        .eq('id', paymentId)
      
      return handleError(userUpdateError, 'Error al actualizar suscripción del usuario. El pago ha sido revertido a pendiente.');
    }

    const isRenewal = daysRemainingBefore > 0
    const daysAdded = isRenewal
      ? `30 días agregados a la fecha existente (tenía ${daysRemainingBefore} días restantes)`
      : '30 días desde hoy'
    
    const totalDaysRemaining = Math.ceil((newExpirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    // Registrar en audit log
    await logPaymentAction(request, paymentId, 'verify_payment', {
      userId: payment.usuario_id,
      amount: payment.monto_usdt,
      plan: payment.plan,
      daysRemaining: totalDaysRemaining,
      wasRenewal: isRenewal,
    });

    return NextResponse.json({
      success: true,
      message: `Pago verificado y plan Pro ${isRenewal ? 'renovado' : 'activado'} exitosamente (${daysAdded})`,
      data: {
        newExpirationDate: newExpirationDate.toISOString(),
        daysRemaining: totalDaysRemaining,
        wasRenewal: isRenewal,
        previousDaysRemaining: daysRemainingBefore > 0 ? daysRemainingBefore : null
      }
    })

  } catch (error: any) {
    logger.error('Error in verify payment API:', error)
    return handleError(error, 'Error al verificar pago');
  }
}

