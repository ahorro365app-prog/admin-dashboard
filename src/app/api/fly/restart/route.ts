import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const token = process.env.FLY_API_TOKEN;
    const app = process.env.FLY_APP_NAME;
    const machineId = process.env.FLY_MACHINE_ID;

    if (!token || !app || !machineId) {
      return NextResponse.json({ success: false, error: 'Missing Fly env vars' }, { status: 400 });
    }

    const res = await fetch(`https://api.machines.dev/v1/apps/${app}/machines/${machineId}/restart`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'fly-machine-platform': 'v1'
      },
      body: JSON.stringify({})
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ success: false, error: text || res.statusText }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Restart failed' }, { status: 500 });
  }
}


