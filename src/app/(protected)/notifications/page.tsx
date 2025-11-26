'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  BellRing,
  Loader2,
  Send,
  AlertCircle,
  FilePlus2,
  Pencil,
  Trash2,
  Copy,
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'
import { logger } from '../../../lib/logger'

const CORE_API_URL =
  process.env.NEXT_PUBLIC_CORE_API_URL?.replace(/\/$/, '') || 'http://localhost:3000'

type NotificationLog = {
  id: string
  user_id: string | null
  type: string
  title: string
  body: string
  status: string
  sent_at: string
  error_message?: string | null
}

type NotificationTemplate = {
  id: string
  name: string
  description: string | null
  type: string
  title: string
  body: string
  data: Record<string, any> | null
  tags: string[] | null
  created_at: string
  updated_at: string
}

const TEMPLATE_TYPES = [
  { value: 'system', label: 'System' },
  { value: 'transaction', label: 'Transaction' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'referral', label: 'Referral' },
  { value: 'payment', label: 'Payment' },
] as const

const TRIGGER_LABELS: Record<string, string> = {
  'trigger.renewal.reminder': 'Recordatorio de renovación',
  'trigger.referral.invited': 'Referido invitado',
  'trigger.referral.verified': 'Referido verificado',
}

type TimeWindowKey = 'last24h' | 'last7d' | 'last30d'

type WindowSummaryData = {
  sent: number
  delivered: number
  opened: number
  clicked: number
  dismissed: number
  failed: number
}

type TriggerAggregateSummary = {
  key: string
  total: WindowSummaryData
  windows: Record<TimeWindowKey, WindowSummaryData>
  lastSentAt: string | null
  lastDeliveredAt: string | null
  lastOpenedAt: string | null
  lastClickedAt: string | null
  lastTriggerRunAt: string | null
  lastTriggerRunContext?: Record<string, any> | null
}

type CampaignAggregateSummary = {
  id: string
  total: WindowSummaryData
  windows: Record<TimeWindowKey, WindowSummaryData>
  lastSentAt: string | null
  lastDeliveredAt: string | null
  lastOpenedAt: string | null
  lastClickedAt: string | null
}

type SummaryResponse = {
  success: boolean
  data: {
    total: number
    byStatus: Record<
      string,
      {
        count: number
        error?: string
      }
    >
    metrics: Array<{
      name: string
      count: number
      available: boolean
      error?: string
    }>
    windows: Record<TimeWindowKey, WindowSummaryData>
    aggregations: {
      triggers: TriggerAggregateSummary[]
      campaigns: CampaignAggregateSummary[]
      meta: {
        rangeStart: string
        computedAt: string
      }
    }
  }
}

type TrendResponse = {
  success: boolean
  data: {
    requestedDays: number
    from: string
    to: string
    totalRowsConsidered: number
    truncated: boolean
    days: Array<{
      date: string
      sent: number
      statuses: Record<'sent' | 'delivered' | 'opened' | 'clicked' | 'dismissed' | 'failed', number>
      events: {
        delivered: number
        opened: number
        clicked: number
        dismissed: number
      }
      types: Record<string, number>
    }>
  }
}

type SegmentFilters = {
  plans?: string[]
  countries?: string[]
  respectOptOut?: boolean
  onlyMarketingOptIn?: boolean
  onlyReminderOptIn?: boolean
  onlyTransactionOptIn?: boolean
}

type NotificationCampaign = {
  id: string
  name: string
  description: string | null
  campaign_type: string
  title: string
  body: string
  image_url: string | null
  data: Record<string, any> | null
  filters: SegmentFilters
  scheduled_for: string | null
  sent_at: string | null
  status: string
  target_users_count: number | null
  sent_count: number | null
  delivered_count: number | null
  opened_count: number | null
  clicked_count: number | null
  failed_count: number | null
  created_by: string | null
  created_at: string
  updated_at: string
}

type CampaignResponse = {
  success: boolean
  data: NotificationCampaign[]
  message?: string
}

type CampaignMutationResponse = {
  success: boolean
  data?: NotificationCampaign
  message?: string
}

const emptyTemplateForm = {
  name: '',
  description: '',
  type: 'system',
  title: '',
  body: '',
  data: '',
  tags: '',
}

const COUNTRY_OPTIONS = [
  { code: 'AR', name: 'Argentina' },
  { code: 'BO', name: 'Bolivia' },
  { code: 'BR', name: 'Brasil' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'ES', name: 'España' },
  { code: 'MX', name: 'México' },
  { code: 'PA', name: 'Panamá' },
  { code: 'PE', name: 'Perú' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'VE', name: 'Venezuela' },
] satisfies Array<{ code: string; name: string }>

export default function NotificationsPage() {
  const [targetMode, setTargetMode] = useState<'direct' | 'segment'>('direct')
  const [directTargetType, setDirectTargetType] = useState<'user' | 'token'>('user')
  const [targetValue, setTargetValue] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState('system')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [logs, setLogs] = useState<NotificationLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)

  const [summary, setSummary] = useState<SummaryResponse['data'] | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  const [trend, setTrend] = useState<TrendResponse['data'] | null>(null)
  const [trendLoading, setTrendLoading] = useState(false)
  const [trendError, setTrendError] = useState<string | null>(null)
  const [trendRange, setTrendRange] = useState(7)

  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)

  // Estados para monitoreo
  const [monitoringData, setMonitoringData] = useState<any>(null)
  const [monitoringLoading, setMonitoringLoading] = useState(false)
  const [templateError, setTemplateError] = useState<string | null>(null)
  const [templateFeedback, setTemplateFeedback] = useState<string | null>(null)
  const [templateForm, setTemplateForm] = useState({ ...emptyTemplateForm })
  const [templateSubmitting, setTemplateSubmitting] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null)
  const [segmentPlans, setSegmentPlans] = useState<string[]>([])
  const [segmentCountries, setSegmentCountries] = useState<string[]>([])
  const [segmentRespectOptOut, setSegmentRespectOptOut] = useState(true)
  const [segmentOnlyMarketing, setSegmentOnlyMarketing] = useState(false)
  const [segmentOnlyReminder, setSegmentOnlyReminder] = useState(false)
  const [segmentOnlyTransaction, setSegmentOnlyTransaction] = useState(false)
  const [previewResult, setPreviewResult] = useState<{ users: number; tokens: number } | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [showCountryModal, setShowCountryModal] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')

  const [campaigns, setCampaigns] = useState<NotificationCampaign[]>([])
  const [campaignsLoading, setCampaignsLoading] = useState(false)
  const [campaignError, setCampaignError] = useState<string | null>(null)
  const [campaignFeedback, setCampaignFeedback] = useState<string | null>(null)
  const [campaignSubmitting, setCampaignSubmitting] = useState(false)
  const [campaignEditing, setCampaignEditing] = useState<NotificationCampaign | null>(null)
  const [campaignName, setCampaignName] = useState('')
  const [campaignDescription, setCampaignDescription] = useState('')
  const [campaignTitle, setCampaignTitle] = useState('')
  const [campaignBody, setCampaignBody] = useState('')
  const [campaignImageUrl, setCampaignImageUrl] = useState('')
  const [campaignType, setCampaignType] = useState('marketing')
  const [campaignScheduledFor, setCampaignScheduledFor] = useState('')
  const [campaignSegmentPlans, setCampaignSegmentPlans] = useState<string[]>([])
  const [campaignSegmentCountries, setCampaignSegmentCountries] = useState<string[]>([])
  const [campaignRespectOptOut, setCampaignRespectOptOut] = useState(true)
  const [campaignOnlyMarketing, setCampaignOnlyMarketing] = useState(false)
  const [campaignOnlyReminder, setCampaignOnlyReminder] = useState(false)
  const [campaignOnlyTransaction, setCampaignOnlyTransaction] = useState(false)

  // Fase 1: Estado para el tab activo (Reorganización con tabs)
  // Fase 4: Persistencia - Restaurar tab desde localStorage
  type TabId = 'campaigns-form' | 'campaigns-list' | 'send' | 'templates' | 'history'
  const STORAGE_KEY = 'notifications_active_tab'
  
  // Función para obtener el tab inicial desde localStorage o usar 'send' por defecto
  const getInitialTab = (): TabId => {
    if (typeof window === 'undefined') return 'send'
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && ['campaigns-form', 'campaigns-list', 'send', 'templates', 'history'].includes(saved)) {
      return saved as TabId
    }
    return 'send'
  }
  
  const [activeTab, setActiveTab] = useState<TabId>(getInitialTab)
  
  // Fase 4: Persistencia - Guardar tab en localStorage cuando cambia
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, activeTab)
    }
  }, [activeTab])
  
  // Fase 4: Optimización - useCallback para evitar re-renders innecesarios
  const handleTabChange = useCallback((tabId: TabId) => {
    setActiveTab(tabId)
  }, [])

  // Definición de tabs
  const tabs: Array<{ id: TabId; label: string; icon: string }> = [
    { id: 'campaigns-form', label: 'Campañas programadas', icon: '📊' },
    { id: 'campaigns-list', label: 'Lista de campañas', icon: '📋' },
    { id: 'send', label: 'Enviar notificación', icon: '📤' },
    { id: 'templates', label: 'Templates guardados', icon: '📝' },
    { id: 'history', label: 'Historial reciente', icon: '📜' },
  ]

  const filteredCountries = useMemo(() => {
    const query = countrySearch.trim().toLowerCase()
    if (!query) return COUNTRY_OPTIONS
    return COUNTRY_OPTIONS.filter(
      (country) =>
        country.code.toLowerCase().includes(query) ||
        country.name.toLowerCase().includes(query)
    )
  }, [countrySearch])

  const sendEndpoint = '/api/notifications/send'
  const templatesEndpoint = '/api/notifications/templates'

  const fetchLogs = async () => {
    try {
      setLogsLoading(true)
      const res = await fetch('/api/notifications/logs?limit=20')
      const json = await res.json()
      if (json.success) {
        setLogs(json.data || [])
      } else {
        logger.warn('No se pudo cargar historial:', json.message)
      }
    } catch (err) {
      logger.error('Error cargando historial:', err)
    } finally {
      setLogsLoading(false)
    }
  }

  const fetchTemplates = async () => {
    try {
      setTemplatesLoading(true)
      setTemplateError(null)
      const res = await fetch('/api/notifications/templates')
      const json = await res.json()
      if (json.success) {
        setTemplates(json.data || [])
      } else {
        setTemplateError(json.message || 'No se pudieron cargar los templates')
      }
    } catch (err: any) {
      logger.error('Error cargando templates:', err)
      setTemplateError(err?.message || 'Error de conexión al cargar templates')
    } finally {
      setTemplatesLoading(false)
    }
  }

  const fetchCampaigns = async () => {
    try {
      setCampaignsLoading(true)
      setCampaignError(null)
      const res = await fetch('/api/notifications/campaigns')
      const json: CampaignResponse = await res.json()
      if (json.success) {
        setCampaigns(json.data || [])
      } else {
        setCampaignError(json.message || 'No se pudieron cargar las campañas')
      }
    } catch (error: any) {
      logger.error('Error cargando campañas:', error)
      setCampaignError(error?.message || 'Error de conexión al cargar campañas')
    } finally {
      setCampaignsLoading(false)
    }
  }

  const fetchMonitoring = async () => {
    try {
      setMonitoringLoading(true)
      const res = await fetch('/api/notifications/monitoring')
      const json = await res.json()
      if (json.success) {
        setMonitoringData(json.data)
      } else {
        logger.warn('No se pudo cargar monitoreo:', json.message)
      }
    } catch (err) {
      logger.error('Error cargando monitoreo:', err)
    } finally {
      setMonitoringLoading(false)
    }
  }

  const fetchSummary = async () => {
    try {
      setSummaryLoading(true)
      setSummaryError(null)
      const res = await fetch('/api/notifications/logs/summary')
      const json: SummaryResponse = await res.json()
      if (json.success) {
        setSummary(json.data)
      } else {
        setSummaryError((json as any)?.message || 'No se pudo obtener el resumen')
      }
    } catch (err: any) {
      logger.error('Error cargando summary:', err)
      setSummaryError(err?.message || 'Error de conexión al cargar summary')
    } finally {
      setSummaryLoading(false)
    }
  }

  const fetchTrend = async (range: number = trendRange) => {
    try {
      setTrendLoading(true)
      setTrendError(null)
      const res = await fetch(`/api/notifications/logs/trend?range=${range}`)
      const json: TrendResponse = await res.json()
      if (json.success) {
        setTrend(json.data)
      } else {
        setTrendError((json as any)?.message || 'No se pudo obtener la tendencia')
      }
    } catch (err: any) {
      logger.error('Error cargando trend:', err)
      setTrendError(err?.message || 'Error de conexión al cargar trend')
    } finally {
      setTrendLoading(false)
    }
  }

  const togglePlanSelection = (plan: string) => {
    setSegmentPlans((prev) =>
      prev.includes(plan) ? prev.filter((item) => item !== plan) : [...prev, plan]
    )
  }

  const toggleCountrySelection = (code: string) => {
    setSegmentCountries((prev) =>
      prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code]
    )
  }

  const clearCountries = () => {
    setSegmentCountries([])
  }

  useEffect(() => {
    fetchLogs()
    fetchTemplates()
    fetchCampaigns()
    fetchSummary()
    fetchTrend()
    fetchMonitoring()
  }, [])

  // Auto-refresh monitoreo cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMonitoring()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (targetMode === 'segment') {
      setTargetValue('')
    }
  }, [targetMode])

  const last7dWindow = summary?.windows?.last7d ?? {
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    dismissed: 0,
    failed: 0,
  }

  const kpiStats = useMemo(() => {
    const sent = last7dWindow.sent
    const delivered = last7dWindow.delivered
    const opened = last7dWindow.opened
    const clicked = last7dWindow.clicked
    const failed = last7dWindow.failed

    const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0
    const openRate = sent > 0 ? (opened / sent) * 100 : 0
    const clickRate = sent > 0 ? (clicked / sent) * 100 : 0
    const failureRate = sent > 0 ? (failed / sent) * 100 : 0

    return {
      sent,
      delivered,
      opened,
      clicked,
      failed,
      deliveryRate,
      openRate,
      clickRate,
      failureRate,
    }
  }, [last7dWindow])

  const trendChartData = useMemo(() => {
    if (!trend?.days?.length) return []
    return trend.days.map((day) => ({
      date: day.date,
      sent: day.sent,
      delivered: Math.max(day.statuses.delivered ?? 0, day.events.delivered ?? 0),
      opened: Math.max(day.statuses.opened ?? 0, day.events.opened ?? 0),
      clicked: Math.max(day.statuses.clicked ?? 0, day.events.clicked ?? 0),
    }))
  }, [trend])

  const statusEntries = useMemo(() => {
    if (!summary?.byStatus) return []
    return Object.entries(summary.byStatus)
      .map(([key, value]) => ({
        key,
        count: value?.count ?? 0,
        error: value?.error,
      }))
      .sort((a, b) => b.count - a.count)
  }, [summary])

  const metricEntries = summary?.metrics ?? []

  const numberFormatter = useMemo(() => new Intl.NumberFormat('es-ES'), [])
  const percentFormatter = useMemo(
    () =>
      new Intl.NumberFormat('es-ES', {
        maximumFractionDigits: 1,
      }),
    []
  )

  const formatDateTime = (iso: string | null | undefined) => {
    if (!iso) return '—'
    try {
      return new Date(iso).toLocaleString('es-ES', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    } catch {
      return iso
    }
  }

  const summaryRangeStart = summary?.aggregations?.meta?.rangeStart ?? null

  const triggerBreakdown = useMemo(() => {
    const items = summary?.aggregations?.triggers ?? []
    return items
      .map((item) => ({
        key: item.key,
        label: TRIGGER_LABELS[item.key] ?? item.key,
        stats: item.windows.last7d,
        total: item.total,
        lastSentAt: item.lastSentAt,
        lastTriggerRunAt: item.lastTriggerRunAt,
      }))
      .filter((entry) => entry.total.sent > 0 || entry.stats.sent > 0)
      .slice(0, 6)
  }, [summary])

  const campaignLookup = useMemo(() => {
    const map = new Map<string, NotificationCampaign>()
    campaigns.forEach((campaign) => {
      map.set(campaign.id, campaign)
    })
    return map
  }, [campaigns])

  const campaignBreakdown = useMemo(() => {
    const items = summary?.aggregations?.campaigns ?? []
    return items
      .map((item) => {
        const campaign = campaignLookup.get(item.id)
        return {
          id: item.id,
          name: campaign?.name || 'Campaña sin nombre',
          status: campaign?.status || null,
          stats: item.windows.last7d,
          total: item.total,
          lastSentAt: item.lastSentAt || campaign?.sent_at || null,
        }
      })
      .filter((entry) => entry.total.sent > 0 || entry.stats.sent > 0)
      .slice(0, 6)
  }, [summary, campaignLookup])

  const handleTrendRangeChange = (value: number) => {
    const sanitized = Number.isNaN(value) ? 7 : value
    setTrendRange(sanitized)
    fetchTrend(sanitized)
  }

  const campaignStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-700'
      case 'sending':
        return 'bg-purple-100 text-purple-700'
      case 'sent':
        return 'bg-green-100 text-green-700'
      case 'cancelled':
        return 'bg-gray-100 text-gray-600'
      case 'failed':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-yellow-100 text-yellow-700'
    }
  }

  const resetCampaignForm = () => {
    setCampaignName('')
    setCampaignDescription('')
    setCampaignTitle('')
    setCampaignBody('')
    setCampaignImageUrl('')
    setCampaignType('marketing')
    setCampaignScheduledFor('')
    setCampaignSegmentPlans([])
    setCampaignSegmentCountries([])
    setCampaignRespectOptOut(true)
    setCampaignOnlyMarketing(false)
    setCampaignOnlyReminder(false)
    setCampaignOnlyTransaction(false)
    setCampaignEditing(null)
    setCampaignFeedback(null)
    setCampaignError(null)
  }

  const handleCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCampaignFeedback(null)
    setCampaignError(null)

    if (!campaignName.trim() || campaignName.trim().length < 3) {
      setCampaignError('El nombre debe tener al menos 3 caracteres.')
      return
    }

    if (!campaignTitle.trim()) {
      setCampaignError('El título es obligatorio.')
      return
    }

    if (!campaignBody.trim()) {
      setCampaignError('El cuerpo es obligatorio.')
      return
    }

    const payload: Record<string, any> = {
      name: campaignName.trim(),
      description: campaignDescription.trim() || null,
      title: campaignTitle.trim(),
      body: campaignBody.trim(),
      imageUrl: campaignImageUrl.trim() || null,
      campaignType,
      filters: {
        plans: campaignSegmentPlans,
        countries: campaignSegmentCountries,
        respectOptOut: campaignRespectOptOut,
        onlyMarketingOptIn: campaignOnlyMarketing,
        onlyReminderOptIn: campaignOnlyReminder,
        onlyTransactionOptIn: campaignOnlyTransaction,
      } satisfies SegmentFilters,
      scheduledFor: campaignScheduledFor || null,
      status: campaignScheduledFor ? 'scheduled' : 'draft',
    }

    setCampaignSubmitting(true)
    try {
      const isEditing = Boolean(campaignEditing)
      const endpoint = isEditing
        ? `/api/notifications/campaigns/${campaignEditing!.id}`
        : '/api/notifications/campaigns'
      const response = await fetch(endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      const data: CampaignMutationResponse = await response.json()

      if (response.ok && data.success) {
        setCampaignFeedback(
          isEditing ? 'Campaña actualizada correctamente.' : 'Campaña creada correctamente.'
        )
        resetCampaignForm()
        fetchCampaigns()
      } else {
        setCampaignError(data?.message || 'Error guardando la campaña')
      }
    } catch (error: any) {
      logger.error('Error guardando campaña:', error)
      setCampaignError(error?.message || 'Error de conexión al guardar campaña')
    } finally {
      setCampaignSubmitting(false)
    }
  }

  const handleEditCampaign = (campaign: NotificationCampaign) => {
    setCampaignEditing(campaign)
    setCampaignName(campaign.name)
    setCampaignDescription(campaign.description || '')
    setCampaignTitle(campaign.title)
    setCampaignBody(campaign.body)
    setCampaignImageUrl(campaign.image_url || '')
    setCampaignType(campaign.campaign_type || 'marketing')
    setCampaignScheduledFor(campaign.scheduled_for ? campaign.scheduled_for.slice(0, 16) : '')

    const filters = campaign.filters || {}
    setCampaignSegmentPlans(filters.plans || [])
    setCampaignSegmentCountries(filters.countries || [])
    setCampaignRespectOptOut(filters.respectOptOut !== false)
    setCampaignOnlyMarketing(filters.onlyMarketingOptIn === true)
    setCampaignOnlyReminder(filters.onlyReminderOptIn === true)
    setCampaignOnlyTransaction(filters.onlyTransactionOptIn === true)
    setCampaignFeedback(null)
  }

  const handleExecuteCampaign = async (campaign: NotificationCampaign) => {
    try {
      setCampaignError(null)
      setCampaignFeedback(null)
      const response = await fetch(`/api/notifications/campaigns/${campaign.id}/execute`, {
        method: 'POST',
      })
      const result = await response.json()
      if (response.ok && result.success) {
        setCampaignFeedback(
          result.summary?.sent
            ? 'Campaña ejecutada correctamente.'
            : 'Campaña ejecutada sin destinatarios.'
        )
        fetchCampaigns()
        fetchSummary()
        fetchTrend(trendRange)
      } else {
        setCampaignError(result?.message || 'Error ejecutando la campaña')
      }
    } catch (error: any) {
      logger.error('Error ejecutando campaña:', error)
      setCampaignError(error?.message || 'Error de conexión al ejecutar campaña')
    }
  }

  const handleCancelCampaign = async (campaign: NotificationCampaign) => {
    if (!confirm(`¿Cancelar la campaña "${campaign.name}"?`)) return
    try {
      setCampaignError(null)
      setCampaignFeedback(null)
      const response = await fetch(`/api/notifications/campaigns/${campaign.id}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      if (response.ok && result.success) {
        setCampaignFeedback('Campaña cancelada.')
        fetchCampaigns()
      } else {
        setCampaignError(result?.message || 'No se pudo cancelar la campaña')
      }
    } catch (error: any) {
      logger.error('Error cancelando campaña:', error)
      setCampaignError(error?.message || 'Error de conexión al cancelar campaña')
    }
  }


  const resetTemplateForm = () => {
    setTemplateForm({ ...emptyTemplateForm })
    setEditingTemplate(null)
  }

  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTemplateFeedback(null)
    setTemplateError(null)

    const trimmed = {
      name: templateForm.name.trim(),
      description: templateForm.description.trim(),
      type: templateForm.type,
      title: templateForm.title.trim(),
      body: templateForm.body.trim(),
      data: templateForm.data.trim(),
      tags: templateForm.tags.trim(),
    }

    if (!trimmed.name || trimmed.name.length < 3) {
      setTemplateError('El nombre debe tener al menos 3 caracteres.')
      return
    }

    if (!trimmed.title) {
      setTemplateError('El título es obligatorio.')
      return
    }

    if (!trimmed.body) {
      setTemplateError('El cuerpo es obligatorio.')
      return
    }

    let parsedData: Record<string, any> | null = null
    if (trimmed.data) {
      try {
        parsedData = JSON.parse(trimmed.data)
        if (typeof parsedData !== 'object' || Array.isArray(parsedData)) {
          throw new Error('Debe ser un objeto JSON')
        }
      } catch (err: any) {
        setTemplateError(`JSON inválido: ${err?.message || 'Formato incorrecto'}`)
        return
      }
    }

    const payload = {
      name: trimmed.name,
      description: trimmed.description || null,
      type: trimmed.type,
      title: trimmed.title,
      body: trimmed.body,
      data: parsedData,
      tags: trimmed.tags
        ? trimmed.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : [],
    }

    setTemplateSubmitting(true)
    try {
      const endpoint = editingTemplate
        ? `${templatesEndpoint}/${editingTemplate.id}`
        : templatesEndpoint

      const response = await fetch(
        editingTemplate ? `/api/notifications/templates/${editingTemplate.id}` : '/api/notifications/templates',
        {
        method: editingTemplate ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        }
      )

      const data = await response.json()

      if (response.ok && data.success) {
        setTemplateFeedback(
          editingTemplate
            ? 'Template actualizado correctamente.'
            : 'Template creado correctamente.'
        )
        resetTemplateForm()
        fetchTemplates()
      } else {
        setTemplateError(data?.message || 'Error al guardar el template')
      }
    } catch (err: any) {
      logger.error('Error guardando template:', err)
      setTemplateError(err?.message || 'Error de conexión al guardar template')
    } finally {
      setTemplateSubmitting(false)
    }
  }

  const handleEditTemplate = (template: NotificationTemplate) => {
    setEditingTemplate(template)
    setTemplateForm({
      name: template.name,
      description: template.description || '',
      type: template.type,
      title: template.title,
      body: template.body,
      data: template.data ? JSON.stringify(template.data, null, 2) : '',
      tags: template.tags ? template.tags.join(', ') : '',
    })
  }

  const handleDeleteTemplate = async (template: NotificationTemplate) => {
    if (!confirm(`¿Eliminar el template "${template.name}"?`)) return

    try {
      const response = await fetch(`/api/notifications/templates/${template.id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setTemplateFeedback('Template eliminado correctamente.')
        if (editingTemplate?.id === template.id) {
          resetTemplateForm()
        }
        fetchTemplates()
      } else {
        setTemplateError(data?.message || 'No se pudo eliminar el template')
      }
    } catch (err: any) {
      logger.error('Error eliminando template:', err)
      setTemplateError(err?.message || 'Error de conexión al eliminar template')
    }
  }

  const handleApplyTemplate = (template: NotificationTemplate) => {
    setTitle(template.title)
    setBody(template.body)
    setType(template.type)
    setFeedback(`Template "${template.name}" aplicado al formulario.`)
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)
    setError(null)
    setPreviewResult(null)

    if (!title.trim() || !body.trim()) {
      setError('Completa título y mensaje antes de enviar')
      return
    }

    if (targetMode === 'direct' && !targetValue.trim()) {
      setError('Debes indicar el usuario o token de destino')
      return
    }

    setLoading(true)
    try {
      const payload: Record<string, any> = {
        title: title.trim(),
        body: body.trim(),
        type,
        adminId: 'admin-panel',
      }

      if (targetMode === 'direct') {
        if (directTargetType === 'user') {
          payload.target = 'user'
          payload.userId = targetValue.trim()
        } else {
          payload.target = 'token'
          payload.token = targetValue.trim()
        }
      } else {
        payload.target = 'segment'
        payload.segment = {
          plans: segmentPlans,
          countries: segmentCountries,
          respectOptOut: segmentRespectOptOut,
          onlyMarketingOptIn: segmentOnlyMarketing,
          onlyReminderOptIn: segmentOnlyReminder,
          onlyTransactionOptIn: segmentOnlyTransaction,
        }
      }

      const response = await fetch(sendEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setFeedback('Notificación enviada correctamente.')
        if (targetMode === 'direct') {
          setTargetValue('')
        }
        setTitle('')
        setBody('')
        fetchLogs()
      } else {
        const msg = data?.message || 'Error enviando la notificación'
        setError(msg)
      }
    } catch (err: any) {
      logger.error('Error enviando notificación:', err)
      setError(err?.message || 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handlePreviewSegment = async () => {
    if (targetMode !== 'segment') return
    setPreviewResult(null)
    setError(null)

    setPreviewLoading(true)
    try {
      const payload = {
        type,
        target: 'segment',
        segment: {
          plans: segmentPlans,
          countries: segmentCountries,
          respectOptOut: segmentRespectOptOut,
          onlyMarketingOptIn: segmentOnlyMarketing,
          onlyReminderOptIn: segmentOnlyReminder,
          onlyTransactionOptIn: segmentOnlyTransaction,
        },
        preview: true,
        adminId: 'admin-panel',
      }

      const response = await fetch(sendEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (response.ok && data.success && data.preview) {
        setPreviewResult({
          users: data.preview.users || 0,
          tokens: data.preview.tokens || 0,
        })
        setFeedback('Segmento calculado')
      } else {
        setError(data?.message || 'No se pudo calcular el segmento')
      }
    } catch (err: any) {
      logger.error('Error calculando segmento:', err)
      setError(err?.message || 'Error de conexión al calcular segmento')
    } finally {
      setPreviewLoading(false)
    }
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BellRing className="h-6 w-6 text-purple-600" />
              Centro de Notificaciones
            </h1>
            <p className="text-sm text-gray-500">
              Envía notificaciones push manuales, guarda templates y revisa el historial reciente.
            </p>
          </div>
        </div>
      </div>

      {/* KPIs - Resumen rápido */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(summaryLoading ? Array.from({ length: 4 }) : [0, 1, 2, 3]).map((_, index) => {
          if (summaryLoading) {
            return (
              <div
                key={`kpi-skeleton-${index}`}
                className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm animate-pulse"
              >
                <div className="h-4 w-24 rounded-full bg-gray-200" />
                <div className="mt-4 h-8 w-36 rounded-full bg-gray-200" />
                <div className="mt-2 h-3 w-20 rounded-full bg-gray-100" />
              </div>
            )
          }

          const cards = [
            {
              title: 'Envíos (7 días)',
              value: numberFormatter.format(kpiStats.sent),
              subtitle: `${numberFormatter.format(kpiStats.delivered)} entregadas`,
            },
            {
              title: 'Tasa de entrega',
              value: `${percentFormatter.format(kpiStats.deliveryRate)}%`,
              subtitle: `${numberFormatter.format(kpiStats.failed)} fallidas`,
            },
            {
              title: 'Open rate',
              value: `${percentFormatter.format(kpiStats.openRate)}%`,
              subtitle: `${numberFormatter.format(kpiStats.opened)} aperturas`,
            },
            {
              title: 'Click rate',
              value: `${percentFormatter.format(kpiStats.clickRate)}%`,
              subtitle: `${numberFormatter.format(kpiStats.clicked)} clics`,
            },
          ]

          const card = cards[index]
          return (
            <div
              key={card.title}
              className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-medium text-gray-500">{card.title}</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="mt-1 text-xs text-gray-500">{card.subtitle}</p>
            </div>
          )
        })}
      </div>

      {summaryError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="mr-2 inline h-4 w-4" />
          {summaryError}
        </div>
      )}

      {/* Sección: Analíticas y Gráficos - Movida antes de Monitoreo del Cron */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Actividad por día</h2>
              <p className="text-xs text-gray-500">
                Envíos y eventos registrados en los últimos {trendRange} días
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-500">Rango</label>
              <select
                value={trendRange}
                onChange={(e) => handleTrendRangeChange(Number(e.target.value))}
                className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              >
                {[7, 14, 30, 60, 90].map((days) => (
                  <option key={days} value={days}>
                    {days} días
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 h-72">
            {trendLoading ? (
              <div className="flex h-full items-center justify-center text-gray-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Calculando tendencia...
              </div>
            ) : trendChartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                Aún no hay datos suficientes para mostrar la tendencia.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendChartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend iconType="circle" />
                  <Line type="monotone" dataKey="sent" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="delivered" stroke="#22c55e" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="opened" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="clicked" stroke="#ec4899" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Distribución de estados</h2>
          <p className="text-xs text-gray-500 mb-4">
            Totales acumulados y métricas disponibles en la base de datos.
          </p>

          <div className="space-y-3">
            {summaryLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="h-3 w-24 rounded-full bg-gray-200" />
                    <div className="h-3 w-12 rounded-full bg-gray-100" />
                  </div>
                ))}
              </div>
            ) : (
              statusEntries.slice(0, 6).map((item) => (
                <div key={item.key} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-gray-600">{item.key}</span>
                  <span className="font-semibold text-gray-900">
                    {numberFormatter.format(item.count)}
                  </span>
                </div>
              ))
            )}
          </div>

          {metricEntries.length > 0 && (
            <div className="mt-6 border-t border-gray-100 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Columnas métricas
              </h3>
              <div className="mt-2 space-y-2">
                {metricEntries.map((metric) => (
                  <div key={metric.name} className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{metric.name.replace('_', ' ')}</span>
                    <span className="font-semibold text-gray-900">
                      {numberFormatter.format(metric.count)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sección de Monitoreo del Cron - Movida antes de los tabs */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              Monitoreo del Cron
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Estado de salud y ejecuciones del cron automático de notificaciones
            </p>
          </div>
          <button
            onClick={fetchMonitoring}
            disabled={monitoringLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
          >
            {monitoringLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              '↻ Actualizar'
            )}
          </button>
        </div>

        {monitoringLoading && !monitoringData ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : monitoringData ? (
          <div className="space-y-6">
            {/* Estado actual */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-blue-50 to-blue-100/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-blue-700">Última Ejecución</p>
                    <p className="mt-1 text-lg font-bold text-blue-900">
                      {monitoringData.lastHealth
                        ? formatDateTime(monitoringData.lastHealth.timestamp)
                        : 'N/A'}
                    </p>
                  </div>
                  {monitoringData.lastHealth?.success ? (
                    <div className="rounded-full bg-green-500 p-2">
                      <div className="h-2 w-2 rounded-full bg-white"></div>
                    </div>
                  ) : (
                    <div className="rounded-full bg-red-500 p-2">
                      <div className="h-2 w-2 rounded-full bg-white"></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-purple-50 to-purple-100/50 p-4">
                <div>
                  <p className="text-xs font-medium text-purple-700">Ejecuciones Exitosas</p>
                  <p className="mt-1 text-lg font-bold text-purple-900">
                    {monitoringData.stats?.successfulExecutions || 0} / {monitoringData.stats?.totalExecutions || 0}
                  </p>
                  <p className="mt-1 text-xs text-purple-600">
                    {monitoringData.stats?.totalExecutions > 0
                      ? Math.round(
                          (monitoringData.stats.successfulExecutions /
                            monitoringData.stats.totalExecutions) *
                            100
                        )
                      : 0}
                    % de éxito
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4">
                <div>
                  <p className="text-xs font-medium text-emerald-700">Promedio Triggers</p>
                  <p className="mt-1 text-lg font-bold text-emerald-900">
                    {monitoringData.stats?.averageTriggersProcessed || 0}
                  </p>
                  <p className="mt-1 text-xs text-emerald-600">por ejecución</p>
                </div>
              </div>
            </div>

            {/* Problemas detectados */}
            {monitoringData.issues && monitoringData.issues.length > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-amber-900">Problemas Detectados</h3>
                    <ul className="mt-2 space-y-1">
                      {monitoringData.issues.map((issue: any, idx: number) => (
                        <li key={idx} className="text-sm text-amber-800">
                          • {issue.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Estado de alertas */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Sistema de Alertas</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {monitoringData.alertWebhookConfigured
                      ? 'Webhook configurado - Alertas activas'
                      : 'Webhook no configurado - Configura NOTIFICATIONS_ALERT_WEBHOOK_URL'}
                  </p>
                </div>
                {monitoringData.alertWebhookConfigured ? (
                  <div className="rounded-full bg-green-100 px-3 py-1">
                    <span className="text-xs font-semibold text-green-700">Activo</span>
                  </div>
                ) : (
                  <div className="rounded-full bg-gray-200 px-3 py-1">
                    <span className="text-xs font-semibold text-gray-600">Inactivo</span>
                  </div>
                )}
              </div>
            </div>

            {/* Últimas ejecuciones */}
            {monitoringData.recentHealths && monitoringData.recentHealths.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Últimas Ejecuciones</h3>
                <div className="space-y-2">
                  {monitoringData.recentHealths.slice(0, 5).map((health: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-3 w-3 rounded-full ${
                            health.success ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        ></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDateTime(health.timestamp)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {health.triggersProcessed}/{health.triggersTotal} triggers •{' '}
                            {health.campaignsProcessed} campañas
                          </p>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          health.success
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {health.success ? 'Éxito' : 'Falló'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm font-medium text-gray-600">No hay datos de monitoreo</p>
            <p className="mt-1 text-xs text-gray-500">
              El cron aún no se ha ejecutado o no hay datos disponibles
            </p>
          </div>
        )}
      </div>

      {/* Fase 1: Tabs de navegación - Botones para organizar secciones */}
      {/* Fase 3: Mejoras visuales y UX - Estilos mejorados, animaciones, responsive */}
      <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 sm:px-5 sm:py-3 text-sm font-semibold transition-all duration-300 ease-in-out transform ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 scale-105 hover:scale-110'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 hover:border-purple-300 hover:shadow-md hover:scale-105'
              }`}
              aria-pressed={activeTab === tab.id}
              aria-label={`Cambiar a ${tab.label}`}
            >
              <span className="text-base sm:text-lg transition-transform duration-300">{tab.icon}</span>
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </div>
        {/* Debug: Mostrar tab activo (temporal para testing) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 text-xs text-gray-400">
            Tab activo: <span className="font-mono">{activeTab}</span>
          </div>
        )}
      </div>

      {/* Sección: Resumen de Automatizaciones y Campañas */}
      {(summaryLoading || triggerBreakdown.length > 0 || campaignBreakdown.length > 0) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-gray-900">Automatizaciones (últimos 7 días)</h2>
              <p className="text-xs text-gray-500">
                Resumen de triggers automáticos
                {summaryRangeStart
                  ? ` · rango desde ${formatDateTime(summaryRangeStart)}`
                  : '.'
                }
              </p>
            </div>
            <div className="mt-4">
              {summaryLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={`trigger-skeleton-${idx}`} className="animate-pulse space-y-2 rounded-2xl border border-gray-100 p-4">
                      <div className="h-4 w-48 rounded-full bg-gray-200" />
                      <div className="h-3 w-64 rounded-full bg-gray-100" />
                    </div>
                  ))}
                </div>
              ) : triggerBreakdown.length === 0 ? (
                <p className="text-sm text-gray-500">Aún no se registran envíos automáticos en este rango.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100 text-sm">
                    <thead className="text-xs uppercase text-gray-500">
                      <tr>
                        <th className="py-3 pr-3 text-left">Trigger</th>
                        <th className="py-3 px-3 text-right">Enviadas</th>
                        <th className="py-3 px-3 text-right">Entregadas</th>
                        <th className="py-3 px-3 text-right">Clics</th>
                        <th className="py-3 px-3 text-right">Último envío</th>
                        <th className="py-3 pl-3 text-right">Última ejecución</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-600">
                      {triggerBreakdown.map((item) => (
                        <tr key={item.key} className="hover:bg-gray-50/80 transition">
                          <td className="py-3 pr-3">
                            <div className="font-medium text-gray-900">{item.label}</div>
                            <div className="text-xs text-gray-500">{item.key}</div>
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-gray-900">
                            {numberFormatter.format(item.stats.sent)}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {numberFormatter.format(item.stats.delivered)}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {numberFormatter.format(item.stats.clicked)}
                          </td>
                          <td className="py-3 px-3 text-right">{formatDateTime(item.lastSentAt)}</td>
                          <td className="py-3 pl-3 text-right">{formatDateTime(item.lastTriggerRunAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-gray-900">Campañas (últimos 7 días)</h2>
              <p className="text-xs text-gray-500">
                Métricas recientes de campañas programadas
                {summaryRangeStart
                  ? ` · rango desde ${formatDateTime(summaryRangeStart)}`
                  : '.'
                }
              </p>
            </div>
            <div className="mt-4">
              {summaryLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={`campaign-skeleton-${idx}`} className="animate-pulse space-y-2 rounded-2xl border border-gray-100 p-4">
                      <div className="h-4 w-52 rounded-full bg-gray-200" />
                      <div className="h-3 w-64 rounded-full bg-gray-100" />
                    </div>
                  ))}
                </div>
              ) : campaignBreakdown.length === 0 ? (
                <p className="text-sm text-gray-500">Aún no se registran campañas con actividad reciente.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100 text-sm">
                    <thead className="text-xs uppercase text-gray-500">
                      <tr>
                        <th className="py-3 pr-3 text-left">Campaña</th>
                        <th className="py-3 px-3 text-right">Enviadas</th>
                        <th className="py-3 px-3 text-right">Entregadas</th>
                        <th className="py-3 px-3 text-right">Clics</th>
                        <th className="py-3 px-3 text-right">Estado</th>
                        <th className="py-3 pl-3 text-right">Último envío</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-600">
                      {campaignBreakdown.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/80 transition">
                          <td className="py-3 pr-3">
                            <div className="font-medium text-gray-900">{item.name}</div>
                            <div className="text-xs text-gray-500">{item.id}</div>
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-gray-900">
                            {numberFormatter.format(item.stats.sent)}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {numberFormatter.format(item.stats.delivered)}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {numberFormatter.format(item.stats.clicked)}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {item.status ? (
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${campaignStatusBadge(
                                  item.status
                                )}`}
                              >
                                {item.status}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="py-3 pl-3 text-right">{formatDateTime(item.lastSentAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sección: Campañas programadas - Fase 2: Mostrar solo si activeTab === 'campaigns-form' */}
      {activeTab === 'campaigns-form' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
          <form
            onSubmit={handleCampaignSubmit}
            className="space-y-4"
          >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Campañas programadas</h2>
              <p className="text-sm text-gray-500">
                Diseña envíos recurrentes o programados para segmentos específicos.
              </p>
            </div>
            {campaignEditing && (
              <button
                type="button"
                onClick={resetCampaignForm}
                className="text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Cancelar edición
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Nombre</label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Campaña referidos Q4"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tipo</label>
              <select
                value={campaignType}
                onChange={(e) => setCampaignType(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 text-sm"
              >
                {['marketing', 'reminder', 'transaction', 'system', 'referral', 'payment'].map(
                  (option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Descripción</label>
            <input
              type="text"
              value={campaignDescription}
              onChange={(e) => setCampaignDescription(e.target.value)}
              placeholder="Detalle interno (opcional)"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Título</label>
              <input
                type="text"
                value={campaignTitle}
                onChange={(e) => setCampaignTitle(e.target.value)}
                placeholder="🎉 Oferta exclusiva"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Imagen (URL)</label>
              <input
                type="text"
                value={campaignImageUrl}
                onChange={(e) => setCampaignImageUrl(e.target.value)}
                placeholder="https://cdn.tuapp.com/banner.jpg"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Mensaje</label>
            <textarea
              value={campaignBody}
              onChange={(e) => setCampaignBody(e.target.value)}
              rows={4}
              placeholder="Comparte la noticia con tus referidos..."
              className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Programar envío</label>
            <input
              type="datetime-local"
              value={campaignScheduledFor}
              onChange={(e) => setCampaignScheduledFor(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 text-sm"
            />
            <p className="text-xs text-gray-500">
              Déjalo vacío para guardar como borrador y ejecutarlo manualmente.
            </p>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-gray-50/70 p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-900">Segmentación</p>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600">Planes objetivo</label>
              <div className="flex flex-wrap gap-2">
                {['free', 'smart', 'pro', 'caducado'].map((plan) => (
                  <button
                    type="button"
                    key={plan}
                    onClick={() =>
                      setCampaignSegmentPlans((prev) =>
                        prev.includes(plan)
                          ? prev.filter((item) => item !== plan)
                          : [...prev, plan]
                      )
                    }
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      campaignSegmentPlans.includes(plan)
                        ? 'border-purple-500 bg-purple-100 text-purple-700'
                        : 'border-gray-200 text-gray-600 hover:border-purple-400 hover:text-purple-600'
                    }`}
                  >
                    {plan}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600">Países</label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto rounded-2xl border border-dashed border-gray-200 p-3 bg-white">
                {COUNTRY_OPTIONS.map((country) => {
                  const selected = campaignSegmentCountries.includes(country.code)
                  return (
                    <button
                      type="button"
                      key={country.code}
                      onClick={() =>
                        setCampaignSegmentCountries((prev) =>
                          prev.includes(country.code)
                            ? prev.filter((item) => item !== country.code)
                            : [...prev, country.code]
                        )
                      }
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        selected
                          ? 'border-purple-500 bg-purple-100 text-purple-700'
                          : 'border-gray-200 text-gray-600 hover:border-purple-400 hover:text-purple-600'
                      }`}
                    >
                      {country.name}
                    </button>
                  )
                })}
              </div>
              <p className="text-[11px] text-gray-500">
                Si no seleccionas países, se incluirán usuarios de cualquier país.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="inline-flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  className="text-purple-600 focus:ring-purple-500"
                  checked={campaignRespectOptOut}
                  onChange={(e) => setCampaignRespectOptOut(e.target.checked)}
                />
                Respetar usuarios con push desactivado
              </label>
              <label className="inline-flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  className="text-purple-600 focus:ring-purple-500"
                  checked={campaignOnlyMarketing}
                  onChange={(e) => setCampaignOnlyMarketing(e.target.checked)}
                />
                Solo marketing opt-in
              </label>
              <label className="inline-flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  className="text-purple-600 focus:ring-purple-500"
                  checked={campaignOnlyReminder}
                  onChange={(e) => setCampaignOnlyReminder(e.target.checked)}
                />
                Solo recordatorios opt-in
              </label>
              <label className="inline-flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  className="text-purple-600 focus:ring-purple-500"
                  checked={campaignOnlyTransaction}
                  onChange={(e) => setCampaignOnlyTransaction(e.target.checked)}
                />
                Solo alertas de movimientos opt-in
              </label>
            </div>
          </div>

          {campaignError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              {campaignError}
            </div>
          )}
          {campaignFeedback && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {campaignFeedback}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={campaignSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90 transition disabled:opacity-50"
            >
              {campaignSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <FilePlus2 className="h-4 w-4" />
                  {campaignEditing ? 'Actualizar campaña' : 'Crear campaña'}
                </>
              )}
            </button>
            {campaignEditing && (
              <button
                type="button"
                onClick={resetCampaignForm}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancelar
              </button>
            )}
          </div>
          </form>
        </div>
      )}

      {/* Sección: Lista de campañas - Fase 2: Mostrar solo si activeTab === 'campaigns-list' */}
      {/* Fase 3: Animación suave de entrada */}
      {activeTab === 'campaigns-list' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BellRing className="h-5 w-5 text-purple-600" />
                Lista de campañas
              </h2>
              <p className="text-sm text-gray-500">
                Visualiza estado, resultados y ejecuta campañas manualmente.
              </p>
            </div>
            <button
              onClick={fetchCampaigns}
              className="text-sm font-medium text-purple-600 hover:text-purple-700"
            >
              Actualizar
            </button>
          </div>

          {campaignsLoading ? (
            <div className="flex items-center justify-center py-10 text-gray-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Cargando campañas...
            </div>
          ) : campaigns.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
              Aún no hay campañas registradas.
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        {campaign.name}
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${campaignStatusBadge(
                            campaign.status
                          )}`}
                        >
                          {campaign.status}
                        </span>
                      </div>
                      {campaign.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{campaign.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Creada:{' '}
                        {new Date(campaign.created_at).toLocaleString('es-ES')}
                      </p>
                      {campaign.scheduled_for && (
                        <p className="text-xs text-gray-500">
                          Programada para:{' '}
                          {new Date(campaign.scheduled_for).toLocaleString('es-ES')}
                        </p>
                      )}
                      {campaign.sent_at && (
                        <p className="text-xs text-gray-500">
                          Enviada el: {new Date(campaign.sent_at).toLocaleString('es-ES')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>
                        Destinatarios:{' '}
                        {numberFormatter.format(campaign.target_users_count || 0)}
                      </span>
                      <span>
                        Enviadas: {numberFormatter.format(campaign.sent_count || 0)}
                      </span>
                      <span>
                        Fallidas: {numberFormatter.format(campaign.failed_count || 0)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <button
                      onClick={() => handleEditCampaign(campaign)}
                      className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 font-medium text-gray-600 hover:text-gray-800"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </button>
                    {campaign.status !== 'cancelled' && campaign.status !== 'sent' && (
                      <button
                        onClick={() => handleExecuteCampaign(campaign)}
                        className="inline-flex items-center gap-1 rounded-full border border-purple-200 px-3 py-1 font-medium text-purple-600 hover:border-purple-400"
                      >
                        <Send className="h-3.5 w-3.5" />
                        {campaign.status === 'scheduled' ? 'Enviar ahora' : 'Ejecutar'}
                      </button>
                    )}
                    {campaign.status !== 'cancelled' && campaign.status !== 'sent' && (
                      <button
                        onClick={() => handleCancelCampaign(campaign)}
                        className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 font-medium text-red-600 hover:border-red-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {summaryError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="mr-2 inline h-4 w-4" />
          {summaryError}
        </div>
      )}

      {/* Sección: Enviar notificación - Fase 2: Mostrar solo si activeTab === 'send' */}
      {/* Fase 3: Animación suave de entrada */}
      {activeTab === 'send' && (
        <form
          onSubmit={handleSend}
          className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4 animate-fadeIn"
        >
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Enviar notificación</h2>
            <p className="text-sm text-gray-500">
              Completa el formulario para enviar una notificación manual.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-2xl px-4 py-3">
            <Copy className="h-4 w-4 text-purple-600" />
            <div className="flex-1 text-xs text-purple-700">
              Selecciona un template guardado para completar automáticamente título, mensaje y tipo.
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">Modo de envío</label>
            <div className="flex flex-wrap gap-3">
              <label className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm cursor-pointer transition hover:border-purple-400 hover:text-purple-600">
                <input
                  type="radio"
                  className="text-purple-600 focus:ring-purple-500"
                  value="direct"
                  checked={targetMode === 'direct'}
                  onChange={() => setTargetMode('direct')}
                />
                Destinatario específico
              </label>
              <label className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm cursor-pointer transition hover:border-purple-400 hover:text-purple-600">
                <input
                  type="radio"
                  className="text-purple-600 focus:ring-purple-500"
                  value="segment"
                  checked={targetMode === 'segment'}
                  onChange={() => setTargetMode('segment')}
                />
                Segmento de usuarios
              </label>
            </div>
          </div>

          {targetMode === 'direct' ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Enviar a</label>
                <select
                  value={directTargetType}
                  onChange={(e) => setDirectTargetType(e.target.value as 'user' | 'token')}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 text-sm"
                >
                  <option value="user">Usuario (userId)</option>
                  <option value="token">Token FCM</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {directTargetType === 'user' ? 'ID de usuario' : 'Token FCM'}
                </label>
                <input
                  type="text"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder={directTargetType === 'user' ? 'UUID del usuario' : 'Token FCM'}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 text-sm"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4 rounded-3xl border border-gray-100 bg-gray-50/70 p-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">Segmento de usuarios</p>
                <p className="text-xs text-gray-500">
                  Selecciona los criterios para determinar a quién se enviará esta notificación.
                </p>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-medium text-gray-600">Planes objetivo</label>
                <div className="flex flex-wrap gap-2">
                  {['free', 'smart', 'pro', 'caducado'].map((plan) => (
                    <button
                      type="button"
                      key={plan}
                      onClick={() => togglePlanSelection(plan)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        segmentPlans.includes(plan)
                          ? 'border-purple-500 bg-purple-100 text-purple-700'
                          : 'border-gray-200 text-gray-600 hover:border-purple-400 hover:text-purple-600'
                      }`}
                    >
                      {plan}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-500">
                  Si dejas vacío, se incluirán usuarios de todos los planes.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Países</label>
                {segmentCountries.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {segmentCountries.map((code) => {
                      const country = COUNTRY_OPTIONS.find((item) => item.code === code)
                      return (
                        <span
                          key={code}
                          className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-xs text-purple-700"
                        >
                          {country ? `${country.name} (${country.code})` : code}
                          <button
                            type="button"
                            className="text-purple-600 hover:text-purple-800"
                            onClick={() => toggleCountrySelection(code)}
                          >
                            ×
                          </button>
                        </span>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Todos los países (sin filtro)</p>
                )}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCountryModal(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-purple-200 px-3 py-2 text-xs font-semibold text-purple-600 hover:border-purple-400 transition"
                  >
                    Seleccionar países
                  </button>
                  {segmentCountries.length > 0 && (
                    <button
                      type="button"
                      onClick={clearCountries}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Limpiar selección
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-gray-500">
                  Si no seleccionas países, se incluirán usuarios de cualquier país.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="inline-flex items-center gap-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    className="text-purple-600 focus:ring-purple-500"
                    checked={segmentRespectOptOut}
                    onChange={(e) => setSegmentRespectOptOut(e.target.checked)}
                  />
                  Respetar usuarios que desactivaron push (recomendado)
                </label>
                <label className="inline-flex items-center gap-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    className="text-purple-600 focus:ring-purple-500"
                    checked={segmentOnlyMarketing}
                    onChange={(e) => setSegmentOnlyMarketing(e.target.checked)}
                  />
                  Solo quienes aceptaron marketing
                </label>
                <label className="inline-flex items-center gap-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    className="text-purple-600 focus:ring-purple-500"
                    checked={segmentOnlyReminder}
                    onChange={(e) => setSegmentOnlyReminder(e.target.checked)}
                  />
                  Solo quienes aceptaron recordatorios
                </label>
                <label className="inline-flex items-center gap-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    className="text-purple-600 focus:ring-purple-500"
                    checked={segmentOnlyTransaction}
                    onChange={(e) => setSegmentOnlyTransaction(e.target.checked)}
                  />
                  Solo quienes aceptaron alertas de movimientos
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handlePreviewSegment}
                  disabled={previewLoading}
                  className="inline-flex items-center gap-2 rounded-xl border border-purple-200 px-3 py-2 text-xs font-semibold text-purple-600 hover:border-purple-400 transition disabled:opacity-50"
                >
                  {previewLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Calculando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Calcular destinatarios
                    </>
                  )}
                </button>
                {previewResult && (
                  <div className="rounded-full bg-purple-50 px-3 py-1 text-xs text-purple-700">
                    {previewResult.users} usuarios • {previewResult.tokens} tokens activos
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Título</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título de la notificación"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tipo</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 text-sm"
              >
                {TEMPLATE_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Mensaje</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Contenido de la notificación"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 text-sm"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {feedback && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {feedback}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Enviar notificación
              </>
            )}
          </button>
        </form>
      )}

      {/* Sección: Templates guardados - Fase 2: Mostrar solo si activeTab === 'templates' */}
      {/* Fase 3: Animación suave de entrada */}
      {activeTab === 'templates' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FilePlus2 className="h-5 w-5 text-purple-600" />
                  Templates guardados
                </h2>
                <p className="text-sm text-gray-500">
                  Crea, reutiliza y administra mensajes frecuentes.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {editingTemplate && (
                  <button
                    onClick={resetTemplateForm}
                    className="text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Cancelar edición
                  </button>
                )}
                <button
                  onClick={fetchTemplates}
                  className="text-sm font-medium text-purple-600 hover:text-purple-700"
                >
                  Actualizar
                </button>
              </div>
            </div>

            <form onSubmit={handleTemplateSubmit} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Nombre *</label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Promo semanal"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Tipo</label>
                  <select
                    value={templateForm.type}
                    onChange={(e) => setTemplateForm((prev) => ({ ...prev, type: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  >
                    {TEMPLATE_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Descripción</label>
                <input
                  type="text"
                  value={templateForm.description}
                  onChange={(e) =>
                    setTemplateForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Promoción por referidos, Semana 42"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Título *</label>
                <input
                  type="text"
                  value={templateForm.title}
                  onChange={(e) => setTemplateForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="¡Aprovecha tu beneficio!"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Mensaje *</label>
                <textarea
                  value={templateForm.body}
                  onChange={(e) => setTemplateForm((prev) => ({ ...prev, body: e.target.value }))}
                  rows={3}
                  placeholder="Hola {nombre}, tienes un recordatorio pendiente..."
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Datos (JSON)</label>
                  <textarea
                    value={templateForm.data}
                    onChange={(e) =>
                      setTemplateForm((prev) => ({ ...prev, data: e.target.value }))
                    }
                    rows={3}
                    placeholder='{"cta":"https://..."}'
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Tags</label>
                  <input
                    type="text"
                    value={templateForm.tags}
                    onChange={(e) =>
                      setTemplateForm((prev) => ({ ...prev, tags: e.target.value }))
                    }
                    placeholder="promoción, referidos"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  />
                  <p className="text-[11px] text-gray-500">
                    Separa los tags con coma para facilitar búsquedas futuras.
                  </p>
                </div>
              </div>

              {templateError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {templateError}
                </div>
              )}
              {templateFeedback && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {templateFeedback}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={templateSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90 transition disabled:opacity-50"
                >
                  {templateSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <FilePlus2 className="h-4 w-4" />
                      {editingTemplate ? 'Actualizar template' : 'Crear template'}
                    </>
                  )}
                </button>
                {editingTemplate && (
                  <button
                    type="button"
                    onClick={resetTemplateForm}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>

            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">Lista de templates</h3>
                {templatesLoading && (
                  <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                )}
              </div>
              {templates.length === 0 && !templatesLoading ? (
                <p className="mt-3 text-sm text-gray-500">
                  Aún no has creado templates. Guarda uno para reutilizarlo rápidamente.
                </p>
              ) : (
                <div className="mt-3 space-y-3 max-h-72 overflow-y-auto pr-1">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {template.name}{' '}
                            <span className="text-xs text-gray-500">
                              • {template.type}
                            </span>
                          </p>
                          {template.description && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {template.description}
                            </p>
                          )}
                          <p className="text-[11px] text-gray-400 mt-1">
                            Actualizado:{' '}
                            {new Date(template.updated_at).toLocaleString('es-ES')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApplyTemplate(template)}
                            className="text-xs font-semibold text-purple-600 hover:text-purple-700"
                          >
                            Usar
                          </button>
                          <button
                            onClick={() => handleEditTemplate(template)}
                            className="rounded-full border border-gray-200 p-1 text-gray-500 hover:text-gray-700 hover:border-gray-300 transition"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template)}
                            className="rounded-full border border-gray-200 p-1 text-red-500 hover:text-red-600 hover:border-red-200 transition"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sección: Historial reciente - Fase 2: Mostrar solo si activeTab === 'history' */}
      {/* Fase 3: Animación suave de entrada */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <div>
                <h2 className="text-lg font-semibold text-gray-900">Historial reciente</h2>
                <p className="text-sm text-gray-500">
                  Últimas 20 notificaciones enviadas manualmente o automáticas.
                </p>
              </div>
              <button
                onClick={fetchLogs}
                className="text-sm font-medium text-purple-600 hover:text-purple-700"
              >
                Actualizar
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Fecha</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Título</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Tipo</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Estado</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Destinatario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logsLoading ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-purple-500" />
                        Cargando historial...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                        Aún no hay registros.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-3 py-2 text-gray-600">
                          {log.sent_at
                            ? new Date(log.sent_at).toLocaleString('es-ES')
                            : '—'}
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-medium text-gray-900">{log.title}</div>
                          <div className="text-xs text-gray-500 truncate max-w-xs">{log.body}</div>
                        </td>
                        <td className="px-3 py-2 capitalize text-gray-600">{log.type}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                              log.status === 'delivered'
                                ? 'bg-green-100 text-green-700'
                                : log.status === 'failed'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {log.status}
                          </span>
                          {log.error_message && (
                            <div className="text-xs text-red-500 mt-1">
                              {log.error_message}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-gray-600">
                          {log.user_id ? log.user_id : 'Token directo'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
        </div>
      )}

      {showCountryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowCountryModal(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-purple-100">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Seleccionar países</h3>
                <p className="text-xs text-gray-500">
                  Marca los países que deseas incluir en el segmento.
                </p>
              </div>
              <button
                onClick={() => setShowCountryModal(false)}
                className="text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Cerrar
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <input
                  type="text"
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  placeholder="Buscar por nombre o código..."
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div className="max-h-80 overflow-y-auto rounded-2xl border border-gray-100">
                {filteredCountries.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-gray-500">
                    No se encontraron países para "{countrySearch}".
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {filteredCountries.map((country) => {
                      const selected = segmentCountries.includes(country.code)
                      return (
                        <li
                          key={country.code}
                          className="flex items-center justify-between px-4 py-3 text-sm"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{country.name}</p>
                            <p className="text-xs text-gray-500">{country.code}</p>
                          </div>
                          <label className="inline-flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                            <input
                              type="checkbox"
                              className="text-purple-600 focus:ring-purple-500"
                              checked={selected}
                              onChange={() => toggleCountrySelection(country.code)}
                            />
                            {selected ? 'Seleccionado' : 'Seleccionar'}
                          </label>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  clearCountries()
                  setCountrySearch('')
                }}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Limpiar todo
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {segmentCountries.length} seleccionados
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCountrySearch('')
                    setShowCountryModal(false)
                  }}
                  className="inline-flex items-center rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-xs font-semibold text-white shadow hover:opacity-90 transition"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

