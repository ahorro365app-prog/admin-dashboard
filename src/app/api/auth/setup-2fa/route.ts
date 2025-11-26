import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateTOTPSecret, generateBackupCodes, hashBackupCode } from '@/lib/totp-helpers';
import { requireCSRF } from '@/lib/csrf';
import { handleError, handleAuthError } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';
import { log2FAAction } from '@/lib/audit-logger';
import jwt from 'jsonwebtoken';
import { adminApiRateLimit, getClientIdentifier, checkRateLimit } from '@/lib/rateLimit';

/**
 * POST /api/auth/setup-2fa
 * 
 * Genera un secreto TOTP y códigos de respaldo para configurar 2FA
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

    // Verificar autenticación
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
    const email = decoded.email;

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

    // Verificar que el usuario existe
    const { data: admin, error: adminError } = await supabase
      .from('admin_users')
      .select('id, email, totp_enabled')
      .eq('id', adminId)
      .single();

    if (adminError || !admin) {
      logger.error('❌ Admin user not found:', adminError);
      return NextResponse.json({
        success: false,
        message: 'Usuario no encontrado'
      }, { status: 404 });
    }

    // Si ya tiene 2FA habilitado, no permitir configurar de nuevo
    if (admin.totp_enabled) {
      return NextResponse.json({
        success: false,
        message: '2FA ya está habilitado. Deshabilítalo primero si quieres reconfigurarlo.'
      }, { status: 400 });
    }

    // Generar secreto TOTP y QR code
    const { secret, otpauthUrl, qrCodeDataUrl } = await generateTOTPSecret(email);

    // Generar códigos de respaldo
    const backupCodes = generateBackupCodes(10);
    const hashedBackupCodes = backupCodes.map(code => hashBackupCode(code));

    // Guardar secreto y códigos de respaldo en la BD (sin habilitar aún)
    const { error: updateError } = await supabase
      .from('admin_users')
      .update({
        totp_secret: secret,
        backup_codes: hashedBackupCodes,
      })
      .eq('id', adminId);

    if (updateError) {
      logger.error('❌ Error guardando secreto TOTP:', updateError);
      return handleError(updateError, 'Error guardando configuración 2FA');
    }

    logger.success('✅ 2FA setup iniciado para:', email);
    await log2FAAction(request, 'setup_2fa', { email });

    return NextResponse.json({
      success: true,
      secret: secret, // Enviar para verificación inicial
      qrCode: qrCodeDataUrl,
      backupCodes: backupCodes, // Mostrar solo una vez
      message: 'Escanea el QR code con tu app de autenticación y verifica con un código'
    });

  } catch (error: any) {
    logger.error('💥 Error en setup-2fa:', error);
    return handleError(error, 'Error configurando 2FA');
  }
}

