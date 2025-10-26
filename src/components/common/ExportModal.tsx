'use client'

import { useState } from 'react'
import { Download, FileText, Database, Users, TrendingUp, Calendar } from 'lucide-react'

interface ExportOptions {
  format: 'csv' | 'xlsx' | 'json' | 'pdf'
  dataType: 'users' | 'transactions' | 'analytics' | 'audit-logs'
  dateRange: {
    from: string
    to: string
  }
  filters: {
    includeInactive: boolean
    includeDeleted: boolean
    countryFilter: string
    subscriptionFilter: string
  }
}

export function ExportModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    dataType: 'users',
    dateRange: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0]
    },
    filters: {
      includeInactive: false,
      includeDeleted: false,
      countryFilter: '',
      subscriptionFilter: ''
    }
  })
  
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleExport = async () => {
    try {
      setExporting(true)
      setProgress(0)

      // Simular progreso de exportación
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            setTimeout(() => {
              setExporting(false)
              setProgress(0)
              onClose()
              alert('Exportación completada exitosamente')
            }, 500)
            return 100
          }
          return prev + 10
        })
      }, 200)

      // Aquí implementarías la lógica real de exportación
      console.log('Exporting data:', exportOptions)

    } catch (error) {
      console.error('Error exporting data:', error)
      setExporting(false)
      setProgress(0)
      alert('Error en la exportación')
    }
  }

  const updateExportOptions = (key: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({ ...prev, [key]: value }))
  }

  const updateFilters = (key: keyof ExportOptions['filters'], value: any) => {
    setExportOptions(prev => ({
      ...prev,
      filters: { ...prev.filters, [key]: value }
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Download className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Exportar Datos</h3>
                <p className="text-sm text-gray-500">Selecciona los datos y formato de exportación</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={exporting}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              ✕
            </button>
          </div>

          {/* Export Progress */}
          {exporting && (
            <div className="mb-6 bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">Exportando datos...</span>
                <span className="text-sm text-blue-700">{progress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Export Options */}
          <div className="space-y-6">
            
            {/* Data Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de Datos
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'users', label: 'Usuarios', icon: Users, desc: 'Lista de usuarios registrados' },
                  { id: 'transactions', label: 'Transacciones', icon: TrendingUp, desc: 'Historial de transacciones' },
                  { id: 'analytics', label: 'Analytics', icon: Database, desc: 'Métricas y estadísticas' },
                  { id: 'audit-logs', label: 'Logs de Auditoría', icon: FileText, desc: 'Registro de actividades' }
                ].map(({ id, label, icon: Icon, desc }) => (
                  <button
                    key={id}
                    onClick={() => updateExportOptions('dataType', id)}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      exportOptions.dataType === id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    disabled={exporting}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-5 h-5 ${
                        exportOptions.dataType === id ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <div>
                        <div className={`font-medium ${
                          exportOptions.dataType === id ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {label}
                        </div>
                        <div className="text-xs text-gray-500">{desc}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Formato de Archivo
              </label>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { id: 'csv', label: 'CSV', desc: 'Excel compatible' },
                  { id: 'xlsx', label: 'Excel', desc: 'Formato nativo' },
                  { id: 'json', label: 'JSON', desc: 'Datos estructurados' },
                  { id: 'pdf', label: 'PDF', desc: 'Reporte visual' }
                ].map(({ id, label, desc }) => (
                  <button
                    key={id}
                    onClick={() => updateExportOptions('format', id)}
                    className={`p-3 rounded-lg border-2 text-center transition-colors ${
                      exportOptions.format === id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    disabled={exporting}
                  >
                    <div className={`font-medium ${
                      exportOptions.format === id ? 'text-green-900' : 'text-gray-900'
                    }`}>
                      {label}
                    </div>
                    <div className="text-xs text-gray-500">{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Rango de Fechas
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Desde</label>
                  <input
                    type="date"
                    value={exportOptions.dateRange.from}
                    onChange={(e) => updateExportOptions('dateRange', {
                      ...exportOptions.dateRange,
                      from: e.target.value
                    })}
                    disabled={exporting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Hasta</label>
                  <input
                    type="date"
                    value={exportOptions.dateRange.to}
                    onChange={(e) => updateExportOptions('dateRange', {
                      ...exportOptions.dateRange,
                      to: e.target.value
                    })}
                    disabled={exporting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Filtros Adicionales
              </label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm text-gray-700">Incluir usuarios inactivos</label>
                    <p className="text-xs text-gray-500">Usuarios que no han iniciado sesión recientemente</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={exportOptions.filters.includeInactive}
                    onChange={(e) => updateFilters('includeInactive', e.target.checked)}
                    disabled={exporting}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm text-gray-700">Incluir registros eliminados</label>
                    <p className="text-xs text-gray-500">Datos marcados como eliminados</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={exportOptions.filters.includeDeleted}
                    onChange={(e) => updateFilters('includeDeleted', e.target.checked)}
                    disabled={exporting}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Filtrar por país</label>
                  <select
                    value={exportOptions.filters.countryFilter}
                    onChange={(e) => updateFilters('countryFilter', e.target.value)}
                    disabled={exporting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="">Todos los países</option>
                    <option value="BO">Bolivia</option>
                    <option value="PE">Perú</option>
                    <option value="AR">Argentina</option>
                    <option value="BR">Brasil</option>
                    <option value="CL">Chile</option>
                    <option value="CO">Colombia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Filtrar por suscripción</label>
                  <select
                    value={exportOptions.filters.subscriptionFilter}
                    onChange={(e) => updateFilters('subscriptionFilter', e.target.value)}
                    disabled={exporting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="">Todas las suscripciones</option>
                    <option value="free">Free</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Export Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Resumen de Exportación</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>• <strong>Tipo:</strong> {exportOptions.dataType}</div>
                <div>• <strong>Formato:</strong> {exportOptions.format.toUpperCase()}</div>
                <div>• <strong>Período:</strong> {exportOptions.dateRange.from} a {exportOptions.dateRange.to}</div>
                <div>• <strong>Filtros:</strong> {
                  Object.entries(exportOptions.filters)
                    .filter(([_, value]) => value)
                    .map(([key, _]) => key)
                    .join(', ') || 'Ninguno'
                }</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={exporting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              >
                {exporting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Exportando...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Download className="w-4 h-4" />
                    <span>Exportar Datos</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


