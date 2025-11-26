'use client'

import { useState, useEffect } from 'react'
import { 
  LineChart, 
  Line, 
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
  ResponsiveContainer,
  ComposedChart
} from 'recharts'
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react'

interface ChartData {
  transactions7Days: { name: string; gastos: number; ingresos: number; neto: number }[]
  newUsers6Months: { name: string; usuarios: number; premium: number }[]
  subscriptionDistribution: { name: string; value: number; color: string }[]
  revenueByCountry: { pais: string; ingresos: number; usuarios: number }[]
  categorySpending: { categoria: string; monto: number; transacciones: number }[]
  monthlyGrowth: { mes: string; usuarios: number; ingresos: number; gastos: number }[]
}

interface AnalyticsData {
  totalRevenue: number
  totalUsers: number
  activeUsers: number
  conversionRate: number
  avgTransactionValue: number
  topCountries: { pais: string; usuarios: number }[]
  topCategories: { categoria: string; monto: number }[]
}

export function AdvancedAnalytics() {
  const [chartData, setChartData] = useState<ChartData>({
    transactions7Days: [],
    newUsers6Months: [],
    subscriptionDistribution: [],
    revenueByCountry: [],
    categorySpending: [],
    monthlyGrowth: []
  })
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('7d')
  const [selectedChart, setSelectedChart] = useState('transactions')

  useEffect(() => {
    fetchAnalyticsData()
  }, [selectedPeriod])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      console.log('📊 Fetching advanced analytics data...')

      const [chartsResponse, analyticsResponse] = await Promise.all([
        fetch(`/api/analytics/charts-v2?period=${selectedPeriod}`),
        fetch('/api/analytics/overview')
      ])

      const chartsData = await chartsResponse.json()
      const analyticsData = await analyticsResponse.json()

      if (chartsData.success) {
        setChartData(chartsData.data)
      }

      if (analyticsData.success) {
        setAnalyticsData(analyticsData.data)
      }

    } catch (error) {
      console.error('💥 Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('es-ES').format(value)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analytics Avanzados</h2>
            <p className="text-gray-600">Análisis detallado del rendimiento del sistema</p>
          </div>
          <div className="flex space-x-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Últimos 90 días</option>
              <option value="1y">Último año</option>
            </select>
            <button
              onClick={fetchAnalyticsData}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>

        {/* Chart Type Selector */}
        <div className="flex space-x-2 mb-6">
          {[
            { id: 'transactions', label: '📊 Transacciones', icon: TrendingUp },
            { id: 'users', label: '👥 Usuarios', icon: Users },
            { id: 'revenue', label: '💰 Ingresos', icon: DollarSign },
            { id: 'categories', label: '🏷️ Categorías', icon: Activity }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSelectedChart(id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                selectedChart === id
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(analyticsData.totalRevenue)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">+12.5% vs período anterior</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Usuarios Totales</p>
                <p className="text-2xl font-bold text-blue-600">{formatNumber(analyticsData.totalUsers)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">+8.2% vs período anterior</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
                <p className="text-2xl font-bold text-purple-600">{formatNumber(analyticsData.activeUsers)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">{analyticsData.conversionRate}% conversión</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Promedio</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(analyticsData.avgTransactionValue)}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Por transacción</p>
          </div>
        </div>
      )}

      {/* Advanced Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Transactions Chart */}
        {selectedChart === 'transactions' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transacciones por Día</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData.transactions7Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    formatCurrency(Number(value)), 
                    name === 'gastos' ? 'Gastos' : name === 'ingresos' ? 'Ingresos' : 'Neto'
                  ]}
                />
                <Legend />
                <Area type="monotone" dataKey="ingresos" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                <Area type="monotone" dataKey="gastos" stackId="2" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
                <Line type="monotone" dataKey="neto" stroke="#3B82F6" strokeWidth={3} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Users Chart */}
        {selectedChart === 'users' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Crecimiento de Usuarios</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.newUsers6Months}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value, name) => [formatNumber(Number(value)), name === 'usuarios' ? 'Total' : 'Premium']} />
                <Legend />
                <Bar dataKey="usuarios" fill="#3B82F6" name="Total Usuarios" />
                <Bar dataKey="premium" fill="#F59E0B" name="Usuarios Premium" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Revenue Chart */}
        {selectedChart === 'revenue' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ingresos por País</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.revenueByCountry} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="pais" type="category" width={80} />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Ingresos']} />
                <Bar dataKey="ingresos" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Categories Chart */}
        {selectedChart === 'categories' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Gastos por Categoría</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.categorySpending}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ categoria, percent }) => `${categoria} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="monto"
                >
                  {chartData.categorySpending.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Monto']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Subscription Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Suscripciones</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.subscriptionDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.subscriptionDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [formatNumber(Number(value)), 'Usuarios']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Growth */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Crecimiento Mensual</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.monthlyGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'usuarios' ? formatNumber(Number(value)) : formatCurrency(Number(value)),
                  name === 'usuarios' ? 'Usuarios' : name === 'ingresos' ? 'Ingresos' : 'Gastos'
                ]}
              />
              <Legend />
              <Line type="monotone" dataKey="usuarios" stroke="#3B82F6" strokeWidth={2} />
              <Line type="monotone" dataKey="ingresos" stroke="#10B981" strokeWidth={2} />
              <Line type="monotone" dataKey="gastos" stroke="#EF4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Countries and Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Países</h3>
          <div className="space-y-3">
            {analyticsData?.topCountries.map((country, index) => (
              <div key={country.pais} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-sm">{index + 1}</span>
                  </div>
                  <span className="font-medium text-gray-900">{country.pais}</span>
                </div>
                <span className="text-gray-600">{formatNumber(country.usuarios)} usuarios</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Categorías</h3>
          <div className="space-y-3">
            {analyticsData?.topCategories.map((category, index) => (
              <div key={category.categoria} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-medium text-sm">{index + 1}</span>
                  </div>
                  <span className="font-medium text-gray-900">{category.categoria}</span>
                </div>
                <span className="text-gray-600">{formatCurrency(category.monto)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

