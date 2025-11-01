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

export async function POST(req: NextRequest) {
  try {
    // Verificar API key (solo server-side)
    const apiKey = req.headers.get('x-api-key');
    const expectedKey = process.env.CLEANUP_API_KEY;

    if (!apiKey || apiKey !== expectedKey) {
      console.warn('⚠️ Cleanup attempted without valid API key');
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
    console.error('❌ Error en endpoint cleanup:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error interno'
      },
      { status: 500 }
    );
  }
}


