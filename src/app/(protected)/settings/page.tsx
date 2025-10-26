'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, RefreshCcw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface SystemSettings {
  appName: string
  appVersion: string
  maintenanceMode: boolean
  registrationEnabled: boolean
  maxUsers: number
  emailNotifications: boolean
  smsNotifications: boolean
  backupFrequency: string
  logRetentionDays: number
  apiRateLimit: number
  currency: string
  timezone: string
  language: string
}

interface DatabaseStatus {
  connected: boolean
  lastBackup: string
  size: string
  tables: number
  health: 'good' | 'warning' | 'error'
}

export default function SettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<SystemSettings>({
    appName: 'AI Finance App',
    appVersion: '1.0.0',
    maintenanceMode: false,
    registrationEnabled: true,
    maxUsers: 10000,
    emailNotifications: true,
    smsNotifications: false,
    backupFrequency: 'daily',
    logRetentionDays: 30,
    apiRateLimit: 1000,
    currency: 'USD',
    timezone: 'America/La_Paz',
    language: 'es'
  })
  
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({
    connected: true,
    lastBackup: '2025-10-25 02:00:00',
    size: '2.5 GB',
    tables: 3,
    health: 'good'
  })
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  useEffect(() => {
    fetchSettings()
    fetchDatabaseStatus()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      // Simular carga de configuración
      await new Promise(resolve => setTimeout(resolve, 500))
      setLoading(false)
    } catch (error) {
      console.error('Error fetching settings:', error)
      setMessage({ type: 'error', text: 'Error cargando configuración' })
    }
  }

  const fetchDatabaseStatus = async () => {
    try {
      // Simular verificación de base de datos
      await new Promise(resolve => setTimeout(resolve, 300))
    } catch (error) {
      console.error('Error fetching database status:', error)
    }
  }

  const handleSettingChange = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      setMessage(null)
      
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setMessage({ type: 'success', text: 'Configuración guardada exitosamente' })
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: 'Error guardando configuración' })
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    try {
      setMessage({ type: 'info', text: 'Probando conexión...' })
      await new Promise(resolve => setTimeout(resolve, 1000))
      setMessage({ type: 'success', text: 'Conexión exitosa' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión' })
    }
  }

  const handleBackupNow = async () => {
    try {
      setMessage({ type: 'info', text: 'Iniciando respaldo...' })
      await new Promise(resolve => setTimeout(resolve, 2000))
      setMessage({ type: 'success', text: 'Respaldo completado exitosamente' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Error en el respaldo' })
    }
  }

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'good': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />
      default: return <AlertTriangle className="w-5 h-5 text-gray-500" />
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'good': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando configuración...</p>
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
                  Configuración del Sistema
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Administrar configuración y estado del sistema
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleTestConnection}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                🔗 Probar Conexión
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                <Save size={16} />
                <span>{saving ? 'Guardando...' : 'Guardar'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          
          {/* Message */}
          {message && (
            <div className={`rounded-lg p-4 ${
              message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-600' :
              message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-600' :
              'bg-blue-50 border border-blue-200 text-blue-600'
            }`}>
              {message.text}
            </div>
          )}

          {/* Database Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Estado de la Base de Datos</h2>
              <div className="flex items-center space-x-2">
                {getHealthIcon(dbStatus.health)}
                <span className={`font-medium ${getHealthColor(dbStatus.health)}`}>
                  {dbStatus.health === 'good' ? 'Saludable' : 
                   dbStatus.health === 'warning' ? 'Advertencia' : 'Error'}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Estado</div>
                <div className="text-lg font-semibold text-gray-900">
                  {dbStatus.connected ? 'Conectado' : 'Desconectado'}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Último Respaldo</div>
                <div className="text-lg font-semibold text-gray-900">{dbStatus.lastBackup}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Tamaño</div>
                <div className="text-lg font-semibold text-gray-900">{dbStatus.size}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Tablas</div>
                <div className="text-lg font-semibold text-gray-900">{dbStatus.tables}</div>
              </div>
            </div>
            
            <div className="mt-4 flex space-x-3">
              <button
                onClick={handleBackupNow}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                💾 Respaldo Ahora
              </button>
              <button
                onClick={fetchDatabaseStatus}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                <RefreshCcw size={16} className="inline mr-2" />
                Actualizar Estado
              </button>
            </div>
          </div>

          {/* System Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Configuración General</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* App Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Configuración de la Aplicación</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la Aplicación
                  </label>
                  <input
                    type="text"
                    value={settings.appName}
                    onChange={(e) => handleSettingChange('appName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Versión
                  </label>
                  <input
                    type="text"
                    value={settings.appVersion}
                    onChange={(e) => handleSettingChange('appVersion', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Moneda Principal
                  </label>
                  <select
                    value={settings.currency}
                    onChange={(e) => handleSettingChange('currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD - Dólar Americano</option>
                    <option value="BOB">BOB - Boliviano</option>
                    <option value="PEN">PEN - Sol Peruano</option>
                    <option value="ARS">ARS - Peso Argentino</option>
                    <option value="BRL">BRL - Real Brasileño</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zona Horaria
                  </label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => handleSettingChange('timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="America/La_Paz">America/La_Paz (Bolivia)</option>
                    <option value="America/Lima">America/Lima (Perú)</option>
                    <option value="America/Argentina/Buenos_Aires">America/Argentina/Buenos_Aires</option>
                    <option value="America/Sao_Paulo">America/Sao_Paulo (Brasil)</option>
                    <option value="America/New_York">America/New_York (USA)</option>
                  </select>
                </div>
              </div>

              {/* System Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Configuración del Sistema</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Modo Mantenimiento</label>
                    <p className="text-xs text-gray-500">Deshabilitar acceso de usuarios</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Registro Habilitado</label>
                    <p className="text-xs text-gray-500">Permitir nuevos registros</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.registrationEnabled}
                    onChange={(e) => handleSettingChange('registrationEnabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Máximo de Usuarios
                  </label>
                  <input
                    type="number"
                    value={settings.maxUsers}
                    onChange={(e) => handleSettingChange('maxUsers', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Límite de API (req/min)
                  </label>
                  <input
                    type="number"
                    value={settings.apiRateLimit}
                    onChange={(e) => handleSettingChange('apiRateLimit', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Notification Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Notificaciones</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Notificaciones Email</label>
                    <p className="text-xs text-gray-500">Enviar notificaciones por correo</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Notificaciones SMS</label>
                    <p className="text-xs text-gray-500">Enviar notificaciones por SMS</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.smsNotifications}
                    onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frecuencia de Respaldo
                  </label>
                  <select
                    value={settings.backupFrequency}
                    onChange={(e) => handleSettingChange('backupFrequency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="hourly">Cada hora</option>
                    <option value="daily">Diario</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Retención de Logs (días)
                  </label>
                  <input
                    type="number"
                    value={settings.logRetentionDays}
                    onChange={(e) => handleSettingChange('logRetentionDays', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Configuración de Seguridad</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Autenticación</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Autenticación de dos factores</span>
                    <span className="text-sm text-green-600">Habilitada</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Sesiones simultáneas</span>
                    <span className="text-sm text-gray-600">1 por usuario</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Tiempo de sesión</span>
                    <span className="text-sm text-gray-600">24 horas</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">API</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Rate limiting</span>
                    <span className="text-sm text-green-600">Activo</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">CORS habilitado</span>
                    <span className="text-sm text-green-600">Configurado</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Logs de API</span>
                    <span className="text-sm text-green-600">Activo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}