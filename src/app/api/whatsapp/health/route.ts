import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { handleError } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';

// Force dynamic rendering - Vercel cache buster
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';



/**
 * @swagger
 * /api/whatsapp/health:
 *   get:
 *     summary: Verifica el estado de salud de WhatsApp y servicios relacionados
 *     description: Retorna el estado de salud de Baileys Worker, Supabase y el backend. Verifica la conexión de WhatsApp basándose en la última sincronización (conectado si last_sync es menor a 2 minutos).
 *     tags: [WhatsApp]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Estado de salud obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 baileys:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [ok, degraded]
 *                       example: "ok"
 *                     lastSync:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                 supabase:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [ok, error]
 *                       example: "ok"
 *                 backend:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "ok"
 *                     time:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error al verificar estado de salud
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * @route GET /api/whatsapp/health
 * @description Verifica el estado de salud de WhatsApp y servicios relacionados
 * @security Requiere autenticación de administrador (cookie)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    // Verificar conexión a Supabase
    const { error } = await supabase.from('whatsapp_session').select('id').limit(1);
    const supabaseOk = !error;

    // Estado básico de Baileys usando last_sync
    const { data: session } = await supabase
      .from('whatsapp_session')
      .select('last_sync')
      .single();

    const lastSync = session?.last_sync ? new Date(session.last_sync) : null;
    const now = new Date();
    const isConnected = lastSync ? (now.getTime() - lastSync.getTime()) < 120000 : false;

    return NextResponse.json({
      baileys: { status: isConnected ? 'ok' : 'degraded', lastSync: session?.last_sync || null },
      supabase: { status: supabaseOk ? 'ok' : 'error' },
      backend: { status: 'ok', time: now.toISOString() },
    });
  } catch (e: any) {
    logger.error('❌ Error en health check:', e);
    return handleError(e, 'Error al verificar estado de salud');
  }
}
