'use client';

import { useEffect, useState } from 'react';

interface MetricsData {
  audios: number;
  successRate: number;
  errors: number;
  transactions: number;
  totalAmount: number;
}

export default function MetricsCard() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/whatsapp/metrics');
        const data = await res.json();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay métricas disponibles
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {/* Audios */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="text-sm text-gray-600">Audios Procesados</div>
        <div className="text-2xl font-bold text-blue-600">{metrics.audios}</div>
      </div>

      {/* Success Rate */}
      <div className="bg-green-50 rounded-lg p-4">
        <div className="text-sm text-gray-600">Tasa de Éxito</div>
        <div className="text-2xl font-bold text-green-600">{metrics.successRate}%</div>
      </div>

      {/* Errors */}
      <div className="bg-red-50 rounded-lg p-4">
        <div className="text-sm text-gray-600">Errores</div>
        <div className="text-2xl font-bold text-red-600">{metrics.errors}</div>
      </div>

      {/* Transactions */}
      <div className="bg-purple-50 rounded-lg p-4">
        <div className="text-sm text-gray-600">Transacciones</div>
        <div className="text-2xl font-bold text-purple-600">{metrics.transactions}</div>
      </div>

      {/* Amount */}
      <div className="bg-yellow-50 rounded-lg p-4">
        <div className="text-sm text-gray-600">Monto Total</div>
        <div className="text-2xl font-bold text-yellow-600">${metrics.totalAmount}</div>
      </div>
    </div>
  );
}
