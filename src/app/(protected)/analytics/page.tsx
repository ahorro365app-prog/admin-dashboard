'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCcw, Download, Settings } from 'lucide-react'
import AuditLogsPage from '../audit-logs/page'
import { ExportModal } from '@/components/common/ExportModal'

// Cargar componente sin SSR para evitar problemas con Recharts
const AdvancedAnalytics = dynamic(() => import('@/components/analytics/AdvancedAnalytics').then(mod => ({ default: mod.AdvancedAnalytics })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-pulse text-gray-600">Cargando analytics...</div></div>
})

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('analytics')
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const router = useRouter()

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
        router.push('/')
      } else {
        console.error('Error en logout:', data.message)
        document.cookie = 'admin-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        document.cookie = 'admin-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        router.push('/')
      }
    } catch (error) {
      console.error('Error de conexión en logout:', error)
      document.cookie = 'admin-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      document.cookie = 'admin-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      router.push('/')
    }
  }

  const handleExport = () => {
    setIsExportModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Analytics Avanzados
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Análisis detallado del rendimiento del sistema
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <Download size={16} />
                <span>Exportar</span>
              </button>
              <button
                onClick={() => window.location.reload()}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                title="Actualizar datos"
              >
                <RefreshCcw size={18} />
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                🚪 Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Analytics
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ⚙️ Configuración
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'logs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📋 Logs de Auditoría
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {activeTab === 'analytics' && <AdvancedAnalytics />}
          
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Configuración del Sistema</h2>
                <p className="text-gray-600">Página de configuración pendiente de implementar</p>
              </div>
            </div>
          )}
          
          {activeTab === 'logs' && <AuditLogsPage />}

        </div>
      </main>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  )
}