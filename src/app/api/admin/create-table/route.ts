import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('🗄️ Creating admin_users table using direct operations...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Primero, verificar si la tabla ya existe
    const { data: existingData, error: checkError } = await supabase
      .from('admin_users')
      .select('*')
      .limit(1)

    if (checkError && checkError.code === 'PGRST116') {
      // La tabla no existe, necesitamos crearla manualmente
      console.log('📋 Table does not exist, creating admin user directly...')
      
      // Crear el usuario admin directamente
      const adminData = {
        id: 'admin-temp-' + Date.now(),
        email: 'admin@demo.com',
        password_hash: 'admin123',
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Intentar insertar directamente
      const { data: insertData, error: insertError } = await supabase
        .from('admin_users')
        .insert([adminData])
        .select()

      if (insertError) {
        console.error('Error inserting admin user:', insertError)
        return NextResponse.json({
          success: false,
          message: 'Error creando usuario admin: ' + (insertError as Error).message + '. Necesitas crear la tabla admin_users manualmente en Supabase SQL Editor.'
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Usuario admin creado exitosamente (tabla creada automáticamente)',
        data: insertData
      })
    }

    if (checkError) {
      console.error('Error checking table:', checkError)
      return NextResponse.json({
        success: false,
        message: 'Error verificando tabla: ' + (checkError as Error).message
      }, { status: 500 })
    }

    console.log('✅ Admin table exists')
    
    return NextResponse.json({
      success: true,
      message: 'Tabla admin_users ya existe',
      data: existingData
    })

  } catch (error) {
    console.error('💥 Error creating admin table:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    success: false,
    message: 'Use POST method to create admin table'
  }, { status: 405 })
}

