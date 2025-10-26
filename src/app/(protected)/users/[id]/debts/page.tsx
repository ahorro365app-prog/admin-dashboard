'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface Debt {
  id: string
  usuario_id: string
  nombre: string
  monto_total: number
  monto_pagado: number
  fecha_vencimiento: string
  estado: string
  descripcion?: string
}

export default function UserDebtsPage() {
  const params = useParams()
  const userId = params.id as string
  
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (userId) {
      fetchDebts()
    }
  }, [userId])

  const fetchDebts = async () => {
    try {
      setLoading(true)
      console.log('💳 Fetching debts for user:', userId)
      
      const response = await fetch(`/api/users/${userId}/debts`)
      const data = await response.json()
      
      if (data.success) {
        console.log('💳 Debts loaded:', data.data.length)
        setDebts(data.data)
      } else {
        setError(data.message || 'Error cargando deudas')
      }
    } catch (error) {
      console.error('💥 Error fetching debts:', error)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getDebtStatus = (debt: Debt) => {
    const montoRestante = debt.monto_total - debt.monto_pagado
    const fechaVencimiento = new Date(debt.fecha_vencimiento)
    const hoy = new Date()
    
    if (montoRestante <= 0) {
      return { status: 'Pagada', color: 'bg-green-100 text-green-800' }
    } else if (fechaVencimiento < hoy) {
      return { status: 'Vencida', color: 'bg-red-100 text-red-800' }
    } else {
      return { status: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' }
    }
  }

  const getProgressPercentage = (debt: Debt) => {
    return Math.round((debt.monto_pagado / debt.monto_total) * 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando deudas...</p>
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
                  Deudas del Usuario
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Estado de deudas y pagos
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
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Stats */}
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Resumen de Deudas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{debts.length}</div>
                  <div className="text-sm text-gray-500">Total Deudas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {debts.filter(d => d.monto_total - d.monto_pagado <= 0).length}
                  </div>
                  <div className="text-sm text-gray-500">Pagadas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {debts.filter(d => {
                      const montoRestante = d.monto_total - d.monto_pagado
                      const fechaVencimiento = new Date(d.fecha_vencimiento)
                      const hoy = new Date()
                      return montoRestante > 0 && fechaVencimiento >= hoy
                    }).length}
                  </div>
                  <div className="text-sm text-gray-500">Pendientes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {debts.filter(d => {
                      const montoRestante = d.monto_total - d.monto_pagado
                      const fechaVencimiento = new Date(d.fecha_vencimiento)
                      const hoy = new Date()
                      return montoRestante > 0 && fechaVencimiento < hoy
                    }).length}
                  </div>
                  <div className="text-sm text-gray-500">Vencidas</div>
                </div>
              </div>
            </div>
          </div>

          {/* Debts List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Lista de Deudas ({debts.length})
              </h3>
            </div>

            {debts.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">💳</div>
                <p className="text-gray-500 text-lg">No hay deudas registradas</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {debts.map((debt) => {
                  const statusInfo = getDebtStatus(debt)
                  const progressPercentage = getProgressPercentage(debt)
                  const montoRestante = debt.monto_total - debt.monto_pagado
                  
                  return (
                    <div key={debt.id} className="px-6 py-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                              <span className="text-red-600 text-lg">💳</span>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">
                              {debt.nombre}
                            </h4>
                            <div className="text-sm text-gray-500">
                              Vence: {formatDate(debt.fecha_vencimiento)}
                            </div>
                            {debt.descripcion && (
                              <div className="text-sm text-gray-600 mt-1">
                                {debt.descripcion}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">
                            ${debt.monto_total.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            Restante: ${montoRestante.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progreso de pago</span>
                          <span>{progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Status and Actions */}
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                          {statusInfo.status}
                        </span>
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            📝 Registrar Pago
                          </button>
                          <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                            ✏️ Editar
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

