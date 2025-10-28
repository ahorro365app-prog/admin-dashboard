import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
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

    console.log('✅ Admin user found:', {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      password_hash: admin.password_hash,
      created_at: admin.created_at
    })

    return NextResponse.json({
      success: true,
      message: 'Admin user found',
      data: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        password_hash: admin.password_hash,
        created_at: admin.created_at
      }
    })

  } catch (error) {
    console.error('💥 Debug error:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno: ' + (error as Error).message },
      { status: 500 }
    )
  }
}







