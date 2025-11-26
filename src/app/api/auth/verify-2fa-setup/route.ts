import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyTOTPToken } from '@/lib/totp-helpers';
import { requireCSRF } from '@/lib/csrf';
import { handleError, handleAuthError, handleValidationError } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';
import { log2FAAction } from '@/lib/audit-logger';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { adminApiRateLimit, getClientIdentifier, checkRateLimit } from '@/lib/rateLimit';

const verify2FASchema = z.object({
  token: z.string().length(6, 'El código debe tener 6 dígitos').regex(/^\d{6}$/, 'El código debe contener solo números'),
});

/**
 * POST /api/auth/verify-2fa-setup
 * 
 * Verifica el código TOTP durante la configuración inicial y habilita 2FA
 * Requiere autenticación (token JWT en cookie)
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

    // 2. Validar CSRF
    const body = await request.json();
    const csrfError = await requireCSRF(request, body.csrfToken);
    if (csrfError) {
      return csrfError;
    }

    // Validar input
    const validation = verify2FASchema.safeParse(body);
    if (!validation.success) {
      return handleValidationError(
        validation.error.errors[0].message,
        validation.error.errors
      );
    }

    const { token } = validation.data;

    // Verificar autenticación
    const jwtToken = request.cookies.get('admin-token')?.value;
    if (!jwtToken) {
      return handleAuthError('No autenticado');
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key-change-in-production';
    let decoded: any;
    try {
      decoded = jwt.verify(jwtToken, JWT_SECRET);
    } catch (error) {
      return handleAuthError('Token inválido');
    }

    const adminId = decoded.id;

    // Configuración de Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      logger.error('❌ Supabase credentials not configured');
      return NextResponse.json({
        success: false,
        message: 'Configuración de Supabase no encontrada'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener secreto TOTP del usuario
    const { data: admin, error: adminError } = await supabase
      .from('admin_users')
      .select('id, email, totp_secret, totp_enabled')
      .eq('id', adminId)
      .single();

    if (adminError || !admin) {
      logger.error('❌ Admin user not found:', adminError);
      return NextResponse.json({
        success: false,
        message: 'Usuario no encontrado'
      }, { status: 404 });
    }

    if (!admin.totp_secret) {
      return NextResponse.json({
        success: false,
        message: 'No hay secreto TOTP configurado. Ejecuta setup-2fa primero.'
      }, { status: 400 });
    }

    if (admin.totp_enabled) {
      return NextResponse.json({
        success: false,
        message: '2FA ya está habilitado.'
      }, { status: 400 });
    }

    // Verificar código TOTP
    const isValid = verifyTOTPToken(token, admin.totp_secret);
    
    if (!isValid) {
      logger.warn('❌ Código TOTP inválido durante setup para:', admin.email);
      return NextResponse.json({
        success: false,
        message: 'Código TOTP inválido. Asegúrate de usar el código más reciente.'
      }, { status: 400 });
    }

    // Habilitar 2FA
    const { error: updateError } = await supabase
      .from('admin_users')
      .update({
        totp_enabled: true,
      })
      .eq('id', adminId);

    if (updateError) {
      logger.error('❌ Error habilitando 2FA:', updateError);
      return handleError(updateError, 'Error habilitando 2FA');
    }

    logger.success('✅ 2FA habilitado para:', admin.email);
    await log2FAAction(request, 'verify_2fa', { email: admin.email });

    return NextResponse.json({
      success: true,
      message: '2FA habilitado correctamente'
    });

  } catch (error: any) {
    logger.error('💥 Error en verify-2fa-setup:', error);
    return handleError(error, 'Error verificando 2FA');
  }
}

