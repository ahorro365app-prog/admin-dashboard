'use client'

import { useState } from 'react'

export default function ManualSetupPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

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

  const copySQLToClipboard = () => {
    const sql = `-- Crear tabla de usuarios administradores
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- Habilitar RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Crear política para service_role
CREATE POLICY "Service role can access admin_users" ON admin_users
    FOR ALL USING (auth.role() = 'service_role');

-- Insertar usuario administrador inicial
INSERT INTO admin_users (email, password_hash, role)
VALUES ('admin@demo.com', 'admin123', 'admin')
ON CONFLICT (email) DO NOTHING;`

    navigator.clipboard.writeText(sql)
    alert('SQL copiado al portapapeles!')
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔧 Configuración Manual del Panel</h1>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-yellow-800 mb-4">⚠️ Paso 1: Crear Tabla en Supabase</h2>
          <p className="text-yellow-700 mb-4">
            Necesitas crear la tabla admin_users manualmente en Supabase SQL Editor.
          </p>
          
          <div className="bg-gray-100 p-4 rounded mb-4">
            <h3 className="font-semibold mb-2">SQL a ejecutar:</h3>
            <pre className="text-sm overflow-x-auto">
{`-- Crear tabla de usuarios administradores
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- Habilitar RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Crear política para service_role
CREATE POLICY "Service role can access admin_users" ON admin_users
    FOR ALL USING (auth.role() = 'service_role');

-- Insertar usuario administrador inicial
INSERT INTO admin_users (email, password_hash, role)
VALUES ('admin@demo.com', 'admin123', 'admin')
ON CONFLICT (email) DO NOTHING;`}
            </pre>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={copySQLToClipboard}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              📋 Copiar SQL
            </button>
            <a
              href="https://supabase.com/dashboard/project/dojalqbebxsqufzvebis/sql"
              target="_blank"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              🗄️ Abrir SQL Editor
            </a>
          </div>
          
          <div className="mt-4 text-sm text-yellow-700">
            <p><strong>Instrucciones:</strong></p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>Haz clic en "Copiar SQL"</li>
              <li>Haz clic en "Abrir SQL Editor"</li>
              <li>Pega el SQL en el editor</li>
              <li>Ejecuta el script</li>
              <li>Regresa aquí y continúa con el paso 2</li>
            </ol>
          </div>
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
          <h3 className="text-lg font-semibold text-blue-800 mb-2">📝 Instrucciones Completas:</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-700">
            <li>Ejecuta el SQL en Supabase SQL Editor</li>
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
