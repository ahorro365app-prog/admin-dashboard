'use client'

import { useState } from 'react'

// Forzar exportación dinámica
export const dynamic = 'force-dynamic'

export default function TestPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testLogin = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      console.log('🧪 Testing login API...')
      
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
      
      setResult({
        status: response.status,
        ok: response.ok,
        data: data,
        cookies: document.cookie
      })
      
    } catch (error) {
      console.error('❌ Error:', error)
      setResult({
        error: error.message,
        cookies: document.cookie
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🧪 Test de Autenticación</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Login API</h2>
          <button
            onClick={testLogin}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Probando...' : 'Probar Login API'}
          </button>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Resultado:</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Cookies Actuales:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm">
            {document.cookie || 'No hay cookies'}
          </pre>
        </div>
      </div>
    </div>
  )
}

