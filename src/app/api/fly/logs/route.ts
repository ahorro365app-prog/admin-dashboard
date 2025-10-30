import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const token = process.env.FLY_API_TOKEN;
    const app = process.env.FLY_APP_NAME;
    const machineId = process.env.FLY_MACHINE_ID;

    if (!token || !app || !machineId) {
      return NextResponse.json({ success: false, error: 'Missing Fly env vars' }, { status: 400 });
    }

    const url = `https://api.machines.dev/v1/apps/${app}/machines/${machineId}/logs?follow=false&instances=1&lines=100`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'fly-machine-platform': 'v1'
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ success: false, error: text || res.statusText }, { status: 500 });
    }

    const text = await res.text();
    return NextResponse.json({ success: true, logs: text });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch logs' }, { status: 500 });
  }
}


