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

interface UserFiltersProps {
  onFilterChange: (filters: {
    search: string
    subscription: string
    country: string
  }) => void
  loading?: boolean
}

export function UserFilters({ onFilterChange, loading = false }: UserFiltersProps) {
  const [filters, setFilters] = useState({
    search: '',
    subscription: '',
    country: ''
  })

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Filtros de Búsqueda
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Búsqueda por nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar por nombre
          </label>
          <input
            type="text"
            placeholder="Nombre del usuario..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
          />
        </div>

        {/* Filtro por suscripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de suscripción
          </label>
          <select
            value={filters.subscription}
            onChange={(e) => handleFilterChange('subscription', e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
          >
            <option value="">Todos</option>
            <option value="free">Free</option>
            <option value="premium">Premium</option>
          </select>
        </div>

        {/* Filtro por país */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            País
          </label>
          <select
            value={filters.country}
            onChange={(e) => handleFilterChange('country', e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
          >
            <option value="">Todos los países</option>
            <option value="BO">Bolivia</option>
            <option value="PE">Perú</option>
            <option value="AR">Argentina</option>
            <option value="BR">Brasil</option>
            <option value="CL">Chile</option>
            <option value="CO">Colombia</option>
            <option value="EC">Ecuador</option>
            <option value="PY">Paraguay</option>
            <option value="UY">Uruguay</option>
            <option value="VE">Venezuela</option>
            <option value="MX">México</option>
            <option value="US">Estados Unidos</option>
            <option value="EU">Europa</option>
          </select>
        </div>
      </div>

      {/* Botón de limpiar filtros */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={() => {
            const clearedFilters = { search: '', subscription: '', country: '' }
            setFilters(clearedFilters)
            onFilterChange(clearedFilters)
          }}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
        >
          🗑️ Limpiar Filtros
        </button>
      </div>
    </div>
  )
}

