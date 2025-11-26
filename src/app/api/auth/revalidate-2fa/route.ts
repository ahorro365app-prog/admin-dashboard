import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { verifyTOTPToken, verifyBackupCode, removeUsedBackupCode } from '@/lib/totp-helpers'
import { requireCSRF } from '@/lib/csrf'
import { handleError, handleValidationError } from '@/lib/errorHandler'
import { logger } from '@/lib/logger'
import { requireAuth, setElevatedSessionCookie } from '@/lib/auth-helpers'
import { adminApiRateLimit, getClientIdentifier, checkRateLimit } from '@/lib/rateLimit'

const revalidateSchema = z.object({
  token: z.string().min(6).max(8),
  csrfToken: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) {
      return auth
    }

    const { adminId, email } = auth

    const identifier = getClientIdentifier(request as any)
    const rateLimitResult = await checkRateLimit(adminApiRateLimit, `${identifier}:reauth`)
    if (!rateLimitResult?.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Demasiadas solicitudes. Intenta nuevamente en unos minutos.',
          retryAfter: rateLimitResult ? new Date(rateLimitResult.reset).toISOString() : 'unknown',
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult
              ? Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString()
              : '900',
            'X-RateLimit-Limit': rateLimitResult?.limit.toString() || '200',
            'X-RateLimit-Remaining': rateLimitResult?.remaining.toString() || '0',
            'X-RateLimit-Reset': rateLimitResult?.reset.toString() || Date.now().toString(),
          },
        }
      )
    }

    const body = await request.json()
    const csrfError = await requireCSRF(request, body.csrfToken)
    if (csrfError) {
      return csrfError
    }

    const validation = revalidateSchema.safeParse(body)
    if (!validation.success) {
      return handleValidationError(
        validation.error.errors[0].message,
        validation.error.errors
      )
    }

    const { token } = validation.data

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, message: 'Configuración de Supabase incompleta' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: admin, error: adminError } = await supabase
      .from('admin_users')
      .select('id, email, totp_secret, totp_enabled, backup_codes')
      .eq('id', adminId)
      .single()

    if (adminError || !admin) {
      logger.error('❌ Admin user not found during revalidate-2fa:', adminError)
      return NextResponse.json(
        { success: false, message: 'Usuario administrador no encontrado' },
        { status: 404 }
      )
    }

    if (!admin.totp_enabled || !admin.totp_secret) {
      return NextResponse.json(
        { success: false, message: 'El 2FA no está habilitado para este usuario' },
        { status: 400 }
      )
    }

    let isValid = false
    let isBackupCode = false

    if (/^\d{6}$/.test(token)) {
      isValid = verifyTOTPToken(token, admin.totp_secret)
    } else if (/^[A-Z0-9]{8}$/.test(token.toUpperCase())) {
      const backupCodes = (admin.backup_codes || []) as string[]
      isValid = verifyBackupCode(token, backupCodes)
      isBackupCode = isValid

      if (isValid) {
        const updatedBackupCodes = removeUsedBackupCode(token, backupCodes)
        await supabase
          .from('admin_users')
          .update({ backup_codes: updatedBackupCodes })
          .eq('id', adminId)
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          message:
            'Formato de código inválido. Usa un código TOTP (6 dígitos) o un código de respaldo (8 caracteres).',
        },
        { status: 400 }
      )
    }

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Código 2FA inválido' },
        { status: 401 }
      )
    }

    const response = NextResponse.json({
      success: true,
      message: 'Privilegios elevados revalidados correctamente.',
    })

    setElevatedSessionCookie(response, { adminId, email })

    return response
  } catch (error) {
    logger.error('💥 Error en revalidate-2fa:', error)
    return handleError(error, 'Error al revalidar 2FA')
  }
}

