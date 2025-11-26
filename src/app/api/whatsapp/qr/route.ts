import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// Force dynamic rendering - Vercel cache buster
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BAILEYS_WORKER_URL = process.env.NEXT_PUBLIC_BAILEYS_WORKER_URL || 'http://localhost:3004';

/**
 * @swagger
 * /api/whatsapp/qr:
 *   get:
 *     summary: Obtiene el código QR para conectar WhatsApp
 *     description: Obtiene el código QR actual para conectar WhatsApp desde el Baileys Worker. Si ya está conectado, retorna null en el campo qr.
 *     tags: [WhatsApp]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: QR obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 qr:
 *                   type: string
 *                   nullable: true
 *                   description: Código QR en formato string (null si ya está conectado)
 *                 connected:
 *                   type: boolean
 *                   description: Indica si WhatsApp está conectado
 *                   example: false
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error al obtener QR del worker
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 qr:
 *                   type: null
 *                 connected:
 *                   type: boolean
 *                   example: false
 *                 timestamp:
 *                   type: null
 * 
 * @route GET /api/whatsapp/qr
 * @description Obtiene el código QR para conectar WhatsApp
 * @security Requiere autenticación de administrador (cookie)
 */
export async function GET(request: NextRequest) {
  try {
    // Proxy a Baileys Worker
    const response = await fetch(`${BAILEYS_WORKER_URL}/qr`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch QR from worker');
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      qr: data.qr,
      connected: data.connected || !data.qr,
      timestamp: data.timestamp
    });
  } catch (error: any) {
    logger.error('Error fetching QR from worker:', error);
    
    // Retornar estado desconectado si falla
    return NextResponse.json({
      success: false,
      qr: null,
      connected: false,
      timestamp: null
    });
  }
}

