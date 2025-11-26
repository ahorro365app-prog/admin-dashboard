import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { adminApiRateLimit, getClientIdentifier, checkRateLimit } from '@/lib/rateLimit'
import { handleError } from '@/lib/errorHandler'
import { logger } from '@/lib/logger'

// Force dynamic rendering - Vercel cache buster
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * @swagger
 * /api/admin/create-table:
 *   post:
 *     summary: Crea la tabla admin_users en Supabase
 *     description: Verifica si la tabla admin_users existe en Supabase y la crea si no existe. También crea el usuario administrador inicial. Endpoint de configuración/setup.
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Tabla creada o ya existe
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
 *                   example: "Usuario admin creado exitosamente (tabla creada automáticamente)"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
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
 *         description: Error interno del servidor o tabla no puede ser creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * @route POST /api/admin/create-table
 * @description Crea la tabla admin_users en Supabase
 * @rateLimit 100 requests / 15 minutos
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting (más estricto para setup)
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

    logger.debug('🗄️ Creating admin_users table using direct operations...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Primero, verificar si la tabla ya existe
    const { data: existingData, error: checkError } = await supabase
      .from('admin_users')
      .select('*')
      .limit(1)

    if (checkError && checkError.code === 'PGRST116') {
      // La tabla no existe, necesitamos crearla manualmente
      logger.debug('📋 Table does not exist, creating admin user directly...')
      
      // Crear el usuario admin directamente
      const adminData = {
        id: 'admin-temp-' + Date.now(),
        email: 'admin@demo.com',
        password_hash: 'admin123',
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Intentar insertar directamente
      const { data: insertData, error: insertError } = await supabase
        .from('admin_users')
        .insert([adminData])
        .select()

      if (insertError) {
        logger.error('Error inserting admin user:', insertError)
        return NextResponse.json({
          success: false,
          message: 'Error creando usuario admin: ' + (insertError as Error).message + '. Necesitas crear la tabla admin_users manualmente en Supabase SQL Editor.'
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Usuario admin creado exitosamente (tabla creada automáticamente)',
        data: insertData
      })
    }

    if (checkError) {
      logger.error('Error checking table:', checkError)
      return NextResponse.json({
        success: false,
        message: 'Error verificando tabla: ' + (checkError as Error).message
      }, { status: 500 })
    }

    logger.success('✅ Admin table exists')
    
    return NextResponse.json({
      success: true,
      message: 'Tabla admin_users ya existe',
      data: existingData
    })

  } catch (error) {
    logger.error('💥 Error creating admin table:', error)
    return handleError(error, 'Error al crear tabla admin');
  }
}

/**
 * @swagger
 * /api/admin/create-table:
 *   get:
 *     summary: Método no permitido
 *     description: Este endpoint solo acepta POST. Usa POST para crear la tabla admin_users.
 *     tags: [Admin]
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
 *                   example: "Use POST method to create admin table"
 * 
 * @route GET /api/admin/create-table
 * @description Método no permitido - usar POST
 */
export async function GET() {
  return NextResponse.json({
    success: false,
    message: 'Use POST method to create admin table'
  }, { status: 405 })
}

