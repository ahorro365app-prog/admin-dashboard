import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyTOTPToken, verifyBackupCode, removeUsedBackupCode } from '@/lib/totp-helpers';
import { requireCSRF } from '@/lib/csrf';
import { handleError, handleAuthError, handleValidationError } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { adminApiRateLimit, getClientIdentifier, checkRateLimit } from '@/lib/rateLimit';
import { setElevatedSessionCookie } from '@/lib/auth-helpers';

const verify2FALoginSchema = z.object({
  token: z.string().min(6).max(8), // Puede ser código TOTP (6) o backup code (8)
  sessionToken: z.string(), // Token temporal de sesión del primer paso de login
});

/**
 * POST /api/auth/verify-2fa-login
 * 
 * Verifica el código 2FA durante el login (después de validar email/password)
 * Acepta códigos TOTP (6 dígitos) o códigos de respaldo (8 caracteres)
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
    const validation = verify2FALoginSchema.safeParse(body);
    if (!validation.success) {
      return handleValidationError(
        validation.error.errors[0].message,
        validation.error.errors
      );
    }

    const { token, sessionToken } = validation.data;

    // Verificar y decodificar session token
    const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key-change-in-production';
    let sessionData: any;
    try {
      sessionData = jwt.verify(sessionToken, JWT_SECRET);
    } catch (error) {
      return handleAuthError('Token de sesión inválido o expirado');
    }

    // El session token debe tener un flag especial indicando que es temporal
    if (!sessionData.is2FASession || !sessionData.adminId) {
      return handleAuthError('Token de sesión inválido');
    }

    const adminId = sessionData.adminId;

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
        message: '2FA no está habilitado para este usuario'
      }, { status: 400 });
    }

    if (!admin.totp_secret) {
      return NextResponse.json({
        success: false,
        message: 'Error: 2FA habilitado pero sin secreto configurado'
      }, { status: 500 });
    }

    let isValid = false;
    let isBackupCode = false;

    // Determinar si es código TOTP (6 dígitos) o backup code (8 caracteres)
    if (/^\d{6}$/.test(token)) {
      // Código TOTP
      isValid = verifyTOTPToken(token, admin.totp_secret);
    } else if (/^[A-Z0-9]{8}$/.test(token.toUpperCase())) {
      // Código de respaldo
      const backupCodes = (admin.backup_codes || []) as string[];
      isValid = verifyBackupCode(token, backupCodes);
      isBackupCode = isValid;
      
      // Si es válido, eliminar el código usado
      if (isValid) {
        const updatedBackupCodes = removeUsedBackupCode(token, backupCodes);
        await supabase
          .from('admin_users')
          .update({ backup_codes: updatedBackupCodes })
          .eq('id', adminId);
        
        logger.warn('⚠️ Código de respaldo usado por:', admin.email);
      }
    } else {
      return NextResponse.json({
        success: false,
        message: 'Formato de código inválido. Usa un código TOTP (6 dígitos) o código de respaldo (8 caracteres).'
      }, { status: 400 });
    }

    if (!isValid) {
      logger.warn('❌ Código 2FA inválido para:', admin.email);
      return NextResponse.json({
        success: false,
        message: 'Código 2FA inválido'
      }, { status: 401 });
    }

    // Generar token JWT final
    const finalToken = jwt.sign(
      { 
        id: admin.id, 
        email: admin.email, 
        role: 'admin',
        is2FASession: false, // Token final, no es temporal
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    logger.success('✅ 2FA verificado correctamente para:', admin.email, isBackupCode ? '(backup code)' : '');

    // Crear respuesta exitosa
    const response = NextResponse.json({
      success: true,
      message: 'Login exitoso',
      user: {
        id: admin.id,
        email: admin.email,
        role: 'admin'
      },
      usedBackupCode: isBackupCode,
    });

    // Configurar cookie
    response.cookies.set('admin-token', finalToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
      path: '/'
    });

    setElevatedSessionCookie(response, { adminId: admin.id, email: admin.email });
 
    return response;

  } catch (error: any) {
    logger.error('💥 Error en verify-2fa-login:', error);
    return handleError(error, 'Error verificando 2FA');
  }
}

