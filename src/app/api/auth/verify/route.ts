import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { handleError, handleAuthError } from '@/lib/errorHandler'
import { logger } from '@/lib/logger'

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verifica si el token de autenticación es válido
 *     description: Verifica el token JWT almacenado en las cookies. Retorna información del usuario si el token es válido.
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Token válido
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
 *                   example: "Token válido"
 *                 user:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: "admin@example.com"
 *                     role:
 *                       type: string
 *                       example: "admin"
 *       401:
 *         description: Token no encontrado o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * @route GET /api/auth/verify
 * @description Verifica si el token de autenticación es válido
 * @security Requiere token en cookie (admin-token)
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener token de las cookies
    const token = request.cookies.get('admin-token')?.value

    if (!token) {
      return handleAuthError('Token no encontrado');
    }

    // Verificar token
    const payload = verifyToken(token)

    if (!payload) {
      return handleAuthError('Token inválido');
    }

    // Token válido
    return NextResponse.json({
      success: true,
      message: 'Token válido',
      user: {
        email: payload.email,
        role: payload.role
      }
    })

  } catch (error: any) {
    logger.error('Verify API error:', error)
    return handleError(error, 'Error al verificar token');
  }
}

/**
 * @swagger
 * /api/auth/verify:
 *   post:
 *     summary: Método no permitido
 *     description: Este endpoint solo acepta GET. Usa GET para verificar el token.
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
 * @route POST /api/auth/verify
 * @description Método no permitido - usar GET
 */
export async function POST() {
  return NextResponse.json(
    { success: false, message: 'Método no permitido' },
    { status: 405 }
  )
}






