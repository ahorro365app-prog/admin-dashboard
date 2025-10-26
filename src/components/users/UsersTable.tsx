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
}

interface UsersTableProps {
  users: User[]
  loading?: boolean
  onEditUser: (user: User) => void
  onViewUser: (user: User) => void
  onToggleBlock: (user: User) => void
}

export function UsersTable({ users, loading = false, onEditUser, onViewUser, onToggleBlock }: UsersTableProps) {
  const [sortField, setSortField] = useState<keyof User>('nombre')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedUsers = [...users].sort((a, b) => {
    const aValue = a[sortField] || ''
    const bValue = b[sortField] || ''
    
    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })

  const getPlanBadge = (suscripcion?: string) => {
    if (suscripcion === 'premium') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          ⭐ Premium
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        📱 Free
      </span>
    )
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


