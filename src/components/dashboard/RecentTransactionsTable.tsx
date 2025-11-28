'use client'

interface Transaction {
  id: string
  tipo: 'gasto' | 'ingreso'
  monto: number
  fecha: string
  categoria: string
  descripcion: string | null
  usuario: {
    id: string
    nombre: string
    telefono: string | null
  }
}

interface RecentTransactionsTableProps {
  transactions: Transaction[]
  loading?: boolean
  onRefresh?: () => void
}

export function RecentTransactionsTable({ transactions, loading = false, onRefresh }: RecentTransactionsTableProps) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Hace un momento'
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} h`
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getTransactionIcon = (tipo: string) => {
    return tipo === 'gasto' ? '📉' : '📈'
  }

  const getTransactionColor = (tipo: string) => {
    return tipo === 'gasto' 
      ? 'text-red-600 bg-red-100' 
      : 'text-green-600 bg-green-100'
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-48"></div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="w-20 h-6 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Transacciones Recientes
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Últimas 10 transacciones
            </p>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Actualizar transacciones"
            >
              <svg 
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{loading ? 'Actualizando...' : 'Actualizar'}</span>
            </button>
          )}
        </div>
      </div>
      <div className="p-6">
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-lg mb-2">💰</div>
            <p className="text-gray-500">No hay transacciones recientes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div 
                key={transaction.id} 
                className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    transaction.tipo === 'gasto' ? 'bg-red-100' : 'bg-green-100'
                  }`}>
                    {getTransactionIcon(transaction.tipo)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {transaction.categoria}
                    </p>
                    {transaction.descripcion && (
                      <span className="text-xs text-gray-400 truncate">
                        • {transaction.descripcion}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {transaction.usuario.nombre} • {formatTimestamp(transaction.fecha)}
                  </p>
                </div>
                <div className="flex-shrink-0 flex items-center space-x-2">
                  <span className={`text-sm font-semibold ${
                    transaction.tipo === 'gasto' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {transaction.tipo === 'gasto' ? '-' : '+'}{formatAmount(transaction.monto)}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTransactionColor(transaction.tipo)}`}>
                    {transaction.tipo === 'gasto' ? 'Gasto' : 'Ingreso'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

