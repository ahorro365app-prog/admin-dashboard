'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Verificar si ya hay token
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('admin-token='))
      ?.split('=')[1]

    if (token) {
      router.push('/dashboard')
    }
  }, [router])

  const handleQuickLogin = async () => {
    console.log('🚀 Starting quick login...')
    
    try {
      console.log('📡 Making API request to /api/auth/login')
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: 'admin@demo.com', 
          password: 'admin123' 
        }),
      })

      console.log('📡 Response status:', response.status)
      console.log('📡 Response ok:', response.ok)
      
      const data = await response.json()
      console.log('📦 Response data:', data)

      if (data.success) {
        console.log('✅ Login successful, redirecting to dashboard')
        router.push('/dashboard')
      } else {
        console.error('❌ Login failed:', data.message)
        alert('Error en el login rápido: ' + data.message)
      }
    } catch (error) {
      console.error('❌ Connection error:', error)
      alert('Error de conexión: ' + (error as Error).message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Logo/Icono */}
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-2xl font-bold">A</span>
          </div>

          {/* Título */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Panel Administrativo
          </h1>
          <p className="text-gray-600 mb-8">
            Ahorro365 - Gestión de Usuarios y Analytics
          </p>

          {/* Botón de acceso rápido */}
          <button
            onClick={handleQuickLogin}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            🚀 Acceso Directo como Admin
          </button>

          {/* Información adicional */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-3">
              O accede manualmente:
            </p>
            <button
              onClick={() => router.push('/login')}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm underline"
            >
              Ir al Login Tradicional
            </button>
          </div>

          {/* Características */}
          <div className="mt-8 grid grid-cols-2 gap-4 text-xs text-gray-500">
            <div className="flex items-center justify-center">
              <span className="mr-1">📊</span>
              Analytics
            </div>
            <div className="flex items-center justify-center">
              <span className="mr-1">👥</span>
              Usuarios
            </div>
            <div className="flex items-center justify-center">
              <span className="mr-1">🔗</span>
              Referidos
            </div>
            <div className="flex items-center justify-center">
              <span className="mr-1">⚙️</span>
              Config
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">
            Panel Administrativo v1.0 | Puerto 3001
          </p>
        </div>
      </div>
    </div>
  )
}