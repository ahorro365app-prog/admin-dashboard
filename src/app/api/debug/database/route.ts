import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug: Checking database tables and data...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verificar si la tabla users existe y qué datos tiene
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5)

    console.log('👥 Users query result:', { users, error: usersError })

    // Verificar otras tablas que podrían existir
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .limit(5)

    console.log('💸 Transactions query result:', { transactions, error: transactionsError })

    // Verificar tabla de deudas
    const { data: debts, error: debtsError } = await supabase
      .from('deudas')
      .select('*')
      .limit(5)

    console.log('💰 Debts query result:', { debts, error: debtsError })

    return NextResponse.json({
      success: true,
      message: 'Database check completed',
      data: {
        users: {
          count: users?.length || 0,
          data: users,
          error: usersError?.message
        },
        transactions: {
          count: transactions?.length || 0,
          data: transactions,
          error: transactionsError?.message
        },
        debts: {
          count: debts?.length || 0,
          data: debts,
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


