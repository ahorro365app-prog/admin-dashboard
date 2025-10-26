'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

interface ErrorInfo {
  id: string
  message: string
  type: 'error' | 'warning' | 'info'
  timestamp: Date
  details?: string
  action?: {
    label: string
    onClick: () => void
  }
}

interface ErrorContextType {
  errors: ErrorInfo[]
  addError: (error: Omit<ErrorInfo, 'id' | 'timestamp'>) => void
  removeError: (id: string) => void
  clearAllErrors: () => void
  showError: (message: string, details?: string) => void
  showWarning: (message: string, details?: string) => void
  showInfo: (message: string, details?: string) => void
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined)

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [errors, setErrors] = useState<ErrorInfo[]>([])

  const addError = useCallback((error: Omit<ErrorInfo, 'id' | 'timestamp'>) => {
    const newError: ErrorInfo = {
      ...error,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    }
    
    setErrors(prev => [...prev, newError])
    
    // Auto-remove info messages after 5 seconds
    if (error.type === 'info') {
      setTimeout(() => {
        removeError(newError.id)
      }, 5000)
    }
  }, [])

  const removeError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id))
  }, [])

  const clearAllErrors = useCallback(() => {
    setErrors([])
  }, [])

  const showError = useCallback((message: string, details?: string) => {
    addError({ message, type: 'error', details })
  }, [addError])

  const showWarning = useCallback((message: string, details?: string) => {
    addError({ message, type: 'warning', details })
  }, [addError])

  const showInfo = useCallback((message: string, details?: string) => {
    addError({ message, type: 'info', details })
  }, [addError])

  return (
    <ErrorContext.Provider value={{
      errors,
      addError,
      removeError,
      clearAllErrors,
      showError,
      showWarning,
      showInfo
    }}>
      {children}
      <ErrorToastContainer />
    </ErrorContext.Provider>
  )
}

export function useError() {
  const context = useContext(ErrorContext)
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider')
  }
  return context
}

function ErrorToastContainer() {
  const { errors, removeError } = useError()

  if (errors.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {errors.map((error) => (
        <ErrorToast key={error.id} error={error} onClose={() => removeError(error.id)} />
      ))}
    </div>
  )
}

function ErrorToast({ error, onClose }: { error: ErrorInfo; onClose: () => void }) {
  const getIcon = () => {
    switch (error.type) {
      case 'error': return '❌'
      case 'warning': return '⚠️'
      case 'info': return 'ℹ️'
      default: return 'ℹ️'
    }
  }

  const getBgColor = () => {
    switch (error.type) {
      case 'error': return 'bg-red-50 border-red-200'
      case 'warning': return 'bg-yellow-50 border-yellow-200'
      case 'info': return 'bg-blue-50 border-blue-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  const getTextColor = () => {
    switch (error.type) {
      case 'error': return 'text-red-800'
      case 'warning': return 'text-yellow-800'
      case 'info': return 'text-blue-800'
      default: return 'text-gray-800'
    }
  }

  return (
    <div className={`rounded-lg border p-4 shadow-lg ${getBgColor()} animate-in slide-in-from-right-full duration-300`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <span className="text-lg">{getIcon()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${getTextColor()}`}>
            {error.message}
          </p>
          {error.details && (
            <p className={`text-xs mt-1 ${getTextColor()} opacity-75`}>
              {error.details}
            </p>
          )}
          {error.action && (
            <button
              onClick={error.action.onClick}
              className={`text-xs mt-2 font-medium underline ${getTextColor()}`}
            >
              {error.action.label}
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className={`flex-shrink-0 ${getTextColor()} hover:opacity-75`}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

// Hook para manejo de errores en APIs
export function useApiError() {
  const { showError, showWarning } = useError()

  const handleApiError = useCallback((error: any, context?: string) => {
    console.error(`API Error${context ? ` in ${context}` : ''}:`, error)
    
    if (error.response?.status === 401) {
      showError('Sesión expirada', 'Por favor, inicia sesión nuevamente')
      // Redirect to login
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
    } else if (error.response?.status === 403) {
      showError('Acceso denegado', 'No tienes permisos para realizar esta acción')
    } else if (error.response?.status === 404) {
      showError('Recurso no encontrado', 'El elemento solicitado no existe')
    } else if (error.response?.status >= 500) {
      showError('Error del servidor', 'Ha ocurrido un error interno. Intenta nuevamente.')
    } else if (error.code === 'NETWORK_ERROR') {
      showError('Error de conexión', 'Verifica tu conexión a internet')
    } else {
      showError(
        error.message || 'Error inesperado',
        error.details || 'Ha ocurrido un error inesperado'
      )
    }
  }, [showError, showWarning])

  return { handleApiError }
}

