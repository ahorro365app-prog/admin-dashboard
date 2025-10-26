'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ReferralsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sistema de Referidos</h1>
        <p className="text-gray-600">Gestiona el programa de referidos y bonificaciones</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Referidores</CardTitle>
          <CardDescription>
            Usuarios con más referidos exitosos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Tabla de referidores (implementar en Paso 5)
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

