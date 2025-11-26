import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyTOTPToken, verifyBackupCode } from '@/lib/totp-helpers';
import { requireCSRF } from '@/lib/csrf';
import { handleError, handleAuthError, handleValidationError } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';
import { log2FAAction } from '@/lib/audit-logger';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { adminApiRateLimit, getClientIdentifier, checkRateLimit } from '@/lib/rateLimit';

const disable2FASchema = z.object({
  token: z.string().min(6).max(8), // Código 2FA para confirmar deshabilitación
});

/**
 * POST /api/auth/disable-2fa
 * 
 * Deshabilita 2FA para un usuario admin
 * Requiere autenticación y código 2FA válido
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
    const validation = disable2FASchema.safeParse(body);
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

    // Obtener datos del usuario
    const { data: admin, error: adminError } = await supabase
      .from('admin_users')
      .select('id, email, totp_secret, totp_enabled, backup_codes')
      .eq('id', adminId)
      .single();

    if (adminError || !admin) {
      logger.error('❌ Admin user not found:', adminError);
      return NextResponse.json({
        success: false,
        message: 'Usuario no encontrado'
      }, { status: 404 });
    }

    if (!admin.totp_enabled) {
      return NextResponse.json({
        success: false,
        message: '2FA no está habilitado'
      }, { status: 400 });
    }

    // Verificar código 2FA antes de deshabilitar
    let isValid = false;
    
    if (/^\d{6}$/.test(token)) {
      // Código TOTP
      if (!admin.totp_secret) {
        return NextResponse.json({
          success: false,
          message: 'Error: 2FA habilitado pero sin secreto configurado'
        }, { status: 500 });
      }
      isValid = verifyTOTPToken(token, admin.totp_secret);
    } else if (/^[A-Z0-9]{8}$/.test(token.toUpperCase())) {
      // Código de respaldo
      const backupCodes = (admin.backup_codes || []) as string[];
      isValid = verifyBackupCode(token, backupCodes);
    } else {
      return NextResponse.json({
        success: false,
        message: 'Formato de código inválido'
      }, { status: 400 });
    }

    if (!isValid) {
      logger.warn('❌ Código 2FA inválido al intentar deshabilitar 2FA para:', admin.email);
      return NextResponse.json({
        success: false,
        message: 'Código 2FA inválido'
      }, { status: 401 });
    }

    // Deshabilitar 2FA y limpiar datos
    const { error: updateError } = await supabase
      .from('admin_users')
      .update({
        totp_enabled: false,
        totp_secret: null,
        backup_codes: [],
      })
      .eq('id', adminId);

    if (updateError) {
      logger.error('❌ Error deshabilitando 2FA:', updateError);
      return handleError(updateError, 'Error deshabilitando 2FA');
    }

    logger.warn('⚠️ 2FA deshabilitado para:', admin.email);
    await log2FAAction(request, 'disable_2fa', { email: admin.email });

    return NextResponse.json({
      success: true,
      message: '2FA deshabilitado correctamente'
    });

  } catch (error: any) {
    logger.error('💥 Error en disable-2fa:', error);
    return handleError(error, 'Error deshabilitando 2FA');
  }
}

