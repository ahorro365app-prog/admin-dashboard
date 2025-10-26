export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          🎉 Panel Administrativo Funcionando
        </h1>
        <p className="text-gray-600 mb-6">
          El servidor está ejecutándose correctamente en el puerto 3001.
        </p>
        <div className="space-y-2">
          <a 
            href="/login" 
            className="block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-center"
          >
            🚪 Ir al Login
          </a>
          <a 
            href="/manual-setup" 
            className="block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-center"
          >
            🔧 Configuración Manual
          </a>
        </div>
      </div>
    </div>
  )
}