import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'
import { comparePassword, isBcryptHash, hashPassword } from '@/lib/bcrypt-helpers'
import { adminLoginRateLimit, getClientIdentifier, checkRateLimit } from '@/lib/rateLimit'
import { adminLoginSchema, validateWithZod } from '@/lib/validations'
import { handleError, handleValidationError } from '@/lib/errorHandler'
import { requireCSRF } from '@/lib/csrf'
import { logger } from '@/lib/logger'
import { logLogin, logLoginFailed } from '@/lib/audit-logger'

/**
 * @swagger
 * /api/auth/simple-login:
 *   post:
 *     summary: Autenticación de administrador
 *     description: Autentica un administrador con email y contraseña. Retorna un JWT token que se almacena en cookie HttpOnly.
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
 *               - csrfToken
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *               csrfToken:
 *                 type: string
 *                 description: Token CSRF obtenido de /api/csrf-token
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
 *                   example: Login exitoso
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     nombre:
 *                       type: string
 *         headers:
 *           Set-Cookie:
 *             description: Cookie HttpOnly con JWT token
 *             schema:
 *               type: string
 *       400:
 *         description: Error de validación o credenciales inválidas
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
 *           X-RateLimit-Remaining:
 *             schema:
 *               type: integer
 *               example: 0
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
 * @route POST /api/auth/simple-login
 * @description Autentica un administrador con email y contraseña
 * @security Requiere CSRF token
 * @rateLimit 5 requests / 15 minutos
 */
export async function POST(request: NextRequest) {
  logger.debug('🔐 Simple Login API called')
  
  try {
    // Rate limiting: verificar límites antes de procesar
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await checkRateLimit(adminLoginRateLimit, identifier);
    
    if (!rateLimitResult || !rateLimitResult.success) {
      const resetTime = rateLimitResult ? new Date(rateLimitResult.reset).toISOString() : 'unknown';
      logger.warn(`⛔ Rate limit exceeded for ${identifier}`);
      return NextResponse.json(
        {
          success: false,
          message: 'Demasiados intentos de login. Por favor, intenta de nuevo más tarde.',
          retryAfter: resetTime,
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

    const body = await request.json()
    logger.debug('📦 Request body:', body)
    
    // Validar CSRF token (después de leer el body para extraer el token)
    const csrfError = await requireCSRF(request, body.csrfToken);
    if (csrfError) {
      return csrfError;
    }
    
    // Validar con Zod
    const validation = validateWithZod(adminLoginSchema, body);
    if (!validation.success) {
      return handleValidationError(validation.error, validation.details);
    }
    
    const { email, password } = validation.data;

    logger.debug('🔍 Validating credentials for:', email)

    // Configuración de Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      logger.error('❌ Supabase credentials not configured')
      return NextResponse.json({
        success: false,
        message: 'Configuración de Supabase no encontrada'
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Buscar el usuario administrador
    // Intentar incluir campos de 2FA, pero si no existen, usar select('*')
    let admin: any;
    let error: any;
    
    try {
      const result = await supabase
        .from('admin_users')
        .select('id, email, password_hash, role, totp_enabled, totp_secret')
        .eq('email', email)
        .eq('role', 'admin')
        .single();
      
      admin = result.data;
      error = result.error;
    } catch (err: any) {
      // Si falla por columnas inexistentes, intentar con select('*')
      logger.debug('⚠️ Columnas 2FA no encontradas, usando select(*)');
      const result = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('role', 'admin')
        .single();
      
      admin = result.data;
      error = result.error;
      
      // Si las columnas no existen, asumir que 2FA está deshabilitado
      if (admin) {
        admin.totp_enabled = false;
        admin.totp_secret = null;
      }
    }

    if (error) {
      logger.error('❌ Error finding admin user:', (error as Error).message)
      return NextResponse.json({
        success: false,
        message: 'Error finding admin user: ' + (error as Error).message
      })
    }

    if (!admin) {
      logger.warn('❌ Admin user not found')
      await logLoginFailed(request, email, 'Usuario administrador no encontrado');
      return NextResponse.json({
        success: false,
        message: 'Usuario administrador no encontrado'
      })
    }

    logger.debug('✅ Admin user found:', admin.email)

    // Verificar contraseña con bcrypt
    // Soporta migración: si el hash no es bcrypt, compara en texto plano (temporal)
    let passwordMatch = false;
    
    if (isBcryptHash(admin.password_hash)) {
      // Hash bcrypt válido, usar comparación segura
      passwordMatch = await comparePassword(password, admin.password_hash);
    } else {
      // Hash en texto plano (migración temporal)
      // Si coincide, hashear y actualizar en la BD
      if (password === admin.password_hash) {
        logger.warn('⚠️ Password en texto plano detectado, migrando a bcrypt...');
        const hashedPassword = await hashPassword(password);
        
        // Actualizar contraseña en la BD
        await supabase
          .from('admin_users')
          .update({ password_hash: hashedPassword })
          .eq('id', admin.id);
        
        passwordMatch = true;
        logger.success('✅ Contraseña migrada a bcrypt');
      }
    }

    if (passwordMatch) {
      logger.debug('✅ Password match')
      
      // Verificar si tiene 2FA habilitado
      const has2FA = admin.totp_enabled === true;
      
      if (has2FA) {
        // Si tiene 2FA, generar token temporal de sesión
        const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key-change-in-production';
        const sessionToken = jwt.sign(
          { 
            adminId: admin.id,
            email: admin.email,
            is2FASession: true, // Flag para indicar que es sesión temporal
          }, 
          JWT_SECRET, 
          { expiresIn: '5m' } // Token temporal válido por 5 minutos
        );

        logger.debug('✅ 2FA requerido, generando token temporal');

        return NextResponse.json({
          success: true,
          requires2FA: true,
          sessionToken: sessionToken,
          message: 'Ingresa tu código 2FA'
        });
      }
      
      // Si no tiene 2FA, proceder con login normal
      const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key-change-in-production'
      const token = jwt.sign(
        { 
          id: admin.id, 
          email: admin.email, 
          role: admin.role 
        }, 
        JWT_SECRET, 
        { expiresIn: '24h' }
      )

      logger.debug('✅ Token generated')

      // Crear respuesta exitosa
      const response = NextResponse.json({
        success: true,
        message: 'Login exitoso',
        user: {
          id: admin.id,
          email: admin.email,
          role: admin.role
        }
      })

      // Configurar cookie
      response.cookies.set('admin-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
        path: '/'
      })

      logger.success('🎉 Login completed successfully')
      await logLogin(request, admin.id, admin.email);
      return response
      
    } else {
      logger.warn('❌ Password mismatch')
      await logLoginFailed(request, email, 'Contraseña incorrecta');
      return NextResponse.json({
        success: false,
        message: 'Contraseña incorrecta'
      })
    }

  } catch (error) {
    logger.error('💥 Simple Login API error:', error)
    return handleError(error, 'Error en el login');
  }
}

/**
 * @swagger
 * /api/auth/simple-login:
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
 *                   example: "Use POST method for login"
 * 
 * @route GET /api/auth/simple-login
 * @description Método no permitido - usar POST
 */
export async function GET() {
  return NextResponse.json({
    success: false,
    message: 'Use POST method for login'
  }, { status: 405 })
}

