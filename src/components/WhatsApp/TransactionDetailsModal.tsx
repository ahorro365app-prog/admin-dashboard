'use client';

import { useEffect } from 'react';
import { X, CheckCircle, XCircle, Clock, User, MessageSquare, Receipt, Calendar, Hash } from 'lucide-react';
import type { WhatsAppTransaction } from './TransactionsPanel';

interface TransactionDetailsModalProps {
  transaction: WhatsAppTransaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TransactionDetailsModal({ transaction, isOpen, onClose }: TransactionDetailsModalProps) {
  // Cerrar con tecla Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !transaction) return null;

  const statusBadge = getStatusBadge(transaction.prediction.confirmado);
  const StatusIcon = statusBadge.icon;
  const totalAmount = transaction.transacciones.reduce((sum, t) => sum + t.monto, 0);
  const countryCode = transaction.usuario?.country_code || 'BO';

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
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

  function getStatusBadge(confirmado: boolean | null) {
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
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fadeIn">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden flex flex-col animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Detalles de Transacción</h3>
              <p className="text-xs text-gray-500">Información completa de la transacción de WhatsApp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-all duration-200 p-1 rounded-lg hover:bg-gray-100 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {/* Estado */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <StatusIcon className="w-5 h-5" />
                <span className="text-sm font-medium text-gray-700">Estado de Confirmación</span>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${statusBadge.className}`}
              >
                <StatusIcon className="w-4 h-4" />
                {statusBadge.text}
              </span>
            </div>

            {/* Información del Usuario */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-gray-600" />
                <h4 className="text-sm font-semibold text-gray-900">Información del Usuario</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Nombre</p>
                  <p className="text-sm font-medium text-gray-900">
                    {transaction.usuario?.nombre || 'Usuario desconocido'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Teléfono</p>
                  <p className="text-sm font-medium text-gray-900">
                    {transaction.usuario?.telefono || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">País</p>
                  <p className="text-sm font-medium text-gray-900">
                    {transaction.usuario?.pais || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Código de País</p>
                  <p className="text-sm font-medium text-gray-900">
                    {transaction.usuario?.country_code || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Transcripción */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-5 h-5 text-gray-600" />
                <h4 className="text-sm font-semibold text-gray-900">Transcripción Original</h4>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {transaction.prediction.transcripcion || 'No hay transcripción disponible'}
                </p>
              </div>
            </div>

            {/* Transacciones */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-gray-600" />
                  <h4 className="text-sm font-semibold text-gray-900">
                    Transacciones ({transaction.transacciones.length})
                  </h4>
                </div>
                {transaction.transacciones.length > 0 && (
                  <div className="text-sm font-semibold text-gray-900">
                    Total: {formatAmount(totalAmount, countryCode)}
                  </div>
                )}
              </div>

              {transaction.transacciones.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No se encontraron transacciones relacionadas
                </p>
              ) : (
                <div className="space-y-3">
                  {transaction.transacciones.map((t, idx) => (
                    <div
                      key={t.id || idx}
                      className="bg-gray-50 rounded-lg p-3 border border-gray-100"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Tipo</p>
                          <p className="text-sm font-medium text-gray-900 capitalize">{t.tipo}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Monto</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatAmount(t.monto, countryCode)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Categoría</p>
                          <p className="text-sm font-medium text-gray-900 capitalize">{t.categoria}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Fecha</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(t.fecha)}
                          </p>
                        </div>
                        {t.descripcion && (
                          <div className="md:col-span-2">
                            <p className="text-xs text-gray-500 mb-1">Descripción</p>
                            <p className="text-sm text-gray-700">{t.descripcion}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Información Técnica */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Hash className="w-5 h-5 text-gray-600" />
                <h4 className="text-sm font-semibold text-gray-900">Información Técnica</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">ID de Predicción</p>
                  <p className="text-xs font-mono text-gray-700 break-all">
                    {transaction.prediction.id}
                  </p>
                </div>
                {transaction.prediction.wa_message_id && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">ID de Mensaje WhatsApp</p>
                    <p className="text-xs font-mono text-gray-700 break-all">
                      {transaction.prediction.wa_message_id}
                    </p>
                  </div>
                )}
                {transaction.prediction.parent_message_id && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">ID de Mensaje Padre</p>
                    <p className="text-xs font-mono text-gray-700 break-all">
                      {transaction.prediction.parent_message_id}
                    </p>
                  </div>
                )}
                {transaction.prediction.confirmado_por && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Confirmado por</p>
                    <p className="text-xs font-mono text-gray-700 break-all">
                      {transaction.prediction.confirmado_por}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Fechas */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-gray-600" />
                <h4 className="text-sm font-semibold text-gray-900">Fechas</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Fecha Original</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(transaction.prediction.original_timestamp)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Creado</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(transaction.prediction.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Actualizado</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(transaction.prediction.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
              aria-label="Cerrar modal"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

