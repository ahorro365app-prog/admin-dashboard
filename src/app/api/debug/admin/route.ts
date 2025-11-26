import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sanitizeDebugData, logDebugAccess } from '@/lib/debug-sanitizer'

export async function GET(request: NextRequest) {
  // ⚠️ ENDPOINT DE DEBUG - SOLO PARA DESARROLLO
  // Bloquear en producción por seguridad
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Endpoint no disponible en producción' },
      { status: 404 }
    );
  }

  try {
    // Logging de acceso
    logDebugAccess('/api/debug/admin', request);
    
    console.log('🔍 Debug: Checking admin user in database...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Buscar el usuario admin
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', 'admin@demo.com')
      .single()

    if (error) {
      console.error('❌ Error finding admin user:', error)
      return NextResponse.json({
        success: false,
        message: 'Error finding admin user: ' + (error as Error).message,
        error: error
      })
    }

    if (!admin) {
      return NextResponse.json({
        success: false,
        message: 'Admin user not found'
      })
    }

    // Sanitizar datos antes de retornar
    const sanitizedAdmin = sanitizeDebugData(admin);
    
    console.log('✅ Admin user found:', {
      id: sanitizedAdmin.id,
      email: sanitizedAdmin.email,
      role: sanitizedAdmin.role,
      password_hash: '***REDACTED***',
      created_at: sanitizedAdmin.created_at
    })

    return NextResponse.json({
      success: true,
      message: 'Admin user found',
      data: sanitizedAdmin
    })

  } catch (error) {
    console.error('💥 Debug error:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno: ' + (error as Error).message },
      { status: 500 }
    )
  }
}







