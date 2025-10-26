'use client'

import { useState } from 'react'

export default function SetupPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const createAdminTable = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      console.log('🗄️ Creating admin table...')
      
      const response = await fetch('/api/admin/create-table', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      setResult({
        type: 'table_creation',
        data: data,
        timestamp: new Date().toISOString()
      })
      
    } catch (error) {
      setResult({
        type: 'error',
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  const createAdminUser = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      console.log('👤 Creating admin user...')
      
      const response = await fetch('/api/admin/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      setResult({
        type: 'admin_creation',
        data: data,
        timestamp: new Date().toISOString()
      })
      
    } catch (error) {
      setResult({
        type: 'error',
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      console.log('🔍 Testing Supabase connection...')
      
      const response = await fetch('/api/stats/users')
      const data = await response.json()
      
      setResult({
        type: 'connection_test',
        data: data,
        timestamp: new Date().toISOString()
      })
      
    } catch (error) {
      setResult({
        type: 'error',
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔧 Configuración del Panel Administrativo</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">📋 Paso 1: Crear Tabla de Administradores</h2>
          <p className="text-gray-600 mb-4">
            Esto creará la tabla admin_users en tu base de datos de Supabase.
          </p>
          <button
            onClick={createAdminTable}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creando...' : '🗄️ Crear Tabla Admin'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">👤 Paso 2: Crear Usuario Administrador</h2>
          <p className="text-gray-600 mb-4">
            Esto creará el usuario admin@demo.com con contraseña admin123.
          </p>
          <button
            onClick={createAdminUser}
            disabled={loading}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Creando...' : '👤 Crear Admin User'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🔍 Paso 3: Probar Conexión</h2>
          <p className="text-gray-600 mb-4">
            Esto probará la conexión con tu base de datos y mostrará estadísticas reales.
          </p>
          <button
            onClick={testConnection}
            disabled={loading}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Probando...' : '🔍 Probar Conexión'}
          </button>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">📊 Resultado:</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">📝 Instrucciones:</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-700">
            <li>Haz clic en "Crear Tabla Admin" para crear la tabla necesaria</li>
            <li>Haz clic en "Crear Admin User" para crear el usuario administrador</li>
            <li>Haz clic en "Probar Conexión" para verificar que todo funciona</li>
            <li>Ve a <a href="/login" className="underline">/login</a> para probar el login</li>
            <li>Usa las credenciales: admin@demo.com / admin123</li>
          </ol>
        </div>
      </div>
    </div>
  )
}