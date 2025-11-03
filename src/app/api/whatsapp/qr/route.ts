import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - Vercel cache buster
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BAILEYS_WORKER_URL = process.env.NEXT_PUBLIC_BAILEYS_WORKER_URL || 'http://localhost:3004';

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
  } catch (error) {
    console.error('Error fetching QR from worker:', error);
    
    // Retornar estado desconectado si falla
    return NextResponse.json({
      success: false,
      qr: null,
      connected: false,
      timestamp: null
    });
  }
}

