'use client'

import { useState, useEffect } from 'react'

interface User {
  id: string
  nombre: string
  correo?: string
  telefono?: string
  pais?: string
  moneda?: string
  presupuesto_diario?: number
  suscripcion?: string
  fecha_expiracion_suscripcion?: string | null
}

interface EditUserModalProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  onSave: (userData: Partial<User>) => Promise<void>
  loading?: boolean
}

type SubscriptionPlan = 'free' | 'smart' | 'pro' | 'caducado'

export function EditUserModal({ user, isOpen, onClose, onSave, loading = false }: EditUserModalProps) {
  const [formData, setFormData] = useState<Partial<User>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const formatDateForInput = (isoDate?: string | null) => {
    if (!isoDate) return ''
    try {
      const parsed = new Date(isoDate)
      if (Number.isNaN(parsed.getTime())) return ''
      return parsed.toISOString().split('T')[0]
    } catch (error) {
      console.error('Error formatting ISO date:', error)
      return ''
    }
  }

  const getRecommendedExpiration = (plan: SubscriptionPlan) => {
    const daysToAdd = plan === 'pro' ? 30 : 14
    const baseDate = new Date()
    baseDate.setHours(0, 0, 0, 0)
    baseDate.setDate(baseDate.getDate() + daysToAdd)
    return baseDate.toISOString().split('T')[0]
  }

  const requiresExpiration = (plan?: SubscriptionPlan) => {
    return plan !== 'caducado'
  }

  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre,
        correo: user.correo || '',
        telefono: user.telefono || '',
        pais: user.pais || '',
        moneda: user.moneda || '',
        presupuesto_diario: user.presupuesto_diario ?? undefined,
        suscripcion: (user.suscripcion as SubscriptionPlan) || 'free',
        fecha_expiracion_suscripcion: formatDateForInput(user.fecha_expiracion_suscripcion)
      })
    }
  }, [user])

  const handleInputChange = (field: keyof User, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handlePlanChange = (plan: SubscriptionPlan) => {
    setFormData(prev => {
      const next: Partial<User> = {
        ...prev,
        suscripcion: plan
      }

      if (!requiresExpiration(plan)) {
        next.fecha_expiracion_suscripcion = ''
      } else if (!prev.fecha_expiracion_suscripcion) {
        next.fecha_expiracion_suscripcion = getRecommendedExpiration(plan)
      }

      return next
    })

    if (errors.suscripcion) {
      setErrors(prev => ({ ...prev, suscripcion: '' }))
    }
    if (errors.fecha_expiracion_suscripcion) {
      setErrors(prev => ({ ...prev, fecha_expiracion_suscripcion: '' }))
    }
  }

  const handleExpirationChange = (value: string) => {
    setFormData(prev => ({ ...prev, fecha_expiracion_suscripcion: value }))
    if (errors.fecha_expiracion_suscripcion) {
      setErrors(prev => ({ ...prev, fecha_expiracion_suscripcion: '' }))
    }
  }

  const handleSetRecommendedExpiration = () => {
    const currentPlan = (formData.suscripcion as SubscriptionPlan) || 'free'
    if (!requiresExpiration(currentPlan)) {
      return
    }

    const recommendedDate = getRecommendedExpiration(currentPlan)
    setFormData(prev => ({ ...prev, fecha_expiracion_suscripcion: recommendedDate }))
    if (errors.fecha_expiracion_suscripcion) {
      setErrors(prev => ({ ...prev, fecha_expiracion_suscripcion: '' }))
    }
  }

  const currentPlan = (formData.suscripcion as SubscriptionPlan) || 'free'
  const showExpirationInput = requiresExpiration(currentPlan)
  const recommendedDaysLabel = currentPlan === 'pro' ? '30 días' : '14 días'

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    const selectedPlan = (formData.suscripcion as SubscriptionPlan) || 'free'

    if (!formData.nombre?.trim()) {
      newErrors.nombre = 'El nombre es requerido'
    }

    if (formData.correo && !/\S+@\S+\.\S+/.test(formData.correo)) {
      newErrors.correo = 'El email no es válido'
    }

    if (
      formData.presupuesto_diario !== undefined &&
      formData.presupuesto_diario !== null &&
      formData.presupuesto_diario <= 0
    ) {
      newErrors.presupuesto_diario = 'El presupuesto debe ser mayor a 0'
    }

    if (requiresExpiration(selectedPlan)) {
      if (!formData.fecha_expiracion_suscripcion) {
        newErrors.fecha_expiracion_suscripcion = 'Debes definir una fecha de expiración para este plan'
      } else {
        const selectedDate = new Date(formData.fecha_expiracion_suscripcion)
        selectedDate.setHours(0, 0, 0, 0)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (Number.isNaN(selectedDate.getTime())) {
          newErrors.fecha_expiracion_suscripcion = 'Fecha de expiración inválida'
        } else if (selectedDate < today) {
          newErrors.fecha_expiracion_suscripcion = 'La fecha de expiración no puede ser en el pasado'
        }
      }
    } else if (formData.fecha_expiracion_suscripcion) {
      newErrors.fecha_expiracion_suscripcion = 'El plan caducado no debe tener fecha de expiración'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Error saving user:', error)
    }
  }

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              ✏️ Editar Usuario
            </h3>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              ✕
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={formData.nombre || ''}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                disabled={loading}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.nombre ? 'border-red-500' : 'border-gray-300'
                } disabled:opacity-50`}
                placeholder="Nombre completo"
              />
              {errors.nombre && (
                <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.correo || ''}
                onChange={(e) => handleInputChange('correo', e.target.value)}
                disabled={loading}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.correo ? 'border-red-500' : 'border-gray-300'
                } disabled:opacity-50`}
                placeholder="usuario@ejemplo.com"
              />
              {errors.correo && (
                <p className="mt-1 text-sm text-red-600">{errors.correo}</p>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.telefono || ''}
                onChange={(e) => handleInputChange('telefono', e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                placeholder="+591 12345678"
              />
            </div>

            {/* País */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                País
              </label>
              <select
                value={formData.pais || ''}
                onChange={(e) => handleInputChange('pais', e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">Seleccionar país</option>
                <option value="BO">🇧🇴 Bolivia</option>
                <option value="PE">🇵🇪 Perú</option>
                <option value="AR">🇦🇷 Argentina</option>
                <option value="BR">🇧🇷 Brasil</option>
                <option value="CL">🇨🇱 Chile</option>
                <option value="CO">🇨🇴 Colombia</option>
                <option value="EC">🇪🇨 Ecuador</option>
                <option value="PY">🇵🇾 Paraguay</option>
                <option value="UY">🇺🇾 Uruguay</option>
                <option value="VE">🇻🇪 Venezuela</option>
                <option value="MX">🇲🇽 México</option>
                <option value="US">🇺🇸 Estados Unidos</option>
                <option value="EU">🇪🇺 Europa</option>
              </select>
            </div>

            {/* Moneda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Moneda
              </label>
              <select
                value={formData.moneda || ''}
                onChange={(e) => handleInputChange('moneda', e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">Seleccionar moneda</option>
                <option value="BOB">BOB - Boliviano</option>
                <option value="PEN">PEN - Sol Peruano</option>
                <option value="ARS">ARS - Peso Argentino</option>
                <option value="BRL">BRL - Real Brasileño</option>
                <option value="CLP">CLP - Peso Chileno</option>
                <option value="COP">COP - Peso Colombiano</option>
                <option value="USD">USD - Dólar Americano</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>

            {/* Presupuesto Diario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Presupuesto Diario
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  formData.presupuesto_diario !== undefined &&
                  formData.presupuesto_diario !== null
                    ? formData.presupuesto_diario
                    : ''
                }
                onChange={(e) => {
                  const value = e.target.value
                  if (value === '') {
                    handleInputChange('presupuesto_diario', undefined)
                    return
                  }
                  const parsed = parseFloat(value)
                  if (Number.isNaN(parsed)) {
                    handleInputChange('presupuesto_diario', undefined)
                  } else {
                    handleInputChange('presupuesto_diario', parsed)
                  }
                }}
                disabled={loading}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.presupuesto_diario ? 'border-red-500' : 'border-gray-300'
                } disabled:opacity-50`}
                placeholder="0.00"
              />
              {errors.presupuesto_diario && (
                <p className="mt-1 text-sm text-red-600">{errors.presupuesto_diario}</p>
              )}
            </div>

            {/* Suscripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Suscripción
              </label>
              <select
                value={currentPlan}
                onChange={(e) => handlePlanChange(e.target.value as SubscriptionPlan)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="free">📱 Free (14 días)</option>
                <option value="smart">✨ Smart (14 días)</option>
                <option value="pro">💎 Pro (30 días)</option>
                <option value="caducado">⏰ Caducado</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Ajusta el plan del usuario. Recuerda confirmar la fecha de expiración.
              </p>
            </div>

            {/* Fecha de expiración */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de expiración
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={formData.fecha_expiracion_suscripcion || ''}
                  onChange={(e) => handleExpirationChange(e.target.value)}
                  disabled={!showExpirationInput || loading}
                  className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.fecha_expiracion_suscripcion ? 'border-red-500' : 'border-gray-300'
                  } disabled:opacity-50`}
                />
                {showExpirationInput && (
                  <button
                    type="button"
                    onClick={handleSetRecommendedExpiration}
                    disabled={loading}
                    className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
                  >
                    Sugerir +{currentPlan === 'pro' ? 30 : 14} días
                  </button>
                )}
              </div>
              {showExpirationInput ? (
                <p className="text-xs text-gray-500 mt-1">
                  Recomendado: {recommendedDaysLabel} desde hoy. Puedes personalizar la fecha si es necesario.
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  El plan caducado no maneja fecha de expiración.
                </p>
              )}
              {errors.fecha_expiracion_suscripcion && (
                <p className="mt-1 text-sm text-red-600">{errors.fecha_expiracion_suscripcion}</p>
              )}
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : '💾 Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}






