'use client'

interface User {
  id: string
  nombre: string
  telefono: string
  pais: string
  country_code: string
  suscripcion: 'free' | 'premium' | string
  created_at: string
}

interface RecentRegistrationsTableProps {
  registrations: User[]
  loading?: boolean
  onRefresh?: () => void
}

export function RecentRegistrationsTable({ registrations, loading = false, onRefresh }: RecentRegistrationsTableProps) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Hace un momento'
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} h`
    if (diffInMinutes < 10080) return `Hace ${Math.floor(diffInMinutes / 1440)} días`
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    })
  }

  const getSubscriptionBadge = (suscripcion: string) => {
    if (suscripcion === 'premium') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-purple-600 bg-purple-100">
          ⭐ Premium
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-gray-600 bg-gray-100">
        Free
      </span>
    )
  }

  const getCountryFlag = (countryCode: string) => {
    // Mapeo simple de códigos de país a emojis de banderas
    const flags: Record<string, string> = {
      'MX': '🇲🇽',
      'AR': '🇦🇷',
      'CO': '🇨🇴',
      'PE': '🇵🇪',
      'CL': '🇨🇱',
      'BO': '🇧🇴',
      'US': '🇺🇸',
      'ES': '🇪🇸',
    }
    return flags[countryCode] || '🌍'
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
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="w-16 h-6 bg-gray-200 rounded"></div>
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
              Registros Recientes
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Últimos 10 usuarios registrados
            </p>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Actualizar registros"
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
        {registrations.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-lg mb-2">👤</div>
            <p className="text-gray-500">No hay registros recientes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {registrations.map((user) => (
              <div 
                key={user.id} 
                className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg">
                    {getCountryFlag(user.country_code || user.pais)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.nombre}
                    </p>
                    {getSubscriptionBadge(user.suscripcion)}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {user.telefono && (
                      <span>{user.telefono}</span>
                    )}
                    {user.telefono && user.pais && ' • '}
                    {user.pais && (
                      <span>{user.pais}</span>
                    )}
                    {' • '}
                    {formatTimestamp(user.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

