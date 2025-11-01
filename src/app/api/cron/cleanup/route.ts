import { NextRequest, NextResponse } from 'next/server';
import { runNightlyCleanup } from '@/lib/cleanup-service';

export async function GET(req: NextRequest) {
  // Verificar que viene de Vercel
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runNightlyCleanup();
  return NextResponse.json(result);
}


