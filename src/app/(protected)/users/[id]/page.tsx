'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { BlockUserModal } from '@/components/users/BlockUserModal'

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

interface UserStats {
  totalTransactions: number
  totalDebts: number
  lastActivity: string
  joinDate: string
}

export default function UserDetailsPage() {
  const params = useParams()
  const userId = params.id as string
  
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Estados para modales
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false)
  const [blockingUser, setBlockingUser] = useState(false)

  useEffect(() => {
    if (userId) {
      fetchUserDetails()
    }
  }, [userId])

  const fetchUserDetails = async () => {
    try {
      setLoading(true)
      console.log('👤 Fetching user details for:', userId)
      
      // Obtener datos del usuario directamente por ID
      const userResponse = await fetch(`/api/users/${userId}`)
      const userData = await userResponse.json()
      
      if (userData.success) {
        setUser(userData.data)
        
        // Obtener estadísticas del usuario
        await fetchUserStats(userData.data.id)
      } else {
        setError(userData.message || 'Usuario no encontrado')
      }
    } catch (error) {
      console.error('💥 Error fetching user details:', error)
      setError('Error cargando detalles del usuario')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserStats = async (userId: string) => {
    try {
      console.log('📊 Fetching user stats for:', userId)
      
      // Obtener transacciones del usuario
      const transactionsResponse = await fetch(`/api/users/${userId}/transactions`)
      const transactionsData = await transactionsResponse.json()
      
      // Obtener deudas del usuario
      const debtsResponse = await fetch(`/api/users/${userId}/debts`)
      const debtsData = await debtsResponse.json()
      
      setStats({
        totalTransactions: transactionsData.success ? transactionsData.data.length : 0,
        totalDebts: debtsData.success ? debtsData.data.length : 0,
        lastActivity: new Date().toISOString(),
        joinDate: new Date().toISOString() // Simulado por ahora
      })
    } catch (error) {
      console.error('Error fetching user stats:', error)
      // Usar valores por defecto si hay error
      setStats({
        totalTransactions: 0,
        totalDebts: 0,
        lastActivity: new Date().toISOString(),
        joinDate: new Date().toISOString()
      })
    }
  }

  const getCountryFlag = (pais?: string) => {
    const flags: Record<string, string> = {
      'BO': '🇧🇴',
      'PE': '🇵🇪',
      'AR': '🇦🇷',
      'BR': '🇧🇷',
      'CL': '🇨🇱',
      'CO': '🇨🇴',
      'EC': '🇪🇨',
      'PY': '🇵🇾',
      'UY': '🇺🇾',
      'VE': '🇻🇪',
      'MX': '🇲🇽',
      'US': '🇺🇸',
      'EU': '🇪🇺'
    }
    return flags[pais || ''] || '🌍'
  }

  const getPlanBadge = (suscripcion?: string) => {
    if (suscripcion === 'premium') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
          ⭐ Premium
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
        📱 Free
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando detalles del usuario...</p>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error || 'Usuario no encontrado'}</p>
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

  const handleBlockUser = async () => {
    if (!user) return
    setIsBlockModalOpen(true)
  }

  const handleConfirmBlock = async (userId: string) => {
    try {
      setBlockingUser(true)
      console.log('🚫 Blocking/unblocking user:', userId)
      
      // Aquí implementarías la lógica real de bloqueo
      // Por ahora simulamos una operación
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      alert('Usuario bloqueado/desbloqueado exitosamente')
      
    } catch (error) {
      console.error('Error blocking user:', error)
      alert('Error al bloquear usuario')
    } finally {
      setBlockingUser(false)
    }
  }

  const handleCloseBlockModal = () => {
    setIsBlockModalOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = '/users'}
                className="text-gray-400 hover:text-gray-600"
              >
                ←
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Detalles del Usuario
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Información completa y estadísticas
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.location.href = `/users/${user.id}/edit`}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                ✏️ Editar Usuario
              </button>
              <button
                onClick={() => window.location.href = '/users'}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                ← Volver a Usuarios
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* User Profile Card */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-6 py-8">
              <div className="flex items-center space-x-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-2xl">
                      {user.nombre.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                
                {/* User Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {user.nombre}
                    </h2>
                    {getPlanBadge(user.suscripcion)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">📧 Email:</span> {user.correo || 'No especificado'}
                    </div>
                    <div>
                      <span className="font-medium">📱 Teléfono:</span> {user.telefono || 'No especificado'}
                    </div>
                    <div>
                      <span className="font-medium">🌍 País:</span> {getCountryFlag(user.pais)} {user.pais || 'No especificado'}
                    </div>
                    <div>
                      <span className="font-medium">💰 Moneda:</span> {user.moneda || 'No especificada'}
                    </div>
                    <div>
                      <span className="font-medium">💵 Presupuesto Diario:</span> 
                      {user.presupuesto_diario ? ` $${user.presupuesto_diario.toLocaleString()} ${user.moneda || ''}` : ' No establecido'}
                    </div>
                    <div>
                      <span className="font-medium">🆔 ID:</span> {user.id}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">📊</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Transacciones</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalTransactions}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">💳</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Deudas</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalDebts}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">📅</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Última Actividad</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(stats.lastActivity).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">🎉</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Fecha de Registro</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(stats.joinDate).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Acciones Rápidas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button 
                onClick={() => window.location.href = `/users/${user.id}/transactions`}
                className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg text-left transition-colors"
              >
                <div className="flex items-center">
                  <span className="text-blue-600 text-lg mr-3">📊</span>
                  <div>
                    <p className="font-medium text-gray-900">Ver Transacciones</p>
                    <p className="text-sm text-gray-500">Historial completo</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => window.location.href = `/users/${user.id}/debts`}
                className="bg-red-50 hover:bg-red-100 p-4 rounded-lg text-left transition-colors"
              >
                <div className="flex items-center">
                  <span className="text-red-600 text-lg mr-3">💳</span>
                  <div>
                    <p className="font-medium text-gray-900">Ver Deudas</p>
                    <p className="text-sm text-gray-500">Estado de deudas</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => window.location.href = `/users/${user.id}/edit`}
                className="bg-green-50 hover:bg-green-100 p-4 rounded-lg text-left transition-colors"
              >
                <div className="flex items-center">
                  <span className="text-green-600 text-lg mr-3">✏️</span>
                  <div>
                    <p className="font-medium text-gray-900">Editar Usuario</p>
                    <p className="text-sm text-gray-500">Modificar datos</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={handleBlockUser}
                className="bg-yellow-50 hover:bg-yellow-100 p-4 rounded-lg text-left transition-colors"
              >
                <div className="flex items-center">
                  <span className="text-yellow-600 text-lg mr-3">🚫</span>
                  <div>
                    <p className="font-medium text-gray-900">Bloquear Usuario</p>
                    <p className="text-sm text-gray-500">Suspender acceso</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Block User Modal */}
      <BlockUserModal
        user={user}
        isOpen={isBlockModalOpen}
        onClose={handleCloseBlockModal}
        onConfirm={handleConfirmBlock}
        loading={blockingUser}
      />
    </div>
  )
}
