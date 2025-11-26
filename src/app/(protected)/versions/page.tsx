'use client'

import { useEffect, useState } from 'react'
import { Loader2, Save, Smartphone, Globe, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type VersionConfig = {
  id?: string
  platform: 'web' | 'android' | 'ios'
  current_version: string
  minimum_required_version: string
  recommended_version: string
  force_update: boolean
  update_title: string
  update_message: string
  force_update_title: string
  force_update_message: string
  store_url: string | null
  release_notes: string | null
}

type StatsData = {
  total: number
  upToDate: number
  updateRecommended: number
  updateRequired: number
  blocked: number
  upToDatePercent: number
  versionDistribution: Array<{
    version: string
    count: number
    percentage: number
  }>
  platformDistribution: Record<string, number>
}

const PLATFORM_LABELS = {
  web: '🌐 Web',
  android: '🤖 Android',
  ios: '🍎 iOS',
}

export default function VersionsPage() {
  const [webConfig, setWebConfig] = useState<VersionConfig | null>(null)
  const [androidConfig, setAndroidConfig] = useState<VersionConfig | null>(null)
  const [iosConfig, setIosConfig] = useState<VersionConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    loadConfigs()
    loadStats()
  }, [])

  const loadConfigs = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/app-versions', {
        credentials: 'include',
      })
      const text = await response.text()
      let data: any

      try {
        data = JSON.parse(text)
      } catch (parseError) {
        console.error('Error parseando respuesta:', parseError, 'Respuesta:', text)
        setError(`Error en la respuesta del servidor: ${text.substring(0, 200)}`)
        return
      }

      if (response.status === 401) {
        // Token expirado o no autenticado
        setError('Tu sesión ha expirado. Por favor, recarga la página o inicia sesión nuevamente.')
        // Opcional: redirigir al login después de 2 segundos
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
        return
      }

      if (data.success) {
        setWebConfig(data.data.web)
        setAndroidConfig(data.data.android)
        setIosConfig(data.data.ios)
      } else {
        console.error('Error en respuesta:', data)
        // Mostrar mensaje más descriptivo si la tabla no existe
        if (data.error === 'TABLE_NOT_FOUND' || data.hint) {
          setError(
            `${data.message}\n\n💡 ${data.hint || 'Ejecuta el SQL de creación en Supabase SQL Editor'}`
          )
        } else if (data.error === 'Token inválido o expirado' || data.type === 'AUTHENTICATION_ERROR') {
          setError('Tu sesión ha expirado. Por favor, recarga la página o inicia sesión nuevamente.')
          setTimeout(() => {
            window.location.href = '/login'
          }, 2000)
        } else {
          setError(data.message || 'Error cargando configuraciones')
        }
      }
    } catch (err: any) {
      console.error('Error cargando configuraciones:', err)
      setError(`Error de conexión: ${err.message || 'Error desconocido'}`)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      setStatsLoading(true)
      const response = await fetch('/api/app-versions/stats', {
        credentials: 'include',
      })
      const data = await response.json()

      if (data.success) {
        setStats(data.data)
      }
    } catch (err: any) {
      console.error('Error cargando estadísticas:', err)
    } finally {
      setStatsLoading(false)
    }
  }

  const updateConfig = async (platform: 'web' | 'android' | 'ios', config: VersionConfig) => {
    try {
      setSaving(platform)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/app-versions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(config),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(`Configuración de ${PLATFORM_LABELS[platform]} guardada exitosamente`)
        await loadConfigs()
        await loadStats()
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(data.message || 'Error guardando configuración')
      }
    } catch (err: any) {
      console.error('Error guardando configuración:', err)
      setError('Error de conexión')
    } finally {
      setSaving(null)
    }
  }

  const toggleForceUpdate = async (platform: 'web' | 'android' | 'ios', enabled: boolean) => {
    const config = platform === 'web' ? webConfig : platform === 'android' ? androidConfig : iosConfig
    if (!config) return

    await updateConfig(platform, {
      ...config,
      force_update: enabled,
    })
  }

  const renderConfigForm = (
    platform: 'web' | 'android' | 'ios',
    config: VersionConfig | null,
    setConfig: (config: VersionConfig | null) => void
  ) => {
    if (!config) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-500 text-center">No hay configuración para esta plataforma</p>
        </div>
      )
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            {platform === 'web' && <Globe size={24} className="text-blue-500" />}
            {platform === 'android' && <Smartphone size={24} className="text-green-500" />}
            {platform === 'ios' && <Smartphone size={24} className="text-gray-500" />}
            <h3 className="text-xl font-bold text-gray-900">{PLATFORM_LABELS[platform]}</h3>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Forzar actualización</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.force_update}
                onChange={(e) => {
                  setConfig({ ...config, force_update: e.target.checked })
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Columna izquierda: Versiones */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Versión actual disponible
              </label>
              <input
                type="text"
                value={config.current_version}
                onChange={(e) => setConfig({ ...config, current_version: e.target.value })}
                placeholder="1.4.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Última versión disponible en tienda/web</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Versión mínima requerida
              </label>
              <input
                type="text"
                value={config.minimum_required_version}
                onChange={(e) => setConfig({ ...config, minimum_required_version: e.target.value })}
                placeholder="1.2.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-red-600 mt-1">
                ⚠️ Usuarios con versión menor serán bloqueados
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Versión recomendada
              </label>
              <input
                type="text"
                value={config.recommended_version}
                onChange={(e) => setConfig({ ...config, recommended_version: e.target.value })}
                placeholder="1.3.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-yellow-600 mt-1">
                ⚠️ Usuarios verán aviso pero pueden continuar
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL de tienda
              </label>
              <input
                type="text"
                value={config.store_url || ''}
                onChange={(e) => setConfig({ ...config, store_url: e.target.value || null })}
                placeholder={
                  platform === 'android'
                    ? 'https://play.google.com/store/apps/details?id=com.ahorro365.app'
                    : platform === 'ios'
                    ? 'https://apps.apple.com/app/ahorro365/id123456789'
                    : 'https://app.ahorro365.com'
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Columna derecha: Mensajes */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título - Actualización recomendada
              </label>
              <input
                type="text"
                value={config.update_title}
                onChange={(e) => setConfig({ ...config, update_title: e.target.value })}
                placeholder="Actualización disponible"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensaje - Actualización recomendada
              </label>
              <textarea
                value={config.update_message}
                onChange={(e) => setConfig({ ...config, update_message: e.target.value })}
                rows={3}
                placeholder="Hay una nueva versión de Ahorro365 disponible..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título - Actualización requerida
              </label>
              <input
                type="text"
                value={config.force_update_title}
                onChange={(e) => setConfig({ ...config, force_update_title: e.target.value })}
                placeholder="Actualización necesaria"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensaje - Actualización requerida
              </label>
              <textarea
                value={config.force_update_message}
                onChange={(e) => setConfig({ ...config, force_update_message: e.target.value })}
                rows={3}
                placeholder="Tu versión está desactualizada. Actualiza para continuar..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        </div>

        {/* Release Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notas de la versión (Release Notes)
          </label>
          <textarea
            value={config.release_notes || ''}
            onChange={(e) => setConfig({ ...config, release_notes: e.target.value || null })}
            rows={4}
            placeholder="- Mejoras en el rendimiento&#10;- Corrección de bugs&#10;- Nueva función de reportes"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Botón guardar */}
        <div className="pt-4 border-t">
          <Button
            onClick={() => updateConfig(platform, config)}
            disabled={saving === platform}
            className="w-full"
            size="lg"
          >
            {saving === platform ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar cambios - {PLATFORM_LABELS[platform]}
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🔄 Control de Versiones</h1>
            <p className="text-gray-600 mt-1">Gestiona las versiones de la app y fuerza actualizaciones</p>
          </div>
        </div>

        {/* Mensajes de éxito/error */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
            <CheckCircle2 className="text-green-600" size={20} />
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="text-red-600" size={20} />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-500">Total verificaciones</div>
              <div className="text-2xl font-bold mt-1">{stats.total}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-500">Con última versión</div>
              <div className="text-2xl font-bold text-green-600 mt-1">
                {stats.upToDate} ({stats.upToDatePercent}%)
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-500">Actualización recomendada</div>
              <div className="text-2xl font-bold text-yellow-600 mt-1">{stats.updateRecommended}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-500">Bloqueados</div>
              <div className="text-2xl font-bold text-red-600 mt-1">{stats.updateRequired + stats.blocked}</div>
            </div>
          </div>
        )}

        {/* Distribución de versiones */}
        {stats && stats.versionDistribution.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Distribución de versiones</h3>
            <div className="space-y-3">
              {stats.versionDistribution.map((item) => (
                <div key={item.version} className="flex items-center gap-4">
                  <div className="w-24 font-mono text-sm">{item.version}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full flex items-center justify-end px-2"
                      style={{ width: `${item.percentage}%` }}
                    >
                      <span className="text-xs text-white font-bold">{item.percentage}%</span>
                    </div>
                  </div>
                  <div className="w-20 text-sm text-gray-600">{item.count} usuarios</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formularios de configuración */}
        <div className="space-y-6">
          {renderConfigForm('web', webConfig, setWebConfig)}
          {renderConfigForm('android', androidConfig, setAndroidConfig)}
          {renderConfigForm('ios', iosConfig, setIosConfig)}
        </div>
      </div>
    </div>
  )
}

