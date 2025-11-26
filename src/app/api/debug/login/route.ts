import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { comparePassword, isBcryptHash, hashPassword } from '@/lib/bcrypt-helpers'
import { sanitizeDebugData, logDebugAccess } from '@/lib/debug-sanitizer'

export async function POST(request: NextRequest) {
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
    logDebugAccess('/api/debug/login', request);
    
    console.log('🔍 Debug Login: Starting...')
    
    const body = await request.json()
    // No loguear el body completo por seguridad (puede contener password)
    console.log('📦 Request body received (password hidden)')
    
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: 'Email y contraseña son requeridos'
      }, { status: 400 })
    }

    console.log('🔍 Validating credentials for:', email)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Buscar el usuario administrador
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .eq('role', 'admin')
      .single()

    if (error) {
      console.log('❌ Error finding admin user:', (error as Error).message)
      return NextResponse.json({
        success: false,
        message: 'Error finding admin user: ' + (error as Error).message
      })
    }

    if (!admin) {
      console.log('❌ Admin user not found')
      return NextResponse.json({
        success: false,
        message: 'Admin user not found'
      })
    }

    console.log('✅ Admin user found:', admin.email)

    // Verificar contraseña con bcrypt
    // Soporta migración: si el hash no es bcrypt, compara en texto plano (temporal)
    let passwordMatch = false;
    
    if (isBcryptHash(admin.password_hash)) {
      // Hash bcrypt válido, usar comparación segura
      passwordMatch = await comparePassword(password, admin.password_hash);
    } else {
      // Hash en texto plano (migración temporal)
      // Si coincide, hashear y actualizar en la BD
      if (password === admin.password_hash) {
        console.log('⚠️ Password en texto plano detectado, migrando a bcrypt...');
        const hashedPassword = await hashPassword(password);
        
        // Actualizar contraseña en la BD
        await supabase
          .from('admin_users')
          .update({ password_hash: hashedPassword })
          .eq('id', admin.id);
        
        passwordMatch = true;
        console.log('✅ Contraseña migrada a bcrypt');
      }
    }

    if (passwordMatch) {
      console.log('✅ Password match')
      
      // Sanitizar datos del usuario antes de retornar
      const sanitizedUser = sanitizeDebugData({
        id: admin.id,
        email: admin.email,
        role: admin.role
      });
      
      return NextResponse.json({
        success: true,
        message: 'Login exitoso',
        user: sanitizedUser
      })
    } else {
      console.log('❌ Password mismatch')
      return NextResponse.json({
        success: false,
        message: 'Contraseña incorrecta'
      })
    }

  } catch (error) {
    console.error('💥 Debug Login error:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno: ' + (error as Error).message },
      { status: 500 }
    )
  }
}







