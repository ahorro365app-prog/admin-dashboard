'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { logger } from '../../../../lib/logger'

type TriggerSettingsMeta = {
  key: string
  label: string
  type: 'number' | 'boolean'
  min?: number
  max?: number
  step?: number
}

type TriggerSummary = {
  [key: string]: any
}

type AutomationTrigger = {
  key: string
  label: string
  description: string
  isActive: boolean
  settings: Record<string, any>
  settingsMeta: TriggerSettingsMeta[]
  lastRun: {
    sentAt: string | null
    summary?: TriggerSummary
  }
}

const formatDateTime = (iso: string | null) => {
  if (!iso) return 'Sin registros'
  try {
    const date = new Date(iso)
    return date.toLocaleString('es-BO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

export default function AutomationPage() {
  const [triggers, setTriggers] = useState<AutomationTrigger[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [settingsDraft, setSettingsDraft] = useState<Record<string, Record<string, any>>>({})

  const fetchTriggers = useMemo(
    () =>
      async function fetchTriggersInternal() {
        setLoading(true)
        setError(null)
        try {
          const response = await fetch('/api/notifications/triggers')
          const data = await response.json()
          if (!response.ok || !data?.success) {
            throw new Error(data?.message || 'No se pudieron obtener las automatizaciones')
          }
          setTriggers(data.triggers || [])
          const drafts: Record<string, Record<string, any>> = {}
          ;(data.triggers || []).forEach((trigger: AutomationTrigger) => {
            drafts[trigger.key] = { ...trigger.settings }
          })
          setSettingsDraft(drafts)
        } catch (err: any) {
          logger.error('Error cargando triggers:', err)
          setError(err?.message || 'Error al cargar el panel de automatizaciones')
        } finally {
          setLoading(false)
        }
      },
    []
  )

  useEffect(() => {
    fetchTriggers()
  }, [fetchTriggers])

  const toggleTrigger = async (trigger: AutomationTrigger) => {
    setFeedback(null)
    try {
      const response = await fetch(`/api/notifications/triggers/${trigger.key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !trigger.isActive }),
      })
      const data = await response.json()
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'No se pudo actualizar el trigger')
      }
      setTriggers((prev) => prev.map((item) => (item.key === trigger.key ? data.trigger : item)))
      setSettingsDraft((prev) => ({ ...prev, [trigger.key]: { ...data.trigger.settings } }))
      setFeedback(`Trigger "${trigger.label}" ${data.trigger.isActive ? 'activado' : 'desactivado'} correctamente.`)
    } catch (err: any) {
      logger.error('Error actualizando trigger:', err)
      setFeedback(err?.message || 'Error al actualizar el trigger')
    }
  }

  const saveSettings = async (trigger: AutomationTrigger) => {
    const draft = settingsDraft[trigger.key]
    if (!draft) return
    setSaving(true)
    setFeedback(null)
    try {
      const response = await fetch(`/api/notifications/triggers/${trigger.key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: draft }),
      })
      const data = await response.json()
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'No se pudieron guardar los parámetros')
      }
      setTriggers((prev) => prev.map((item) => (item.key === trigger.key ? data.trigger : item)))
      setSettingsDraft((prev) => ({ ...prev, [trigger.key]: { ...data.trigger.settings } }))
      setFeedback(`Parámetros actualizados para "${trigger.label}".`)
    } catch (err: any) {
      logger.error('Error guardando parámetros:', err)
      setFeedback(err?.message || 'Error al guardar parámetros')
    } finally {
      setSaving(false)
    }
  }

  const runTrigger = async (trigger: AutomationTrigger) => {
    setRunning(trigger.key)
    setFeedback(null)
    try {
      const response = await fetch(`/api/notifications/triggers/${trigger.key}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await response.json()
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'No se pudo ejecutar el trigger')
      }
      setFeedback(`Trigger "${trigger.label}" ejecutado: ${data.result?.message || 'Completado'}`)
      await fetchTriggers()
    } catch (err: any) {
      logger.error('Error ejecutando trigger:', err)
      setFeedback(err?.message || 'Error al ejecutar trigger')
    } finally {
      setRunning(null)
    }
  }

  const renderSummary = (summary?: TriggerSummary) => {
    if (!summary) {
      return <p className="text-sm text-gray-500">Sin registros recientes.</p>
    }

    const entries = Object.entries(summary)
      .filter(([key]) => key !== 'settings')
      .slice(0, 8)

    if (entries.length === 0) {
      return <p className="text-sm text-gray-500">Sin métricas registradas.</p>
    }

    return (
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        {entries.map(([key, value]) => (
          <div key={key} className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
            <dt className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}</dt>
            <dd className="font-semibold text-gray-900">{String(value)}</dd>
          </div>
        ))}
      </dl>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Automatizaciones de Notificaciones</h1>
            <p className="text-sm text-gray-500 mt-1">
              Configura y supervisa los triggers que se ejecutan automáticamente.
            </p>
          </div>
          <Link
            href="/notifications"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            ← Volver
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {feedback && (
          <div className="mb-6 rounded-md bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
            {feedback}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center text-gray-500">
            Cargando automatizaciones…
          </div>
        ) : triggers.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center text-gray-500">
            No hay triggers configurados.
          </div>
        ) : (
          <div className="grid gap-6">
            {triggers.map((trigger) => {
              const draft = settingsDraft[trigger.key] || {}
              const isExpanded = expanded === trigger.key
              return (
                <div key={trigger.key} className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-3 p-6 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{trigger.label}</h2>
                      <p className="text-sm text-gray-500 mt-1 max-w-2xl">{trigger.description}</p>
                      <p className="mt-2 text-xs text-gray-400">
                        Última ejecución: {formatDateTime(trigger.lastRun.sentAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <span>{trigger.isActive ? 'Activo' : 'Inactivo'}</span>
                        <button
                          onClick={() => toggleTrigger(trigger)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                            trigger.isActive ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${trigger.isActive ? 'translate-x-6' : 'translate-x-1'}`}
                          />
                        </button>
                      </label>
                      <button
                        onClick={() => setExpanded(isExpanded ? null : trigger.key)}
                        className="rounded-md border border-gray-200 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        {isExpanded ? 'Ocultar detalles' : 'Ver detalles'}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/60 px-6 py-5">
                      <div className="grid gap-6 lg:grid-cols-2">
                        <div className="space-y-4">
                          <h3 className="text-sm font-semibold text-gray-900">Parámetros</h3>
                          {trigger.settingsMeta.length === 0 ? (
                            <p className="text-sm text-gray-500">Este trigger no tiene parámetros configurables.</p>
                          ) : (
                            <form
                              className="space-y-4"
                              onSubmit={(event) => {
                                event.preventDefault()
                                saveSettings(trigger)
                              }}
                            >
                              {trigger.settingsMeta.map((meta) => (
                                <div key={meta.key} className="flex items-center justify-between gap-4">
                                  <label className="text-sm text-gray-600" htmlFor={`${trigger.key}-${meta.key}`}>
                                    {meta.label}
                                  </label>
                                  {meta.type === 'number' ? (
                                    <input
                                      id={`${trigger.key}-${meta.key}`}
                                      type="number"
                                      className="w-32 rounded-md border border-gray-300 px-3 py-1 text-sm text-right focus:border-blue-500 focus:outline-none"
                                      value={draft[meta.key] ?? ''}
                                      min={meta.min}
                                      max={meta.max}
                                      step={meta.step ?? 1}
                                      onChange={(event) => {
                                        const value = event.target.value === '' ? '' : Number(event.target.value)
                                        setSettingsDraft((prev) => ({
                                          ...prev,
                                          [trigger.key]: {
                                            ...prev[trigger.key],
                                            [meta.key]: value,
                                          },
                                        }))
                                      }}
                                    />
                                  ) : (
                                    <input
                                      id={`${trigger.key}-${meta.key}`}
                                      type="checkbox"
                                      checked={Boolean(draft[meta.key])}
                                      onChange={(event) => {
                                        const value = event.target.checked
                                        setSettingsDraft((prev) => ({
                                          ...prev,
                                          [trigger.key]: {
                                            ...prev[trigger.key],
                                            [meta.key]: value,
                                          },
                                        }))
                                      }}
                                    />
                                  )}
                                </div>
                              ))}

                              <div className="flex gap-3">
                                <button
                                  type="submit"
                                  disabled={saving}
                                  className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {saving ? 'Guardando…' : 'Guardar cambios'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSettingsDraft((prev) => ({
                                    ...prev,
                                    [trigger.key]: { ...trigger.settings },
                                  }))}
                                  className="inline-flex items-center rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-white"
                                >
                                  Restablecer
                                </button>
                              </div>
                            </form>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-900">Último resumen</h3>
                            <button
                              onClick={() => runTrigger(trigger)}
                              disabled={running === trigger.key}
                              className="inline-flex items-center rounded-md border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {running === trigger.key ? 'Ejecutando…' : 'Ejecutar ahora'}
                            </button>
                          </div>
                          {renderSummary(trigger.lastRun.summary)}
                          {trigger.lastRun.summary?.settings && (
                            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Parámetros aplicados</h4>
                              <pre className="mt-1 overflow-auto text-xs text-gray-700">
                                {JSON.stringify(trigger.lastRun.summary.settings, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
