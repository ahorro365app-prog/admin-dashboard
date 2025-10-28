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

interface BlockUserModalProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (userId: string) => Promise<void>
  loading?: boolean
}

export function BlockUserModal({ user, isOpen, onClose, onConfirm, loading = false }: BlockUserModalProps) {
  const [isBlocked, setIsBlocked] = useState(false) // Simulamos que el usuario no está bloqueado

  const handleConfirm = async () => {
    if (!user) return
    
    try {
      await onConfirm(user.id)
      setIsBlocked(!isBlocked) // Cambiar estado
      onClose()
    } catch (error) {
      console.error('Error blocking user:', error)
    }
  }

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-red-600 text-lg">🚫</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {isBlocked ? 'Desbloquear Usuario' : 'Bloquear Usuario'}
                </h3>
                <p className="text-sm text-gray-500">
                  Confirmar acción de {isBlocked ? 'desbloqueo' : 'bloqueo'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-medium text-sm">
                  {user.nombre.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user.nombre}</p>
                <p className="text-xs text-gray-500">
                  {user.correo || user.telefono || 'Sin contacto'}
                </p>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className={`rounded-lg p-4 mb-6 ${
            isBlocked ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <span className={`text-lg ${
                  isBlocked ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isBlocked ? '✅' : '⚠️'}
                </span>
              </div>
              <div>
                <h4 className={`text-sm font-medium ${
                  isBlocked ? 'text-green-800' : 'text-red-800'
                }`}>
                  {isBlocked ? 'Desbloquear Usuario' : 'Bloquear Usuario'}
                </h4>
                <p className={`text-sm mt-1 ${
                  isBlocked ? 'text-green-700' : 'text-red-700'
                }`}>
                  {isBlocked 
                    ? 'El usuario podrá acceder nuevamente a la aplicación y realizar transacciones.'
                    : 'El usuario no podrá acceder a la aplicación ni realizar transacciones hasta que sea desbloqueado.'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Confirmation Question */}
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              ¿Estás seguro de que quieres{' '}
              <span className="font-medium text-gray-900">
                {isBlocked ? 'desbloquear' : 'bloquear'}
              </span>{' '}
              a <span className="font-medium text-gray-900">{user.nombre}</span>?
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 disabled:opacity-50 ${
                isBlocked
                  ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                  : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
              }`}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Procesando...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>{isBlocked ? '✅' : '🚫'}</span>
                  <span>{isBlocked ? 'Desbloquear' : 'Bloquear'}</span>
                </div>
              )}
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Esta acción puede ser revertida en cualquier momento desde el panel de administración.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}




