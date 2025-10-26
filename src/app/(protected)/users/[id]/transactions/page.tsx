'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface Transaction {
  id: string
  usuario_id: string
  tipo: string
  monto: number
  categoria: string
  descripcion: string
  fecha: string
  url_comprobante?: string
}

export default function UserTransactionsPage() {
  const params = useParams()
  const userId = params.id as string
  
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (userId) {
      fetchTransactions()
    }
  }, [userId])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      console.log('📊 Fetching transactions for user:', userId)
      
      const response = await fetch(`/api/users/${userId}/transactions`)
      const data = await response.json()
      
      if (data.success) {
        console.log('📊 Transactions loaded:', data.data.length)
        setTransactions(data.data)
      } else {
        setError(data.message || 'Error cargando transacciones')
      }
    } catch (error) {
      console.error('💥 Error fetching transactions:', error)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTransactionIcon = (tipo: string) => {
    return tipo === 'gasto' ? '💸' : '💰'
  }

  const getTransactionColor = (tipo: string) => {
    return tipo === 'gasto' ? 'text-red-600' : 'text-green-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando transacciones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = `/users/${userId}`}
                className="text-gray-400 hover:text-gray-600"
              >
                ←
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Transacciones del Usuario
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Historial completo de transacciones
                </p>
              </div>
            </div>
            <button
              onClick={() => window.location.href = `/users/${userId}`}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Volver a Detalles
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Stats */}
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Resumen de Transacciones
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{transactions.length}</div>
                  <div className="text-sm text-gray-500">Total Transacciones</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {transactions.filter(t => t.tipo === 'gasto').length}
                  </div>
                  <div className="text-sm text-gray-500">Gastos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {transactions.filter(t => t.tipo === 'ingreso').length}
                  </div>
                  <div className="text-sm text-gray-500">Ingresos</div>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Lista de Transacciones ({transactions.length})
              </h3>
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">📊</div>
                <p className="text-gray-500 text-lg">No hay transacciones registradas</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-lg">{getTransactionIcon(transaction.tipo)}</span>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-medium text-gray-900">
                              {transaction.descripcion}
                            </h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              transaction.tipo === 'gasto' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {transaction.tipo}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {transaction.categoria} • {formatDate(transaction.fecha)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className={`text-lg font-semibold ${getTransactionColor(transaction.tipo)}`}>
                          {transaction.tipo === 'gasto' ? '-' : '+'}${transaction.monto}
                        </div>
                        {transaction.url_comprobante && (
                          <button className="text-blue-600 hover:text-blue-800 text-sm">
                            📎 Ver comprobante
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}


