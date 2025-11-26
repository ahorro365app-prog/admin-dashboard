import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { handleError, handleValidationError } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';

// Force dynamic rendering - Vercel cache buster
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BAILEYS_WORKER_URL = process.env.NEXT_PUBLIC_BAILEYS_WORKER_URL || 'http://localhost:3004';

/**
 * @swagger
 * /api/whatsapp/disconnect:
 *   post:
 *     summary: Desconecta la sesión de WhatsApp
 *     description: Desconecta la sesión de WhatsApp llamando al Baileys Worker y eliminando la sesión de Supabase. Después de desconectar, se debe recargar la página para ver el nuevo QR.
 *     tags: [WhatsApp]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [disconnect]
 *                 example: "disconnect"
 *           example:
 *             action: "disconnect"
 *     responses:
 *       200:
 *         description: Desconectado exitosamente
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
 *                   example: "Desconectado exitosamente. Recarga la página para ver el QR."
 *       400:
 *         description: Error de validación (acción inválida)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor o fallo al desconectar del worker
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * @route POST /api/whatsapp/disconnect
 * @description Desconecta la sesión de WhatsApp
 * @security Requiere autenticación de administrador (cookie)
 */
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'disconnect') {
      // 1. Llamar al worker para desconectar
      const workerResponse = await fetch(`${BAILEYS_WORKER_URL}/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!workerResponse.ok) {
        throw new Error('Failed to disconnect from worker');
      }

      // 2. Limpiar sesión en Supabase
      await supabase
        .from('whatsapp_session')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      return NextResponse.json({
        success: true,
        message: 'Desconectado exitosamente. Recarga la página para ver el QR.'
      });
    }

    return handleValidationError('Acción inválida. Solo se permite "disconnect"');
  } catch (error: any) {
    logger.error('Error disconnecting WhatsApp:', error);
    return handleError(error, 'Error al desconectar WhatsApp');
  }
}

