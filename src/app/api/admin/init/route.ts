import { NextRequest, NextResponse } from 'next/server'
import { createInitialAdmin } from '@/lib/supabase-auth'
import { adminApiRateLimit, getClientIdentifier, checkRateLimit } from '@/lib/rateLimit'
import { handleError } from '@/lib/errorHandler'
import { logger } from '@/lib/logger'

// Force dynamic rendering - Vercel cache buster
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * @swagger
 * /api/admin/init:
 *   post:
 *     summary: Inicializa el usuario administrador
 *     description: Crea el usuario administrador inicial en la base de datos Supabase. Solo debe ejecutarse una vez durante la configuración inicial del sistema.
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Usuario administrador creado exitosamente o ya existe
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
 *                   example: "Usuario administrador inicial creado exitosamente en la base de datos real"
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
 * @route POST /api/admin/init
 * @description Inicializa el usuario administrador en la base de datos
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

    logger.debug('🔧 Initializing admin user in real Supabase database...')
    
    const success = await createInitialAdmin()
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Usuario administrador inicial creado exitosamente en la base de datos real'
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'El usuario administrador ya existe o hubo un error'
      })
    }

  } catch (error) {
    logger.error('💥 Error initializing admin:', error)
    return handleError(error, 'Error al inicializar usuario admin');
  }
}

/**
 * @swagger
 * /api/admin/init:
 *   get:
 *     summary: Método no permitido
 *     description: Este endpoint solo acepta POST. Usa POST para inicializar el usuario administrador.
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
 *                   example: "Use POST method to initialize admin user"
 * 
 * @route GET /api/admin/init
 * @description Método no permitido - usar POST
 */
export async function GET() {
  return NextResponse.json({
    success: false,
    message: 'Use POST method to initialize admin user'
  }, { status: 405 })
}

