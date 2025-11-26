'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCSRFToken } from '@/lib/csrf-client'

interface TwoFAStatus {
  enabled: boolean;
  hasSecret: boolean;
}

export default function TwoFASettingsPage() {
  const router = useRouter()
  const [status, setStatus] = useState<TwoFAStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [setupLoading, setSetupLoading] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [disableLoading, setDisableLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Estados para setup
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [setupStep, setSetupStep] = useState<'idle' | 'qr' | 'verify'>('idle')
  const [verifyToken, setVerifyToken] = useState('')

  useEffect(() => {
    check2FAStatus()
  }, [])

  const check2FAStatus = async () => {
    try {
      // Verificar si el usuario tiene 2FA habilitado
      // Por ahora, asumimos que si no hay QR code mostrado, no está configurado
      setStatus({ enabled: false, hasSecret: false })
    } catch (error) {
      console.error('Error checking 2FA status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSetup2FA = async () => {
    setSetupLoading(true)
    setError('')
    setSuccess('')
    
    try {
      const csrfToken = await getCSRFToken()
      
      const response = await fetch('/api/auth/setup-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({ csrfToken }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.message || 'Error configurando 2FA')
        return
      }

      setQrCode(data.qrCode)
      setBackupCodes(data.backupCodes)
      setShowBackupCodes(true)
      setSetupStep('qr')
      setSuccess('Escanea el QR code con tu app de autenticación')
      
    } catch (error: any) {
      setError('Error de conexión: ' + error.message)
    } finally {
      setSetupLoading(false)
    }
  }

  const handleVerifySetup = async () => {
    if (!verifyToken || verifyToken.length !== 6) {
      setError('Ingresa un código de 6 dígitos')
      return
    }

    setVerifyLoading(true)
    setError('')
    setSuccess('')
    
    try {
      const csrfToken = await getCSRFToken()
      
      const response = await fetch('/api/auth/verify-2fa-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({ 
          token: verifyToken,
          csrfToken,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.message || 'Código inválido')
        return
      }

      setSuccess('✅ 2FA habilitado correctamente')
      setSetupStep('idle')
      setQrCode(null)
      setVerifyToken('')
      setStatus({ enabled: true, hasSecret: true })
      
      // Recargar después de 2 segundos
      setTimeout(() => {
        router.refresh()
      }, 2000)
      
    } catch (error: any) {
      setError('Error de conexión: ' + error.message)
    } finally {
      setVerifyLoading(false)
    }
  }

  const handleDisable2FA = async () => {
    if (!verifyToken || (verifyToken.length !== 6 && verifyToken.length !== 8)) {
      setError('Ingresa un código 2FA válido (6 dígitos) o código de respaldo (8 caracteres)')
      return
    }

    setDisableLoading(true)
    setError('')
    setSuccess('')
    
    try {
      const csrfToken = await getCSRFToken()
      
      const response = await fetch('/api/auth/disable-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({ 
          token: verifyToken,
          csrfToken,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.message || 'Código inválido')
        return
      }

      setSuccess('✅ 2FA deshabilitado correctamente')
      setVerifyToken('')
      setStatus({ enabled: false, hasSecret: false })
      
      // Recargar después de 2 segundos
      setTimeout(() => {
        router.refresh()
      }, 2000)
      
    } catch (error: any) {
      setError('Error de conexión: ' + error.message)
    } finally {
      setDisableLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Configuración de 2FA</h1>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800">{success}</p>
            </div>
          )}

          {/* Setup 2FA */}
          {setupStep === 'idle' && !status?.enabled && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h2 className="text-lg font-semibold text-blue-900 mb-2">¿Qué es 2FA?</h2>
                <p className="text-blue-800 text-sm">
                  La autenticación de dos factores (2FA) agrega una capa adicional de seguridad a tu cuenta.
                  Después de ingresar tu contraseña, necesitarás un código de 6 dígitos de tu app de autenticación.
                </p>
              </div>

              <button
                onClick={handleSetup2FA}
                disabled={setupLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {setupLoading ? 'Configurando...' : 'Configurar 2FA'}
              </button>
            </div>
          )}

          {/* Mostrar QR Code y Backup Codes */}
          {setupStep === 'qr' && qrCode && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Paso 1: Escanea el QR Code</h2>
                <div className="flex justify-center mb-4">
                  <img src={qrCode} alt="QR Code 2FA" className="border-2 border-gray-300 rounded" />
                </div>
                <p className="text-sm text-gray-600 text-center">
                  Usa una app como Google Authenticator, Authy o Microsoft Authenticator
                </p>
              </div>

              {showBackupCodes && backupCodes.length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Códigos de Respaldo</h3>
                  <p className="text-sm text-yellow-800 mb-3">
                    Guarda estos códigos en un lugar seguro. Puedes usarlos si pierdes acceso a tu app de autenticación.
                  </p>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {backupCodes.map((code, index) => (
                      <code key={index} className="block p-2 bg-white border border-yellow-300 rounded text-center font-mono text-sm">
                        {code}
                      </code>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowBackupCodes(false)}
                    className="text-sm text-yellow-900 underline"
                  >
                    Ocultar códigos
                  </button>
                </div>
              )}

              <div>
                <h2 className="text-lg font-semibold mb-4">Paso 2: Verifica el código</h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={verifyToken}
                    onChange={(e) => setVerifyToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-center text-2xl tracking-widest font-mono"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleVerifySetup}
                      disabled={verifyLoading || verifyToken.length !== 6}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {verifyLoading ? 'Verificando...' : 'Verificar y Habilitar'}
                    </button>
                    <button
                      onClick={() => {
                        setSetupStep('idle')
                        setQrCode(null)
                        setVerifyToken('')
                        setBackupCodes([])
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Deshabilitar 2FA */}
          {status?.enabled && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800">
                  ✅ 2FA está habilitado para tu cuenta
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-4">Deshabilitar 2FA</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Para deshabilitar 2FA, ingresa un código 2FA válido o un código de respaldo.
                </p>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={verifyToken}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                      setVerifyToken(value.slice(0, 8))
                    }}
                    placeholder="Código 2FA o backup"
                    maxLength={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-center text-lg tracking-widest font-mono"
                  />
                  <button
                    onClick={handleDisable2FA}
                    disabled={disableLoading || verifyToken.length < 6}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {disableLoading ? 'Deshabilitando...' : 'Deshabilitar 2FA'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

