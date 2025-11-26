'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCSRFToken } from '@/lib/csrf-client'

export default function LoginPage() {
  const [email, setEmail] = useState('admin@demo.com')
  const [password, setPassword] = useState('admin123')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [requires2FA, setRequires2FA] = useState(false)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [twoFAToken, setTwoFAToken] = useState('')
  const [verifying2FA, setVerifying2FA] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const csrfToken = await getCSRFToken()
      
      const response = await fetch('/api/auth/simple-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({ email, password, csrfToken }),
      })

      const data = await response.json()

      if (data.success) {
        if (data.requires2FA) {
          // Requiere 2FA
          setRequires2FA(true)
          setSessionToken(data.sessionToken)
          setError('')
        } else {
          // Login exitoso sin 2FA
          router.push('/dashboard')
        }
      } else {
        setError(data.message || 'Error en el login')
      }
    } catch (error: any) {
      setError('Error de conexión: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    setVerifying2FA(true)
    setError('')

    try {
      if (!sessionToken) {
        setError('Error: No hay token de sesión')
        return
      }

      const csrfToken = await getCSRFToken()
      
      const response = await fetch('/api/auth/verify-2fa-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({ 
          token: twoFAToken,
          sessionToken: sessionToken,
          csrfToken,
        }),
      })

      const data = await response.json()

      if (data.success) {
        router.push('/dashboard')
      } else {
        setError(data.message || 'Código 2FA inválido')
      }
    } catch (error: any) {
      setError('Error de conexión: ' + error.message)
    } finally {
      setVerifying2FA(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Panel Administrativo
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Inicia sesión para acceder al panel
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {!requires2FA ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="admin@demo.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleVerify2FA}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md text-sm">
                <p className="font-semibold mb-1">Autenticación de dos factores requerida</p>
                <p>Ingresa el código de 6 dígitos de tu app de autenticación o un código de respaldo (8 caracteres).</p>
              </div>

              <div>
                <label htmlFor="twoFAToken" className="block text-sm font-medium text-gray-700">
                  Código 2FA
                </label>
                <div className="mt-1">
                  <input
                    id="twoFAToken"
                    name="twoFAToken"
                    type="text"
                    autoComplete="one-time-code"
                    required
                    value={twoFAToken}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                      setTwoFAToken(value.slice(0, 8))
                    }}
                    placeholder="000000 o BACKUP01"
                    maxLength={8}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center text-lg tracking-widest font-mono"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Código TOTP (6 dígitos) o código de respaldo (8 caracteres)
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={verifying2FA || twoFAToken.length < 6}
                  className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifying2FA ? 'Verificando...' : 'Verificar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRequires2FA(false)
                    setSessionToken(null)
                    setTwoFAToken('')
                    setError('')
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Volver
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Credenciales por defecto:
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Email: admin@demo.com | Contraseña: admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}