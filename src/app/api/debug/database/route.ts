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
    logDebugAccess('/api/debug/database', request);
    
    console.log('🔍 Debug: Checking database tables and data...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verificar si la tabla usuarios existe y qué datos tiene
    const { data: users, error: usersError } = await supabase
      .from('usuarios')
      .select('*')
      .limit(5)

    console.log('👥 Users query result:', { users, error: usersError })

    // Verificar otras tablas que podrían existir
    const { data: transactions, error: transactionsError } = await supabase
      .from('transacciones')
      .select('*')
      .limit(5)

    console.log('💸 Transactions query result:', { transactions, error: transactionsError })

    // Verificar tabla de deudas
    const { data: debts, error: debtsError } = await supabase
      .from('deudas')
      .select('*')
      .limit(5)

    // Sanitizar datos antes de retornar
    const sanitizedUsers = sanitizeDebugData(users);
    const sanitizedTransactions = sanitizeDebugData(transactions);
    const sanitizedDebts = sanitizeDebugData(debts);
    
    console.log('💰 Debts query result:', { 
      count: sanitizedDebts?.length || 0, 
      error: debtsError?.message 
    })

    return NextResponse.json({
      success: true,
      message: 'Database check completed',
      data: {
        users: {
          count: sanitizedUsers?.length || 0,
          data: sanitizedUsers,
          error: usersError?.message
        },
        transactions: {
          count: sanitizedTransactions?.length || 0,
          data: sanitizedTransactions,
          error: transactionsError?.message
        },
        debts: {
          count: sanitizedDebts?.length || 0,
          data: sanitizedDebts,
          error: debtsError?.message
        }
      }
    })

  } catch (error: any) {
    console.error('💥 Debug error:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno: ' + (error as Error).message },
      { status: 500 }
    )
  }
}



