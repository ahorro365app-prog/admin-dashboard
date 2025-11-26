'use client'


interface StatsCardProps {
  title: string
  value: number
  icon: string
  color: string
  trend?: {
    value: number
    isPositive: boolean
  }
  loading?: boolean
}

export function StatsCard({ title, value, icon, color, trend, loading = false }: StatsCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-lg font-bold ${color}`}>
            {icon}
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">
                {value.toLocaleString()}
              </div>
              {trend && (
                <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  <span className="sr-only">
                    {trend.isPositive ? 'Aumentó' : 'Disminuyó'} en {Math.abs(trend.value)}%
                  </span>
                  {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
                </div>
              )}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  )
}

interface StatsCardsProps {
  data: {
    totalUsers: number
    premiumUsers: number
    todayTransactions: number
    referrals: number
  }
  loading?: boolean
}

export function StatsCards({ data, loading = false }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Usuarios"
        value={data.totalUsers}
        icon="👥"
        color="bg-blue-500"
        trend={{ value: 12, isPositive: true }}
        loading={loading}
      />
      <StatsCard
        title="Usuarios Premium"
        value={data.premiumUsers}
        icon="⭐"
        color="bg-yellow-500"
        trend={{ value: 8, isPositive: true }}
        loading={loading}
      />
      <StatsCard
        title="Transacciones Hoy"
        value={data.todayTransactions}
        icon="📊"
        color="bg-green-500"
        trend={{ value: 15, isPositive: true }}
        loading={loading}
      />
      <StatsCard
        title="Referidos"
        value={data.referrals}
        icon="🔗"
        color="bg-purple-500"
        trend={{ value: 5, isPositive: true }}
        loading={loading}
      />
    </div>
  )
}

