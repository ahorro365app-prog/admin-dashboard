'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface User {
  id: string
  nombre: string
  correo?: string
  telefono?: string
  pais?: string
  moneda?: string
  presupuesto_diario?: number
  suscripcion?: string
}

export default function EditUserPage() {
  const params = useParams()
  const userId = params.id as string
  
  const [user, setUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<Partial<User>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (userId) {
      fetchUser()
    }
  }, [userId])

  const fetchUser = async () => {
    try {
      setLoading(true)
      console.log('👤 Fetching user for edit:', userId)
      
      const response = await fetch(`/api/users/${userId}`)
      const data = await response.json()
      
      if (data.success) {
        setUser(data.data)
        setFormData({
          nombre: data.data.nombre,
          correo: data.data.correo || '',
          telefono: data.data.telefono || '',
          pais: data.data.pais || '',
          moneda: data.data.moneda || '',
          presupuesto_diario: data.data.presupuesto_diario || 0,
          suscripcion: data.data.suscripcion || 'free'
        })
      } else {
        setError(data.message || 'Usuario no encontrado')
      }
    } catch (error) {
      console.error('💥 Error fetching user:', error)
      setError('Error cargando datos del usuario')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof User, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return

    try {
      setSaving(true)
      setError('')
      setSuccess('')
      
      console.log('💾 Saving user:', userId, formData)

      const response = await fetch('/api/users/crud', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: userId,
          ...formData
        })
      })

      const data = await response.json()

      if (data.success) {
        console.log('✅ User saved successfully')
        setSuccess('Usuario actualizado exitosamente')
        // Actualizar los datos del usuario
        setUser(data.data)
      } else {
        throw new Error(data.message)
      }
    } catch (error: any) {
      console.error('💥 Error saving user:', error)
      setError('Error al guardar usuario: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos del usuario...</p>
        </div>
      </div>
    )
  }

  if (error && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/users'}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Volver a Usuarios
          </button>
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
                onClick={() => window.location.href = `/users/${userId}`}
                className="text-gray-400 hover:text-gray-600"
              >
                ←
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Editar Usuario
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Modificar información del usuario
                </p>
              </div>
            </div>
            <button
              onClick={() => window.location.href = `/users/${userId}`}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Volver a Detalles
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
              {success}
            </div>
          )}

          {/* Edit Form */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Información del Usuario
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre || ''}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  required
                  disabled={saving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  placeholder="Nombre completo"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.correo || ''}
                  onChange={(e) => handleInputChange('correo', e.target.value)}
                  disabled={saving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  placeholder="usuario@ejemplo.com"
                />
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.telefono || ''}
                  onChange={(e) => handleInputChange('telefono', e.target.value)}
                  disabled={saving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  placeholder="+591 12345678"
                />
              </div>

              {/* País */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  País
                </label>
                <select
                  value={formData.pais || ''}
                  onChange={(e) => handleInputChange('pais', e.target.value)}
                  disabled={saving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Moneda
                </label>
                <select
                  value={formData.moneda || ''}
                  onChange={(e) => handleInputChange('moneda', e.target.value)}
                  disabled={saving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Presupuesto Diario
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.presupuesto_diario || ''}
                  onChange={(e) => handleInputChange('presupuesto_diario', parseFloat(e.target.value) || 0)}
                  disabled={saving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  placeholder="0.00"
                />
              </div>

              {/* Suscripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Suscripción
                </label>
                <select
                  value={formData.suscripcion || 'free'}
                  onChange={(e) => handleInputChange('suscripcion', e.target.value)}
                  disabled={saving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                >
                  <option value="free">📱 Free</option>
                  <option value="premium">⭐ Premium</option>
                </select>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => window.location.href = `/users/${userId}`}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : '💾 Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}


