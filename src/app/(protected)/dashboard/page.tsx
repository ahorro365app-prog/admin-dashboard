'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { ActivitiesTable } from '@/components/dashboard/ActivitiesTable'

// Cargar gráficos sin SSR
const TransactionsChart = dynamic(() => import('@/components/dashboard/Charts').then(mod => ({ default: mod.TransactionsChart })), { ssr: false })
const UsersChart = dynamic(() => import('@/components/dashboard/Charts').then(mod => ({ default: mod.UsersChart })), { ssr: false })
const SubscriptionChart = dynamic(() => import('@/components/dashboard/Charts').then(mod => ({ default: mod.SubscriptionChart })), { ssr: false })

interface DashboardData {
  stats: {
    totalUsers: number
    premiumUsers: number
    todayTransactions: number
    referrals: number
  }
  charts: {
    transactions7Days: Array<{ name: string; value: number }>
    users6Months: Array<{ name: string; value: number }>
    subscriptionData: Array<{ name: string; value: number }>
  }
  activities: Array<{
    id: string
    type: string
    description: string
    user: string
    timestamp: string
    amount?: number
    status: string
  }>
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchDashboardData = async () => {
    try {
      console.log('📊 Fetching dashboard data...')
      
      // Fetch stats
      const statsResponse = await fetch('/api/stats/users')
      const statsData = await statsResponse.json()
      
      if (!statsData.success) {
        throw new Error(statsData.message)
      }

      // Fetch charts data
      const chartsResponse = await fetch('/api/analytics/charts')
      const chartsData = await chartsResponse.json()
      
      if (!chartsData.success) {
        throw new Error(chartsData.message)
      }

      // Fetch activities
      const activitiesResponse = await fetch('/api/analytics/activities')
      const activitiesData = await activitiesResponse.json()
      
      if (!activitiesData.success) {
        throw new Error(activitiesData.message)
      }

      setData({
        stats: statsData.data,
        charts: chartsData.data,
        activities: activitiesData.data
      })
      
      setLastUpdated(new Date())
      setError('')
      
      console.log('✅ Dashboard data loaded successfully')
      
    } catch (error: any) {
      console.error('💥 Error fetching dashboard data:', error)
      setError('Error cargando datos del dashboard: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    setLoading(true)
    fetchDashboardData()
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        window.location.href = '/'
      } else {
        console.error('Error en logout:', data.message)
        // Fallback: limpiar cookies manualmente
        document.cookie = 'admin-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        document.cookie = 'admin-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Error de conexión en logout:', error)
      // Fallback: limpiar cookies manualmente
      document.cookie = 'admin-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      document.cookie = 'admin-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      window.location.href = '/'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Dashboard Administrativo
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Panel de control y estadísticas en tiempo real
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {lastUpdated && (
                <div className="text-sm text-gray-500">
                  Última actualización: {lastUpdated.toLocaleTimeString('es-ES')}
                </div>
              )}
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Actualizando...' : '🔄 Actualizar'}
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                🚪 Cerrar Sesión
              </button>
            </div>
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

          {/* Stats Cards */}
          <div className="mb-8">
            <StatsCards 
              data={data?.stats || { totalUsers: 0, premiumUsers: 0, todayTransactions: 0, referrals: 0 }}
              loading={loading}
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <TransactionsChart 
              data={data?.charts.transactions7Days || []}
              loading={loading}
            />
            <UsersChart 
              data={data?.charts.users6Months || []}
              loading={loading}
            />
          </div>

          {/* Subscription Chart */}
          <div className="mb-8">
            <SubscriptionChart 
              data={data?.charts.subscriptionData || []}
              loading={loading}
            />
          </div>

          {/* Activities Table */}
          <ActivitiesTable 
            activities={data?.activities || []}
            loading={loading}
          />

          {/* Quick Actions */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Acciones Rápidas
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <button 
                onClick={() => window.location.href = '/users'}
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-left hover:bg-blue-50"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-blue-600 text-lg">👥</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Ver Usuarios</h3>
                    <p className="text-sm text-gray-500 mt-1">Gestionar usuarios del sistema</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => window.location.href = '/analytics'}
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-left hover:bg-green-50"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-green-600 text-lg">📊</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Analytics</h3>
                    <p className="text-sm text-gray-500 mt-1">Ver estadísticas detalladas</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => window.location.href = '/referrals'}
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-left hover:bg-purple-50"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-purple-600 text-lg">🔗</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Referidos</h3>
                    <p className="text-sm text-gray-500 mt-1">Sistema de referencias</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => window.location.href = '/settings'}
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-left hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-gray-600 text-lg">⚙️</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Configuración</h3>
                    <p className="text-sm text-gray-500 mt-1">Ajustes del sistema</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}