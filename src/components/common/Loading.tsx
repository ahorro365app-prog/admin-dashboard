'use client'

import React from 'react'
import { Loader2, RefreshCcw, Database } from 'lucide-react'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  type?: 'spinner' | 'dots' | 'pulse' | 'skeleton'
  fullScreen?: boolean
  context?: 'page' | 'component' | 'button'
}

export function Loading({ 
  size = 'md', 
  text = 'Cargando...', 
  type = 'spinner',
  fullScreen = false,
  context = 'component'
}: LoadingProps) {
  
  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'w-4 h-4'
      case 'md': return 'w-6 h-6'
      case 'lg': return 'w-8 h-8'
      case 'xl': return 'w-12 h-12'
      default: return 'w-6 h-6'
    }
  }

  const getTextSize = () => {
    switch (size) {
      case 'sm': return 'text-xs'
      case 'md': return 'text-sm'
      case 'lg': return 'text-base'
      case 'xl': return 'text-lg'
      default: return 'text-sm'
    }
  }

  const getContextIcon = () => {
    switch (context) {
      case 'page': return <Database className="w-8 h-8 text-blue-600" />
      case 'component': return <RefreshCcw className="w-6 h-6 text-blue-600" />
      case 'button': return <Loader2 className="w-4 h-4 text-white" />
      default: return <Loader2 className="w-6 h-6 text-blue-600" />
    }
  }

  const renderLoader = () => {
    switch (type) {
      case 'spinner':
        return (
          <div className="animate-spin">
            {context === 'button' ? (
              <Loader2 className={`${getSizeClasses()} text-white`} />
            ) : (
              getContextIcon()
            )}
          </div>
        )
      
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`bg-blue-600 rounded-full animate-pulse ${getSizeClasses()}`}
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        )
      
      case 'pulse':
        return (
          <div className={`bg-blue-600 rounded-full animate-pulse ${getSizeClasses()}`} />
        )
      
      case 'skeleton':
        return (
          <div className="animate-pulse">
            <div className="bg-gray-200 rounded h-4 w-full mb-2"></div>
            <div className="bg-gray-200 rounded h-4 w-3/4 mb-2"></div>
            <div className="bg-gray-200 rounded h-4 w-1/2"></div>
          </div>
        )
      
      default:
        return (
          <div className="animate-spin">
            <Loader2 className={`${getSizeClasses()} text-blue-600`} />
          </div>
        )
    }
  }

  const content = (
    <div className={`flex flex-col items-center justify-center space-y-3 ${
      fullScreen ? 'min-h-screen' : 'py-8'
    }`}>
      {renderLoader()}
      {text && (
        <p className={`text-gray-600 ${getTextSize()}`}>
          {text}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm z-50">
        {content}
      </div>
    )
  }

  return content
}

// Componente específico para páginas
export function PageLoading({ text = 'Cargando página...' }: { text?: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-lg text-gray-600">{text}</p>
        <div className="mt-4 flex justify-center space-x-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  )
}

// Componente para botones
export function ButtonLoading({ text = 'Procesando...' }: { text?: string }) {
  return (
    <div className="flex items-center space-x-2">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>{text}</span>
    </div>
  )
}

// Componente para tablas
export function TableLoading({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="flex space-x-4">
            <div className="bg-gray-200 rounded h-4 w-4"></div>
            <div className="bg-gray-200 rounded h-4 flex-1"></div>
            <div className="bg-gray-200 rounded h-4 w-20"></div>
            <div className="bg-gray-200 rounded h-4 w-16"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Componente para cards
export function CardLoading({ cards = 3 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gray-200 rounded h-4 w-3/4"></div>
            <div className="bg-gray-200 rounded-full h-8 w-8"></div>
          </div>
          <div className="bg-gray-200 rounded h-8 w-1/2 mb-2"></div>
          <div className="bg-gray-200 rounded h-4 w-full"></div>
        </div>
      ))}
    </div>
  )
}

// Componente para gráficos
export function ChartLoading() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="animate-pulse">
        <div className="bg-gray-200 rounded h-6 w-1/3 mb-4"></div>
        <div className="bg-gray-200 rounded h-64 w-full"></div>
      </div>
    </div>
  )
}

// Hook para manejo de estados de carga
export function useLoading(initialState = false) {
  const [loading, setLoading] = React.useState(initialState)
  const [loadingText, setLoadingText] = React.useState('Cargando...')

  const startLoading = React.useCallback((text?: string) => {
    setLoading(true)
    if (text) setLoadingText(text)
  }, [])

  const stopLoading = React.useCallback(() => {
    setLoading(false)
    setLoadingText('Cargando...')
  }, [])

  const withLoading = React.useCallback(async <T,>(
    asyncFn: () => Promise<T>,
    loadingText?: string
  ): Promise<T> => {
    try {
      startLoading(loadingText)
      const result = await asyncFn()
      return result
    } finally {
      stopLoading()
    }
  }, [startLoading, stopLoading])

  return {
    loading,
    loadingText,
    startLoading,
    stopLoading,
    withLoading
  }
}






