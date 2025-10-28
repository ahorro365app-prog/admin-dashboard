'use client'

import React, { memo, useMemo } from 'react'
import { ResponsiveTable, ResponsiveButton } from '@/components/common/Responsive'
import { Loading } from '@/components/common/Loading'

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

interface OptimizedUsersTableProps {
  users: User[]
  loading: boolean
  onEditUser: (user: User) => void
  onDeleteUser: (userId: string) => void
  sortKey?: keyof User
  sortDirection?: 'asc' | 'desc'
  onSort: (key: keyof User) => void
}

// Componente memoizado para filas de usuario
const UserRow = memo(({ 
  user, 
  onEditUser, 
  onDeleteUser 
}: { 
  user: User
  onEditUser: (user: User) => void
  onDeleteUser: (userId: string) => void
}) => {
  const getPlanBadge = (suscripcion?: string) => {
    if (suscripcion === 'premium') {
      return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Premium</span>
    }
    return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">Free</span>
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

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-medium">
            {user.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{user.nombre}</div>
            <div className="text-sm text-gray-500">{user.correo || user.telefono || 'Sin contacto'}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <span className="text-lg mr-2">{getCountryFlag(user.pais)}</span>
          <span className="text-sm text-gray-900">{user.pais || 'N/A'}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {getPlanBadge(user.suscripcion)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {user.presupuesto_diario ? `${user.presupuesto_diario} ${user.moneda || ''}` : 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center space-x-2">
          <ResponsiveButton
            variant="secondary"
            size="sm"
            onClick={() => onEditUser(user)}
            className="text-xs"
          >
            ✏️ Editar
          </ResponsiveButton>
          <ResponsiveButton
            variant="danger"
            size="sm"
            onClick={() => onDeleteUser(user.id)}
            className="text-xs"
          >
            🗑️ Eliminar
          </ResponsiveButton>
          <ResponsiveButton
            variant="primary"
            size="sm"
            onClick={() => window.location.href = `/users/${user.id}`}
            className="text-xs"
          >
            👁️ Ver
          </ResponsiveButton>
        </div>
      </td>
    </tr>
  )
})

UserRow.displayName = 'UserRow'

// Componente memoizado para header de tabla
const TableHeader = memo(({ 
  sortKey, 
  sortDirection, 
  onSort 
}: { 
  sortKey?: keyof User
  sortDirection?: 'asc' | 'desc'
  onSort: (key: keyof User) => void
}) => {
  const getSortIcon = (key: keyof User) => {
    if (sortKey !== key) return '↕️'
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  const handleSort = (key: keyof User) => {
    onSort(key)
  }

  return (
    <thead className="bg-gray-50">
      <tr>
        <th 
          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
          onClick={() => handleSort('nombre')}
        >
          <div className="flex items-center space-x-1">
            <span>Usuario</span>
            <span className="text-xs">{getSortIcon('nombre')}</span>
          </div>
        </th>
        <th 
          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
          onClick={() => handleSort('pais')}
        >
          <div className="flex items-center space-x-1">
            <span>País</span>
            <span className="text-xs">{getSortIcon('pais')}</span>
          </div>
        </th>
        <th 
          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
          onClick={() => handleSort('suscripcion')}
        >
          <div className="flex items-center space-x-1">
            <span>Plan</span>
            <span className="text-xs">{getSortIcon('suscripcion')}</span>
          </div>
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Presupuesto
        </th>
        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
          Acciones
        </th>
      </tr>
    </thead>
  )
})

TableHeader.displayName = 'TableHeader'

export function OptimizedUsersTable({
  users,
  loading,
  onEditUser,
  onDeleteUser,
  sortKey,
  sortDirection,
  onSort
}: OptimizedUsersTableProps) {
  // Memoizar la lista de usuarios para evitar re-renders innecesarios
  const memoizedUsers = useMemo(() => users, [users])

  if (loading && users.length === 0) {
    return (
      <div className="p-6">
        <Loading type="skeleton" size="lg" text="Cargando usuarios..." />
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-4xl mb-4">👥</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay usuarios</h3>
        <p className="text-gray-500">No se encontraron usuarios que coincidan con los filtros.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden">
      <ResponsiveTable scrollable>
        <TableHeader 
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={onSort}
        />
        <tbody className="bg-white divide-y divide-gray-200">
          {memoizedUsers.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              onEditUser={onEditUser}
              onDeleteUser={onDeleteUser}
            />
          ))}
        </tbody>
      </ResponsiveTable>
      
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <Loading type="spinner" size="md" text="Actualizando..." />
        </div>
      )}
    </div>
  )
}






