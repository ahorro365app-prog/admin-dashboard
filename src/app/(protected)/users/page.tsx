'use client'

import { useState, useEffect } from 'react'
import { UserFilters } from '@/components/users/UserFilters'
import { UsersTable } from '@/components/users/UsersTable'
import { Pagination } from '@/components/users/Pagination'
import { EditUserModal } from '@/components/users/EditUserModal'

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

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  
  // Estados para filtros
  const [filters, setFilters] = useState({
    search: '',
    subscription: '',
    country: ''
  })
  
  // Estados para modales
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [pagination.page, filters])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      console.log('👥 Fetching users with filters:', filters)
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.subscription && { subscription: filters.subscription }),
        ...(filters.country && { country: filters.country })
      })

      const response = await fetch(`/api/users/crud?${params}`)
      const data = await response.json()

      if (data.success) {
        console.log('👥 Users loaded:', data.data.length)
        setUsers(data.data)
        setPagination(data.pagination)
      } else {
        setError(data.message || 'Error cargando usuarios')
      }
    } catch (error) {
      console.error('💥 Error fetching users:', error)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
  }

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setIsEditModalOpen(true)
  }

  const handleViewUser = (user: User) => {
    // Por ahora, redirigir a una página de detalles
    window.location.href = `/users/${user.id}`
  }

  const handleToggleBlock = async (user: User) => {
    if (confirm(`¿Estás seguro de que quieres bloquear/desbloquear a ${user.nombre}?`)) {
      try {
        // Aquí implementarías la lógica de bloqueo
        console.log('🚫 Blocking/unblocking user:', user.id)
        alert('Funcionalidad de bloqueo pendiente de implementar')
      } catch (error) {
        console.error('Error blocking user:', error)
        alert('Error al bloquear usuario')
      }
    }
  }

  const handleSaveUser = async (userData: Partial<User>) => {
    if (!editingUser) return

    try {
      setSaving(true)
      console.log('💾 Saving user:', editingUser.id, userData)

      const response = await fetch('/api/users/crud', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingUser.id,
          ...userData
        })
      })

      const data = await response.json()

      if (data.success) {
        console.log('✅ User saved successfully')
        // Actualizar la lista de usuarios
        await fetchUsers()
        setIsEditModalOpen(false)
        setEditingUser(null)
      } else {
        throw new Error(data.message)
      }
    } catch (error: any) {
      console.error('💥 Error saving user:', error)
      alert('Error al guardar usuario: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setEditingUser(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gestión de Usuarios
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Administra usuarios del sistema con filtros avanzados
              </p>
            </div>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              ← Volver al Dashboard
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

          {/* Filtros */}
          <UserFilters 
            onFilterChange={handleFilterChange}
            loading={loading}
          />

          {/* Tabla de usuarios */}
          <UsersTable
            users={users}
            loading={loading}
            onEditUser={handleEditUser}
            onViewUser={handleViewUser}
            onToggleBlock={handleToggleBlock}
          />

          {/* Paginación */}
          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={handlePageChange}
              loading={loading}
            />
          )}

          {/* Modal de edición */}
          <EditUserModal
            user={editingUser}
            isOpen={isEditModalOpen}
            onClose={handleCloseEditModal}
            onSave={handleSaveUser}
            loading={saving}
          />
        </div>
      </main>
    </div>
  )
}