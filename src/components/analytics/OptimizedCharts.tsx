'use client'

import React, { memo, useMemo, Suspense } from 'react'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts'
import { Loading, ChartLoading } from '@/components/common/Loading'

interface ChartData {
  transactions7Days: { name: string; gastos: number; ingresos: number; neto: number }[]
  newUsers6Months: { name: string; usuarios: number; premium: number }[]
  subscriptionDistribution: { name: string; value: number; color: string }[]
  revenueByCountry: { pais: string; ingresos: number; usuarios: number }[]
  categorySpending: { categoria: string; monto: number; transacciones: number }[]
  monthlyGrowth: { mes: string; usuarios: number; ingresos: number; gastos: number }[]
}

interface OptimizedChartsProps {
  chartData: ChartData
  loading: boolean
  selectedChart: string
}

// Componente memoizado para gráfico de transacciones
const TransactionsChart = memo(({ data }: { data: ChartData['transactions7Days'] }) => {
  const memoizedData = useMemo(() => data, [data])

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={memoizedData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip 
          formatter={(value, name) => [
            new Intl.NumberFormat('es-ES', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0
            }).format(Number(value)), 
            name === 'gastos' ? 'Gastos' : name === 'ingresos' ? 'Ingresos' : 'Neto'
          ]}
        />
        <Legend />
        <Area type="monotone" dataKey="ingresos" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
        <Area type="monotone" dataKey="gastos" stackId="2" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
        <Line type="monotone" dataKey="neto" stroke="#3B82F6" strokeWidth={3} />
      </AreaChart>
    </ResponsiveContainer>
  )
})

TransactionsChart.displayName = 'TransactionsChart'

// Componente memoizado para gráfico de usuarios
const UsersChart = memo(({ data }: { data: ChartData['newUsers6Months'] }) => {
  const memoizedData = useMemo(() => data, [data])

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={memoizedData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={(value, name) => [
          new Intl.NumberFormat('es-ES').format(Number(value)), 
          name === 'usuarios' ? 'Total' : 'Premium'
        ]} />
        <Legend />
        <Bar dataKey="usuarios" fill="#3B82F6" name="Total Usuarios" />
        <Bar dataKey="premium" fill="#F59E0B" name="Usuarios Premium" />
      </BarChart>
    </ResponsiveContainer>
  )
})

UsersChart.displayName = 'UsersChart'

// Componente memoizado para gráfico de ingresos
const RevenueChart = memo(({ data }: { data: ChartData['revenueByCountry'] }) => {
  const memoizedData = useMemo(() => data, [data])

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={memoizedData} layout="horizontal">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="pais" type="category" width={80} />
        <Tooltip formatter={(value) => [
          new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
          }).format(Number(value)), 
          'Ingresos'
        ]} />
        <Bar dataKey="ingresos" fill="#10B981" />
      </BarChart>
    </ResponsiveContainer>
  )
})

RevenueChart.displayName = 'RevenueChart'

// Componente memoizado para gráfico de categorías
const CategoriesChart = memo(({ data }: { data: ChartData['categorySpending'] }) => {
  const memoizedData = useMemo(() => data, [data])
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={memoizedData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ categoria, percent }) => `${categoria} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="monto"
        >
          {memoizedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [
          new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
          }).format(Number(value)), 
          'Monto'
        ]} />
      </PieChart>
    </ResponsiveContainer>
  )
})

CategoriesChart.displayName = 'CategoriesChart'

// Componente memoizado para gráfico de distribución de suscripciones
const SubscriptionChart = memo(({ data }: { data: ChartData['subscriptionDistribution'] }) => {
  const memoizedData = useMemo(() => data, [data])

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={memoizedData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {memoizedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [
          new Intl.NumberFormat('es-ES').format(Number(value)), 
          'Usuarios'
        ]} />
      </PieChart>
    </ResponsiveContainer>
  )
})

SubscriptionChart.displayName = 'SubscriptionChart'

// Componente memoizado para gráfico de crecimiento mensual
const MonthlyGrowthChart = memo(({ data }: { data: ChartData['monthlyGrowth'] }) => {
  const memoizedData = useMemo(() => data, [data])

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={memoizedData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="mes" />
        <YAxis />
        <Tooltip 
          formatter={(value, name) => [
            name === 'usuarios' 
              ? new Intl.NumberFormat('es-ES').format(Number(value))
              : new Intl.NumberFormat('es-ES', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0
                }).format(Number(value)),
            name === 'usuarios' ? 'Usuarios' : name === 'ingresos' ? 'Ingresos' : 'Gastos'
          ]}
        />
        <Legend />
        <Line type="monotone" dataKey="usuarios" stroke="#3B82F6" strokeWidth={2} />
        <Line type="monotone" dataKey="ingresos" stroke="#10B981" strokeWidth={2} />
        <Line type="monotone" dataKey="gastos" stroke="#EF4444" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
})

MonthlyGrowthChart.displayName = 'MonthlyGrowthChart'

// Componente principal optimizado
export function OptimizedCharts({ chartData, loading, selectedChart }: OptimizedChartsProps) {
  // Memoizar los datos para evitar re-renders innecesarios
  const memoizedChartData = useMemo(() => chartData, [chartData])

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartLoading />
        <ChartLoading />
      </div>
    )
  }

  const renderChart = () => {
    switch (selectedChart) {
      case 'transactions':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transacciones por Día</h3>
            <Suspense fallback={<ChartLoading />}>
              <TransactionsChart data={memoizedChartData.transactions7Days} />
            </Suspense>
          </div>
        )
      
      case 'users':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Crecimiento de Usuarios</h3>
            <Suspense fallback={<ChartLoading />}>
              <UsersChart data={memoizedChartData.newUsers6Months} />
            </Suspense>
          </div>
        )
      
      case 'revenue':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ingresos por País</h3>
            <Suspense fallback={<ChartLoading />}>
              <RevenueChart data={memoizedChartData.revenueByCountry} />
            </Suspense>
          </div>
        )
      
      case 'categories':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Gastos por Categoría</h3>
            <Suspense fallback={<ChartLoading />}>
              <CategoriesChart data={memoizedChartData.categorySpending} />
            </Suspense>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {renderChart()}
      
      {/* Gráfico de distribución de suscripciones */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Suscripciones</h3>
        <Suspense fallback={<ChartLoading />}>
          <SubscriptionChart data={memoizedChartData.subscriptionDistribution} />
        </Suspense>
      </div>

      {/* Gráfico de crecimiento mensual */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Crecimiento Mensual</h3>
        <Suspense fallback={<ChartLoading />}>
          <MonthlyGrowthChart data={memoizedChartData.monthlyGrowth} />
        </Suspense>
      </div>
    </div>
  )
}




