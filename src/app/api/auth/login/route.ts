import { NextRequest, NextResponse } from 'next/server'
import { processLogin, COOKIE_CONFIG, REFRESH_COOKIE_CONFIG } from '@/lib/supabase-auth'
import { logger } from '@/lib/logger'
import { adminLoginRateLimit, getClientIdentifier, checkRateLimit } from '@/lib/rateLimit'
import { handleError, handleValidationError } from '@/lib/errorHandler'
import { adminLoginSchema, validateWithZod } from '@/lib/validations'

// Force dynamic rendering - Vercel cache buster
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Autenticación de administrador (Supabase)
 *     description: Autentica un administrador usando Supabase. Retorna tokens JWT y configura cookies seguras.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "admin@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "password123"
 *           example:
 *             email: "admin@example.com"
 *             password: "password123"
 *     responses:
 *       200:
 *         description: Login exitoso
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
 *                   example: "Login exitoso"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     email:
 *                       type: string
 *                       format: email
 *         headers:
 *           Set-Cookie:
 *             description: Cookies de autenticación (admin-token, admin-refresh-token)
 *             schema:
 *               type: string
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit excedido (5 requests / 15 minutos)
 *         headers:
 *           X-RateLimit-Limit:
 *             schema:
 *               type: integer
 *               example: 5
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
 * @route POST /api/auth/login
 * @description Autenticación de administrador usando Supabase
 * @rateLimit 5 requests / 15 minutos
 */
export async function POST(request: NextRequest) {
  logger.debug('🔐 Real Supabase Login API called')
  
  try {
    // 1. Rate limiting
    const identifier = getClientIdentifier(request as any);
    const rateLimitResult = await checkRateLimit(adminLoginRateLimit, identifier);
    if (!rateLimitResult?.success) {
      logger.warn(`⛔ Rate limit exceeded for ${identifier}`);
      return NextResponse.json(
        {
          success: false,
          message: 'Demasiados intentos de login. Por favor, intenta más tarde.',
          retryAfter: rateLimitResult ? new Date(rateLimitResult.reset).toISOString() : 'unknown',
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult ? Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString() : '900',
            'X-RateLimit-Limit': rateLimitResult?.limit.toString() || '5',
            'X-RateLimit-Remaining': rateLimitResult?.remaining.toString() || '0',
            'X-RateLimit-Reset': rateLimitResult?.reset.toString() || Date.now().toString(),
          },
        }
      );
    }

    // 2. Leer y validar body
    const body = await request.json()
    logger.debug('📦 Request body:', body)
    
    const validation = validateWithZod(adminLoginSchema, body);
    if (!validation.success) {
      return handleValidationError(validation.error, validation.details);
    }

    const { email, password } = validation.data

    logger.debug('✅ Validating credentials for:', email)
    
    // Procesar login con Supabase real
    const result = await processLogin({ email, password })
    logger.debug('🔍 Login result:', result)

    if (!result.success) {
      logger.warn('❌ Login failed:', result.message)
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 401 }
      )
    }

    logger.success('✅ Login successful, setting cookies')
    
    // Crear respuesta exitosa
    const response = NextResponse.json({
      success: true,
      message: 'Login exitoso',
      user: result.user
    })

    // Configurar cookies seguras
    if (result.token) {
      logger.debug('🍪 Setting admin-token cookie')
      response.cookies.set('admin-token', result.token, COOKIE_CONFIG)
    }

    if (result.refreshToken) {
      logger.debug('🍪 Setting admin-refresh-token cookie')
      response.cookies.set('admin-refresh-token', result.refreshToken, REFRESH_COOKIE_CONFIG)
    }

    logger.success('🎉 Real Supabase Login API completed successfully')
    return response

  } catch (error) {
    logger.error('💥 Real Supabase Login API error:', error)
    return handleError(error, 'Error al procesar login');
  }
}

/**
 * @swagger
 * /api/auth/login:
 *   get:
 *     summary: Método no permitido
 *     description: Este endpoint solo acepta POST. Usa POST para autenticarse.
 *     tags: [Auth]
 *     responses:
 *       405:
 *         description: Método no permitido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Método no permitido"
 * 
 * @route GET /api/auth/login
 * @description Método no permitido - usar POST
 */
export async function GET() {
  return NextResponse.json(
    { success: false, message: 'Método no permitido' },
    { status: 405 }
  )
}

