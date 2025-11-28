'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Receipt, AlertCircle, Eye, CheckCircle, XCircle, Clock, Search, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { TransactionDetailsModal } from './TransactionDetailsModal';

// URL del core-api
const CORE_API_URL =
  process.env.NEXT_PUBLIC_CORE_API_URL?.replace(/\/$/, '') || 
  'https://ai-app-core-api.vercel.app';

// Tipos para los datos
export interface WhatsAppTransaction {
  prediction: {
    id: string;
    transcripcion: string;
    resultado: any;
    confirmado: boolean | null;
    confirmado_por: string | null;
    wa_message_id: string | null;
    parent_message_id: string | null;
    original_timestamp: string;
    created_at: string;
    updated_at: string;
  };
  usuario: {
    id: string;
    nombre: string;
    telefono: string;
    pais: string;
    country_code: string;
  } | null;
  transacciones: Array<{
    id: string;
    usuario_id: string;
    tipo: string;
    monto: number;
    categoria: string;
    descripcion: string | null;
    fecha: string;
  }>;
}

interface TransactionsResponse {
  success: boolean;
  data: WhatsAppTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Panel de Transacciones de WhatsApp
 * 
 * Este componente muestra la lista de transacciones procesadas desde WhatsApp.
 * Sub-Fase 1.4: Integración con backend endpoint.
 */
// Tipos para filtros
interface Filters {
  search: string;
  status: 'pending' | 'confirmed' | 'rejected' | '';
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
}

export default function TransactionsPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<WhatsAppTransaction[]>([]);
  const [pagination, setPagination] = useState<TransactionsResponse['pagination'] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<WhatsAppTransaction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Función para construir URL con filtros
  const buildUrl = useCallback((pageNum: number | string = 1) => {
    // Asegurar que pageNum sea un número
    const page = typeof pageNum === 'number' ? pageNum : parseInt(String(pageNum), 10) || 1;
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', '20');

    if (filters.search.trim()) {
      params.append('search', filters.search.trim());
    }
    if (filters.status) {
      params.append('status', filters.status);
    }
    if (filters.dateFrom) {
      params.append('dateFrom', filters.dateFrom);
    }
    if (filters.dateTo) {
      params.append('dateTo', filters.dateTo);
    }
    if (filters.minAmount) {
      params.append('minAmount', filters.minAmount);
    }
    if (filters.maxAmount) {
      params.append('maxAmount', filters.maxAmount);
    }

    return `${CORE_API_URL}/api/whatsapp/transactions?${params.toString()}`;
  }, [filters]);

  // Función para obtener transacciones
  const fetchTransactions = useCallback(async (pageNum: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(pageNum);
      
      console.log('🔄 Llamando a:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // No cachear para obtener datos frescos
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result: TransactionsResponse = await response.json();
      
      console.log('✅ Respuesta recibida:', {
        success: result.success,
        count: result.data?.length || 0,
        pagination: result.pagination,
      });

      if (result.success) {
        setData(result.data || []);
        setPagination(result.pagination || null);
      } else {
        throw new Error('La respuesta no fue exitosa');
      }
    } catch (err: any) {
      console.error('❌ Error obteniendo transacciones:', err);
      setError(err.message || 'Error al obtener transacciones');
      setData([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [buildUrl]);

  // Debounce para la búsqueda (esperar 500ms después de que el usuario deje de escribir)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset a página 1 cuando cambia la búsqueda
    }, filters.search ? 500 : 0); // Solo debounce si hay búsqueda, sino aplicar inmediatamente

    return () => clearTimeout(timeoutId);
  }, [filters.search]);

  // Aplicar filtros inmediatamente cuando cambian (excepto búsqueda que tiene debounce)
  useEffect(() => {
    if (!filters.search) {
      // Solo resetear página si no hay búsqueda (la búsqueda se maneja en el useEffect anterior)
      setCurrentPage(1); // Reset a página 1 cuando cambian los filtros
    }
  }, [filters.status, filters.dateFrom, filters.dateTo, filters.minAmount, filters.maxAmount]);

  // Cargar datos cuando cambia la página actual o los filtros
  useEffect(() => {
    fetchTransactions(currentPage);
  }, [currentPage, fetchTransactions]);

  // Funciones de navegación de paginación
  const goToPage = (page: number) => {
    if (page >= 1 && pagination && page <= pagination.totalPages) {
      setCurrentPage(page);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (pagination && currentPage < pagination.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Calcular páginas a mostrar (máximo 5 números de página visibles)
  const getPageNumbers = (): number[] => {
    if (!pagination) return [];
    
    const totalPages = pagination.totalPages;
    const current = currentPage;
    const pages: number[] = [];
    
    if (totalPages <= 5) {
      // Si hay 5 o menos páginas, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Si hay más de 5 páginas, mostrar páginas alrededor de la actual
      if (current <= 3) {
        // Al inicio: mostrar primeras 5 páginas
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
      } else if (current >= totalPages - 2) {
        // Al final: mostrar últimas 5 páginas
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // En el medio: mostrar 2 antes, actual, 2 después
        for (let i = current - 2; i <= current + 2; i++) {
          pages.push(i);
        }
      }
    }
    
    return pages;
  };

  // Función para actualizar un filtro
  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Función para limpiar todos los filtros
  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: '',
    });
  };

  // Verificar si hay filtros activos
  const hasActiveFilters = Boolean(
    filters.search.trim() ||
    filters.status ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.minAmount ||
    filters.maxAmount
  );

  // Funciones auxiliares para formatear datos
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const formatAmount = (amount: number, currency: string = 'BO'): string => {
    const currencySymbols: Record<string, string> = {
      BO: 'Bs.',
      AR: '$',
      MX: '$',
      PE: 'S/',
      CO: '$',
      CL: '$',
    };
    const symbol = currencySymbols[currency] || '$';
    return `${symbol} ${amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (confirmado: boolean | null) => {
    if (confirmado === true) {
      return {
        icon: CheckCircle,
        text: 'Confirmado',
        className: 'bg-green-100 text-green-700 border-green-200',
      };
    } else if (confirmado === false) {
      return {
        icon: XCircle,
        text: 'Rechazado',
        className: 'bg-red-100 text-red-700 border-red-200',
      };
    } else {
      return {
        icon: Clock,
        text: 'Pendiente',
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      };
    }
  };

  const truncateText = (text: string, maxLength: number = 60): string => {
    if (!text) return 'N/A';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Transacciones de WhatsApp</h2>
            <p className="text-sm text-gray-500">
              {pagination ? `${pagination.total} transacciones encontradas` : 'Transacciones procesadas desde WhatsApp'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
              showFilters || hasActiveFilters
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-label={showFilters ? "Ocultar filtros" : "Mostrar filtros"}
            aria-expanded={showFilters}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-200 text-blue-800 rounded-full">
                {[
                  filters.search && '1',
                  filters.status && '1',
                  filters.dateFrom && '1',
                  filters.dateTo && '1',
                  filters.minAmount && '1',
                  filters.maxAmount && '1',
                ].filter(Boolean).length}
              </span>
            )}
          </button>
          <button
            onClick={() => fetchTransactions(1)}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            aria-label="Actualizar lista de transacciones"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
                Cargando...
              </>
            ) : (
              '🔄 Actualizar'
            )}
          </button>
        </div>
      </div>

      {/* Panel de Filtros - Sub-Fase 1.6 */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtros de Búsqueda
            </h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Búsqueda por nombre o teléfono */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Buscar (nombre o teléfono)
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  placeholder="Buscar usuario..."
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filtro por estado */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Estado
              </label>
              <select
                value={filters.status}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmado</option>
                <option value="rejected">Rechazado</option>
              </select>
            </div>

            {/* Filtro por fecha desde */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Fecha desde
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => updateFilter('dateFrom', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filtro por fecha hasta */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Fecha hasta
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => updateFilter('dateTo', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filtro por monto mínimo */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Monto mínimo
              </label>
              <input
                type="number"
                value={filters.minAmount}
                onChange={(e) => updateFilter('minAmount', e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filtro por monto máximo */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Monto máximo
              </label>
              <input
                type="number"
                value={filters.maxAmount}
                onChange={(e) => updateFilter('maxAmount', e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Estado de carga con skeleton */}
      {loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Cargando transacciones...</span>
          </div>
          {/* Skeleton loader para la tabla */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {[...Array(6)].map((_, i) => (
                    <th key={i} className="py-3 px-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="py-4 px-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Estado de error */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-900 mb-1">Error al cargar transacciones</h3>
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={fetchTransactions}
                className="mt-3 text-sm font-medium text-red-900 hover:text-red-800 underline"
              >
                Intentar nuevamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {!loading && !error && data.length === 0 && (
        <div className="text-center py-12 animate-fadeIn">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center animate-pulse">
            <Receipt className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay transacciones
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {hasActiveFilters 
              ? 'No se encontraron transacciones con los filtros aplicados. Intenta ajustar los filtros.'
              : 'Aún no se han procesado transacciones desde WhatsApp.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Tabla de transacciones - Sub-Fase 1.5 */}
      {!loading && !error && data.length > 0 && (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            {pagination ? (
              <>
                Mostrando <span className="font-medium">{data.length}</span> de <span className="font-medium">{pagination.total}</span> transacciones
                {pagination.totalPages > 1 && (
                  <span> · Página <span className="font-medium">{pagination.page}</span> de <span className="font-medium">{pagination.totalPages}</span></span>
                )}
              </>
            ) : (
              `Mostrando ${data.length} transacciones`
            )}
          </div>

          {/* Tabla completa de transacciones */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Transcripción
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Transacciones
                  </th>
                  <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {data.map((item, index) => {
                  // Animación de entrada escalonada
                  const animationDelay = index * 50; // 50ms de delay por fila
                  const statusBadge = getStatusBadge(item.prediction.confirmado);
                  const StatusIcon = statusBadge.icon;
                  const totalAmount = item.transacciones.reduce((sum, t) => sum + t.monto, 0);
                  const countryCode = item.usuario?.country_code || 'BO';

                  return (
                    <tr
                      key={item.prediction.id || index}
                      className="hover:bg-gray-50/80 transition-all duration-200 hover:shadow-sm"
                      style={{ animationDelay: `${animationDelay}ms` }}
                    >
                      {/* Usuario */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <div className="font-medium text-gray-900">
                            {item.usuario?.nombre || 'Usuario desconocido'}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {item.usuario?.telefono || 'N/A'}
                          </div>
                          {item.usuario?.pais && (
                            <div className="text-xs text-gray-400 mt-0.5">
                              {item.usuario.pais}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Transcripción */}
                      <td className="py-4 px-4">
                        <div className="max-w-xs">
                          <p className="text-gray-900 text-sm">
                            {truncateText(item.prediction.transcripcion, 80)}
                          </p>
                        </div>
                      </td>

                      {/* Transacciones */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="text-sm font-medium text-gray-900">
                            {item.transacciones.length} {item.transacciones.length === 1 ? 'transacción' : 'transacciones'}
                          </div>
                          {item.transacciones.length > 0 && (
                            <div className="text-xs text-gray-600">
                              <div className="font-medium">
                                Total: {formatAmount(totalAmount, countryCode)}
                              </div>
                              {item.transacciones.slice(0, 2).map((t, idx) => (
                                <div key={idx} className="mt-0.5">
                                  {t.tipo} • {formatAmount(t.monto, countryCode)} • {t.categoria}
                                </div>
                              ))}
                              {item.transacciones.length > 2 && (
                                <div className="text-gray-400 mt-0.5">
                                  +{item.transacciones.length - 2} más
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-4 px-4">
                        <div className="flex justify-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusBadge.className}`}
                          >
                            <StatusIcon className="w-3.5 h-3.5" />
                            {statusBadge.text}
                          </span>
                        </div>
                      </td>

                      {/* Fecha */}
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-900">
                          {formatDate(item.prediction.original_timestamp)}
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-4">
                        <div className="flex justify-center">
                          <button
                            onClick={() => {
                              setSelectedTransaction(item);
                              setShowDetailsModal(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                            title="Ver detalles completos"
                            aria-label={`Ver detalles de transacción ${item.prediction.id}`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Ver
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Controles de Paginación - Sub-Fase 1.7 */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-4">
              {/* Información de paginación */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>
                  Mostrando <span className="font-medium text-gray-900">
                    {((pagination.page - 1) * pagination.limit) + 1}
                  </span> - <span className="font-medium text-gray-900">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span> de <span className="font-medium text-gray-900">{pagination.total}</span> transacciones
                </span>
              </div>

              {/* Controles de navegación */}
              <div className="flex items-center gap-2">
                {/* Botón Anterior */}
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1 || loading}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>

                {/* Números de página */}
                <div className="flex items-center gap-1">
                  {/* Primera página si no está visible */}
                  {pagination.totalPages > 5 && currentPage > 3 && (
                    <>
                      <button
                        onClick={() => goToPage(1)}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        1
                      </button>
                      {currentPage > 4 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                    </>
                  )}

                  {/* Páginas visibles */}
                  {getPageNumbers().map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      disabled={loading}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        pageNum === currentPage
                          ? 'bg-blue-600 text-white border border-blue-600'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  {/* Última página si no está visible */}
                  {pagination.totalPages > 5 && currentPage < pagination.totalPages - 2 && (
                    <>
                      {currentPage < pagination.totalPages - 3 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => goToPage(pagination.totalPages)}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {pagination.totalPages}
                      </button>
                    </>
                  )}
                </div>

                {/* Botón Siguiente */}
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === pagination.totalPages || loading}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Debug info (solo en desarrollo) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-xs">
              <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                🔍 Debug Info (desarrollo)
              </summary>
              <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify({ data: data.slice(0, 2), pagination }, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* Modal de Detalles - Sub-Fase 1.8 */}
      <TransactionDetailsModal
        transaction={selectedTransaction}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedTransaction(null);
        }}
      />
    </div>
  );
}

