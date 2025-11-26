'use client'

import { useState } from 'react'

interface User {
  id: string
  nombre: string
  correo?: string
  telefono?: string
  pais?: string
  moneda?: string
  presupuesto_diario?: number
  suscripcion?: string
  whatsapp_verificado?: boolean
  fecha_expiracion_suscripcion?: string | null
  daysToExpire?: number | null
}

interface UsersTableProps {
  users: User[]
  loading?: boolean
  onEditUser: (user: User) => void
  onViewUser: (user: User) => void
  onToggleBlock: (user: User) => void
}

type SortField = 'nombre' | 'suscripcion' | 'pais' | 'presupuesto_diario' | 'daysToExpire'

export function UsersTable({ users, loading = false, onEditUser, onViewUser, onToggleBlock }: UsersTableProps) {
  const [sortField, setSortField] = useState<SortField>('nombre')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const compareStringsAsc = (a?: string | null, b?: string | null) => {
    const aValue = (a || '').toString().toLowerCase()
    const bValue = (b || '').toString().toLowerCase()
    if (aValue === bValue) return 0
    return aValue < bValue ? -1 : 1
  }

  const compareNumbersAsc = (a?: number | null, b?: number | null) => {
    const aDefined = typeof a === 'number'
    const bDefined = typeof b === 'number'

    if (!aDefined && !bDefined) return 0
    if (!aDefined) return 1
    if (!bDefined) return -1

    if (a === b) return 0
    return (a as number) < (b as number) ? -1 : 1
  }

  const sortedUsers = [...users].sort((a, b) => {
    let comparison = 0

    const isAsc = sortDirection === 'asc'

    switch (sortField) {
      case 'presupuesto_diario':
        comparison = isAsc
          ? compareNumbersAsc(a.presupuesto_diario, b.presupuesto_diario)
          : compareNumbersAsc(b.presupuesto_diario, a.presupuesto_diario)
        break
      case 'daysToExpire':
        comparison = isAsc
          ? compareNumbersAsc(a.daysToExpire ?? null, b.daysToExpire ?? null)
          : compareNumbersAsc(b.daysToExpire ?? null, a.daysToExpire ?? null)
        break
      case 'pais':
        comparison = isAsc
          ? compareStringsAsc(a.pais, b.pais)
          : compareStringsAsc(b.pais, a.pais)
        break
      case 'suscripcion':
        comparison = isAsc
          ? compareStringsAsc(a.suscripcion, b.suscripcion)
          : compareStringsAsc(b.suscripcion, a.suscripcion)
        break
      case 'nombre':
      default:
        comparison = isAsc
          ? compareStringsAsc(a.nombre, b.nombre)
          : compareStringsAsc(b.nombre, a.nombre)
        break
    }

    return comparison
  })

  const getPlanBadge = (suscripcion?: string) => {
    if (suscripcion === 'pro') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          💎 Pro
        </span>
      )
    }
    if (suscripcion === 'smart') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          ✨ Smart
        </span>
      )
    }
    if (suscripcion === 'caducado') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
          ⏰ Caducado
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        📱 Free
      </span>
    )
  }

  const getWhatsAppBadge = (verificado?: boolean) => {
    if (verificado) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ✓ WhatsApp Verificado
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
        ⚠️ No verificado
      </span>
    )
  }

  const getExpirationBadge = (days?: number | null) => {
    if (days === null || days === undefined) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
          Sin fecha
        </span>
      )
    }

    if (days < 0) {
      const daysAgo = Math.abs(days)
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
          Expirado hace {daysAgo} día{daysAgo === 1 ? '' : 's'}
        </span>
      )
    }

    if (days === 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
          Expira hoy
        </span>
      )
    }

    if (days <= 7) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
          {days} día{days === 1 ? '' : 's'}
        </span>
      )
    }

    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
        {days} día{days === 1 ? '' : 's'}
      </span>
    )
  }

  const formatExpirationDate = (date?: string | null) => {
    if (!date) return null
    try {
      const localeDate = new Date(date)
      return localeDate.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    } catch (error) {
      console.error('Error formatting expiration date:', error)
      return null
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

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-48"></div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Lista de Usuarios ({users.length})
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('nombre')}
              >
                <div className="flex items-center space-x-1">
                  <span>Usuario</span>
                  {sortField === 'nombre' && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('suscripcion')}
              >
                <div className="flex items-center space-x-1">
                  <span>Plan</span>
                  {sortField === 'suscripcion' && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('pais')}
              >
                <div className="flex items-center space-x-1">
                  <span>País</span>
                  {sortField === 'pais' && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('presupuesto_diario')}
              >
                <div className="flex items-center space-x-1">
                  <span>Presupuesto</span>
                  {sortField === 'presupuesto_diario' && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('daysToExpire')}
              >
                <div className="flex items-center space-x-1">
                  <span>Días por vencer</span>
                  {sortField === 'daysToExpire' && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                WhatsApp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {user.nombre.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.nombre}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.correo || user.telefono || 'Sin contacto'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getPlanBadge(user.suscripcion)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getCountryFlag(user.pais)}</span>
                    <span className="text-sm text-gray-900">
                      {user.pais || 'N/A'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.presupuesto_diario ? (
                    <span className="font-medium">
                      ${user.presupuesto_diario.toLocaleString()} {user.moneda || ''}
                    </span>
                  ) : (
                    <span className="text-gray-400">No establecido</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex flex-col">
                    {getExpirationBadge(user.daysToExpire)}
                    {user.fecha_expiracion_suscripcion && (
                      <span className="text-xs text-gray-500 mt-1">
                        {formatExpirationDate(user.fecha_expiracion_suscripcion)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getWhatsAppBadge(user.whatsapp_verificado)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onViewUser(user)}
                      className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors"
                    >
                      👁️ Ver
                    </button>
                    <button
                      onClick={() => onEditUser(user)}
                      className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md transition-colors"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => onToggleBlock(user)}
                      className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors"
                    >
                      🚫 Bloquear
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">👥</div>
          <p className="text-gray-500 text-lg">No se encontraron usuarios</p>
          <p className="text-gray-400 text-sm mt-2">
            Intenta ajustar los filtros de búsqueda
          </p>
        </div>
      )}
    </div>
  )
}






