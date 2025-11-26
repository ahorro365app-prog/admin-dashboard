/**
 * POST /api/admin/cleanup
 * Ejecuta cleanup manual (protegido con CLEANUP_API_KEY)
 * 
 * Uso:
 * curl -X POST https://tu-app.com/api/admin/cleanup \
 *   -H "x-api-key: tu-cleanup-key"
 */

import { NextRequest, NextResponse } from 'next/server';
import { runNightlyCleanup } from '@/lib/cleanup-service';
import { adminApiRateLimit, getClientIdentifier, checkRateLimit } from '@/lib/rateLimit';
import { handleError } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';

// Force dynamic rendering - Vercel cache buster
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting (más estricto para cleanup)
    const identifier = getClientIdentifier(req as any);
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

    // 2. Verificar API key (solo server-side)
    const apiKey = req.headers.get('x-api-key');
    const expectedKey = process.env.CLEANUP_API_KEY;

    if (!apiKey || apiKey !== expectedKey) {
      logger.warn('⚠️ Cleanup attempted without valid API key');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Ejecutar cleanup
    const result = await runNightlyCleanup();

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          message: 'Cleanup ejecutado correctamente',
          data: result.data
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          error: (result as any).error
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    logger.error('❌ Error en endpoint cleanup:', error);
    return handleError(error, 'Error al ejecutar cleanup');
  }
}


