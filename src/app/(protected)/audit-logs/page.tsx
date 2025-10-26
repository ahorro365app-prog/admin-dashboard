'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCcw, Download, Search, Filter, Calendar, User, Activity, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react'

interface AuditLog {
  id: string
  timestamp: string
  userId: string
  userName: string
  action: string
  resource: string
  details: string
  ipAddress: string
  userAgent: string
  status: 'success' | 'error' | 'warning' | 'info'
  severity: 'low' | 'medium' | 'high' | 'critical'
}

interface LogFilters {
  search: string
  action: string
  status: string
  severity: string
  dateFrom: string
  dateTo: string
  userId: string
}

export default function AuditLogsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<LogFilters>({
    search: '',
    action: '',
    status: '',
    severity: '',
    dateFrom: '',
    dateTo: '',
    userId: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [logsPerPage] = useState(50)
  const [selectedLogs, setSelectedLogs] = useState<string[]>([])

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [logs, filters])

  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      console.log('📋 Fetching audit logs...')

      // Simular logs de auditoría
      const mockLogs: AuditLog[] = [
        {
          id: '1',
          timestamp: '2025-10-25T02:15:30Z',
          userId: 'admin-001',
          userName: 'Administrador',
          action: 'LOGIN',
          resource: 'auth',
          details: 'Inicio de sesión exitoso desde IP 192.168.1.100',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          status: 'success',
          severity: 'low'
        },
        {
          id: '2',
          timestamp: '2025-10-25T02:10:15Z',
          userId: 'user-123',
          userName: 'Juan Pérez',
          action: 'CREATE_TRANSACTION',
          resource: 'transactions',
          details: 'Transacción creada: Gasto de $50 en Transporte',
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
          status: 'success',
          severity: 'low'
        },
        {
          id: '3',
          timestamp: '2025-10-25T02:05:45Z',
          userId: 'admin-001',
          userName: 'Administrador',
          action: 'UPDATE_USER',
          resource: 'users',
          details: 'Usuario actualizado: Cambio de suscripción a Premium',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          status: 'success',
          severity: 'medium'
        },
        {
          id: '4',
          timestamp: '2025-10-25T01:58:20Z',
          userId: 'user-456',
          userName: 'María García',
          action: 'FAILED_LOGIN',
          resource: 'auth',
          details: 'Intento de inicio de sesión fallido - Contraseña incorrecta',
          ipAddress: '192.168.1.102',
          userAgent: 'Mozilla/5.0 (Android 12; Mobile; rv:91.0) Gecko/91.0',
          status: 'error',
          severity: 'medium'
        },
        {
          id: '5',
          timestamp: '2025-10-25T01:45:10Z',
          userId: 'system',
          userName: 'Sistema',
          action: 'BACKUP_COMPLETED',
          resource: 'database',
          details: 'Respaldo automático completado exitosamente - 2.5 GB',
          ipAddress: '127.0.0.1',
          userAgent: 'System/Backup',
          status: 'success',
          severity: 'low'
        },
        {
          id: '6',
          timestamp: '2025-10-25T01:30:55Z',
          userId: 'admin-001',
          userName: 'Administrador',
          action: 'DELETE_USER',
          resource: 'users',
          details: 'Usuario eliminado: ID user-789 - Cuenta inactiva',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          status: 'success',
          severity: 'high'
        },
        {
          id: '7',
          timestamp: '2025-10-25T01:15:30Z',
          userId: 'user-789',
          userName: 'Carlos López',
          action: 'SUSPICIOUS_ACTIVITY',
          resource: 'security',
          details: 'Actividad sospechosa detectada - Múltiples intentos de acceso',
          ipAddress: '192.168.1.103',
          userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B)',
          status: 'warning',
          severity: 'critical'
        }
      ]

      setLogs(mockLogs)
    } catch (error) {
      console.error('💥 Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...logs]

    if (filters.search) {
      filtered = filtered.filter(log => 
        log.userName.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.action.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.details.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    if (filters.action) {
      filtered = filtered.filter(log => log.action === filters.action)
    }

    if (filters.status) {
      filtered = filtered.filter(log => log.status === filters.status)
    }

    if (filters.severity) {
      filtered = filtered.filter(log => log.severity === filters.severity)
    }

    if (filters.userId) {
      filtered = filtered.filter(log => log.userId.includes(filters.userId))
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= new Date(filters.dateFrom))
    }

    if (filters.dateTo) {
      filtered = filtered.filter(log => new Date(log.timestamp) <= new Date(filters.dateTo))
    }

    setFilteredLogs(filtered)
    setCurrentPage(1)
  }

  const handleFilterChange = (key: keyof LogFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      action: '',
      status: '',
      severity: '',
      dateFrom: '',
      dateTo: '',
      userId: ''
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'info': return <Info className="w-4 h-4 text-blue-500" />
      default: return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-gray-100 text-gray-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const handleExport = () => {
    const csvContent = [
      ['Timestamp', 'Usuario', 'Acción', 'Recurso', 'Detalles', 'IP', 'Estado', 'Severidad'],
      ...filteredLogs.map(log => [
        log.timestamp,
        log.userName,
        log.action,
        log.resource,
        log.details,
        log.ipAddress,
        log.status,
        log.severity
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleSelectAll = () => {
    if (selectedLogs.length === paginatedLogs.length) {
      setSelectedLogs([])
    } else {
      setSelectedLogs(paginatedLogs.map(log => log.id))
    }
  }

  const handleSelectLog = (logId: string) => {
    setSelectedLogs(prev => 
      prev.includes(logId) 
        ? prev.filter(id => id !== logId)
        : [...prev, logId]
    )
  }

  // Paginación
  const indexOfLastLog = currentPage * logsPerPage
  const indexOfFirstLog = indexOfLastLog - logsPerPage
  const paginatedLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog)
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando logs de auditoría...</p>
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
                onClick={() => router.push('/dashboard')}
                className="text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Logs de Auditoría
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Registro de actividades y eventos del sistema
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <Download size={16} />
                <span>Exportar CSV</span>
              </button>
              <button
                onClick={fetchAuditLogs}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                title="Actualizar logs"
              >
                <RefreshCcw size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Limpiar filtros
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Usuario, acción, detalles..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Acción
                </label>
                <select
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas las acciones</option>
                  <option value="LOGIN">LOGIN</option>
                  <option value="LOGOUT">LOGOUT</option>
                  <option value="CREATE_TRANSACTION">CREATE_TRANSACTION</option>
                  <option value="UPDATE_USER">UPDATE_USER</option>
                  <option value="DELETE_USER">DELETE_USER</option>
                  <option value="BACKUP_COMPLETED">BACKUP_COMPLETED</option>
                  <option value="FAILED_LOGIN">FAILED_LOGIN</option>
                  <option value="SUSPICIOUS_ACTIVITY">SUSPICIOUS_ACTIVITY</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los estados</option>
                  <option value="success">Success</option>
                  <option value="error">Error</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severidad
                </label>
                <select
                  value={filters.severity}
                  onChange={(e) => handleFilterChange('severity', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas las severidades</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Desde
                </label>
                <input
                  type="datetime-local"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Hasta
                </label>
                <input
                  type="datetime-local"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID de Usuario
                </label>
                <input
                  type="text"
                  value={filters.userId}
                  onChange={(e) => handleFilterChange('userId', e.target.value)}
                  placeholder="user-123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Registros de Auditoría ({filteredLogs.length})
                </h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedLogs.length === paginatedLogs.length && paginatedLogs.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-600">Seleccionar todo</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Seleccionar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Detalles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedLogs.includes(log.id)}
                          onChange={() => handleSelectLog(log.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{log.userName}</div>
                            <div className="text-sm text-gray-500">{log.userId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{log.action}</div>
                        <div className="text-sm text-gray-500">{log.resource}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {log.details}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(log.status)}
                          <span className="ml-2 text-sm text-gray-900 capitalize">{log.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(log.severity)}`}>
                          {log.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.ipAddress}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando {indexOfFirstLog + 1} a {Math.min(indexOfLastLog, filteredLogs.length)} de {filteredLogs.length} registros
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

