'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Clock, Eye, RefreshCw } from 'lucide-react'

interface Payment {
  id: string
  usuario_id: string
  plan: string
  monto_usdt: number
  direccion_wallet?: string
  hash_transaccion?: string
  comprobante_url?: string
  estado: 'pendiente' | 'verificado' | 'rechazado' | 'expirado'
  verificador_id?: string
  fecha_pago: string
  fecha_verificacion?: string
  notas?: string
  usuario?: {
    nombre: string
    correo?: string
    telefono?: string
  }
}

interface PaymentStats {
  pendientes: number
  verificados: number
  rechazados: number
  total: number
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<PaymentStats>({
    pendientes: 0,
    verificados: 0,
    rechazados: 0,
    total: 0
  })
  const [filter, setFilter] = useState<'all' | 'pendiente' | 'verificado' | 'rechazado'>('all')
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetchPayments()
  }, [filter])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter !== 'all') {
        params.append('estado', filter)
      }

      const response = await fetch(`/api/payments?${params}`)
      const data = await response.json()

      if (data.success) {
        setPayments(data.data || [])
        setStats(data.stats || stats)
      } else {
        setError(data.message || 'Error cargando pagos')
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyPayment = async (paymentId: string) => {
    if (!confirm('¿Estás seguro de verificar este pago? Se activará el plan Pro para el usuario.')) {
      return
    }

    setProcessing(paymentId)
    try {
      const response = await fetch(`/api/payments/${paymentId}/verify`, {
        method: 'POST'
      })
      const data = await response.json()

      if (data.success) {
        await fetchPayments()
        alert('✅ Pago verificado exitosamente. Plan Pro activado.')
      } else {
        alert(`❌ Error: ${data.message || 'Error al verificar pago'}`)
      }
    } catch (error) {
      console.error('Error verifying payment:', error)
      alert('Error de conexión')
    } finally {
      setProcessing(null)
    }
  }

  const handleRejectPayment = async (paymentId: string) => {
    const reason = prompt('Ingresa el motivo del rechazo:')
    if (!reason || !reason.trim()) {
      return
    }

    setProcessing(paymentId)
    try {
      const response = await fetch(`/api/payments/${paymentId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notas: reason })
      })
      const data = await response.json()

      if (data.success) {
        await fetchPayments()
        alert('✅ Pago rechazado exitosamente.')
      } else {
        alert(`❌ Error: ${data.message || 'Error al rechazar pago'}`)
      }
    } catch (error) {
      console.error('Error rejecting payment:', error)
      alert('Error de conexión')
    } finally {
      setProcessing(null)
    }
  }

  const getStatusBadge = (estado: string) => {
    const badges = {
      pendiente: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock size={12} className="mr-1" />
          Pendiente
        </span>
      ),
      verificado: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle size={12} className="mr-1" />
          Verificado
        </span>
      ),
      rechazado: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle size={12} className="mr-1" />
          Rechazado
        </span>
      ),
      expirado: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <Clock size={12} className="mr-1" />
          Expirado
        </span>
      )
    }
    return badges[estado as keyof typeof badges] || badges.pendiente
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Pagos</h1>
          <p className="text-gray-600">Verifica y gestiona los pagos de suscripciones Pro</p>
        </div>
        <Button
          onClick={fetchPayments}
          disabled={loading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Pagos</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pendientes</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">{stats.pendientes}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Verificados</CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.verificados}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Rechazados</CardDescription>
            <CardTitle className="text-2xl text-red-600">{stats.rechazados}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              Todos
            </Button>
            <Button
              variant={filter === 'pendiente' ? 'default' : 'outline'}
              onClick={() => setFilter('pendiente')}
            >
              Pendientes
            </Button>
            <Button
              variant={filter === 'verificado' ? 'default' : 'outline'}
              onClick={() => setFilter('verificado')}
            >
              Verificados
            </Button>
            <Button
              variant={filter === 'rechazado' ? 'default' : 'outline'}
              onClick={() => setFilter('rechazado')}
            >
              Rechazados
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Pagos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pagos</CardTitle>
          <CardDescription>
            {filter === 'all' ? 'Todos los pagos' : `Pagos ${filter}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw size={24} className="animate-spin mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">Cargando pagos...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <p>{error}</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No hay pagos {filter !== 'all' ? `con estado ${filter}` : ''}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Usuario</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Plan</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Monto</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Fecha</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Estado</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Comprobante</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {payment.usuario?.nombre || 'Sin nombre'}
                          </p>
                          {payment.usuario?.telefono && (
                            <p className="text-xs text-gray-500">{payment.usuario.telefono}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                          {payment.plan.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-900">${payment.monto_usdt} USDT</p>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(payment.fecha_pago)}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(payment.estado)}
                      </td>
                      <td className="py-3 px-4">
                        {payment.comprobante_url ? (
                          <a
                            href={payment.comprobante_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                          >
                            <Eye size={14} />
                            Ver
                          </a>
                        ) : (
                          <span className="text-gray-400 text-sm">Sin comprobante</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {payment.estado === 'pendiente' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleVerifyPayment(payment.id)}
                                disabled={processing === payment.id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle size={14} className="mr-1" />
                                Verificar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectPayment(payment.id)}
                                disabled={processing === payment.id}
                              >
                                <XCircle size={14} className="mr-1" />
                                Rechazar
                              </Button>
                            </>
                          )}
                          {payment.estado === 'verificado' && payment.fecha_verificacion && (
                            <span className="text-xs text-gray-500">
                              Verificado: {formatDate(payment.fecha_verificacion)}
                            </span>
                          )}
                          {payment.estado === 'rechazado' && payment.notas && (
                            <span className="text-xs text-red-600" title={payment.notas}>
                              {payment.notas.length > 30 ? `${payment.notas.substring(0, 30)}...` : payment.notas}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

