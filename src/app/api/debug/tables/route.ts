import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug: Checking what tables exist in database...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Intentar consultar diferentes tablas que podrían existir
    const tablesToCheck = [
      'users',
      'user', 
      'usuarios',
      'transactions',
      'transaction',
      'transacciones',
      'deudas',
      'deuda',
      'debts',
      'admin_users',
      'profiles',
      'auth.users'
    ]

    const results: Record<string, any> = {}

    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)

        results[tableName] = {
          exists: !error,
          error: error?.message || null,
          sampleData: data
        }
        
        console.log(`📋 Table ${tableName}:`, { exists: !error, error: error?.message })
      } catch (err) {
        results[tableName] = {
          exists: false,
          error: (err as Error).message,
          sampleData: null
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Table check completed',
      tables: results
    })

  } catch (error: any) {
    console.error('💥 Debug error:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

