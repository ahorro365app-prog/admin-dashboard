import { NextRequest, NextResponse } from 'next/server'
import { createInitialAdmin } from '@/lib/supabase-auth'

// Force dynamic rendering - Vercel cache buster
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Initializing admin user in real Supabase database...')
    
    const success = await createInitialAdmin()
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Usuario administrador inicial creado exitosamente en la base de datos real'
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'El usuario administrador ya existe o hubo un error'
      })
    }

  } catch (error) {
    console.error('💥 Error initializing admin:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    success: false,
    message: 'Use POST method to initialize admin user'
  }, { status: 405 })
}

