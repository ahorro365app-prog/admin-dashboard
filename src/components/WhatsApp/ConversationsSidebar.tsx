'use client';

import { useState, useEffect } from 'react';
import { Search, RefreshCw, MessageCircle, Plus, Tag, X } from 'lucide-react';

interface Label {
  id: string;
  name: string;
  color: string;
  description?: string;
}

interface Conversation {
  id: string;
  phone_number: string;
  last_message_at: string | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
  labels?: Label[]; // Etiquetas asignadas
}

interface ConversationsSidebarProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
  onRefresh?: () => void;
  loading?: boolean;
  error?: string | null;
  selectedLabelId?: string | null;
  onLabelFilterChange?: (labelId: string | null) => void;
}

export default function ConversationsSidebar({
  conversations,
  selectedConversation,
  onSelectConversation,
  onRefresh,
  loading = false,
  error = null,
  selectedLabelId = null,
  onLabelFilterChange
}: ConversationsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [allLabels, setAllLabels] = useState<Label[]>([]);

  // Cargar etiquetas
  useEffect(() => {
    const fetchLabels = async () => {
      try {
        const response = await fetch('/api/whatsapp/support/labels');
        const data = await response.json();
        if (data.success) {
          setAllLabels(data.data || []);
        }
      } catch (error) {
        console.error('❌ Error cargando etiquetas:', error);
      }
    };
    fetchLabels();
  }, []);

  // Filtrar conversaciones por búsqueda y etiqueta
  let filteredConversations = conversations.filter(conv =>
    conv.phone_number.includes(searchQuery)
  );

  // Filtrar por etiqueta si está seleccionada
  if (selectedLabelId) {
    filteredConversations = filteredConversations.filter(conv =>
      conv.labels?.some(label => label.id === selectedLabelId)
    );
  }

  // Formatear fecha relativa
  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  // Formatear número de teléfono
  const formatPhoneNumber = (phone: string) => {
    // Si tiene código de país, formatear mejor
    if (phone.length > 10) {
      return `+${phone}`;
    }
    return phone;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header con búsqueda y refresh */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar conversación..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Actualizar conversaciones"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-gray-500">
            {filteredConversations.length} conversación{filteredConversations.length !== 1 ? 'es' : ''}
          </div>
          <button
            onClick={() => {
              // Abrir modal para nueva conversación
              const event = new CustomEvent('openNewConversationModal');
              window.dispatchEvent(event);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
            title="Nueva conversación"
          >
            <Plus className="w-3.5 h-3.5" />
            Nueva
          </button>
        </div>

        {/* Filtro por etiquetas */}
        {allLabels.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700">Filtrar por etiqueta:</span>
              {selectedLabelId && onLabelFilterChange && (
                <button
                  onClick={() => onLabelFilterChange(null)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Limpiar
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {allLabels.map((label) => (
                <button
                  key={label.id}
                  onClick={() => onLabelFilterChange?.(selectedLabelId === label.id ? null : label.id)}
                  className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded-full border transition-colors ${
                    selectedLabelId === label.id
                      ? 'bg-green-50 border-green-500 text-green-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: label.color }}
                  />
                  {label.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lista de conversaciones */}
      <div className="flex-1 overflow-y-auto">
        {loading && conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-600">
            <p className="text-sm">{error}</p>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="mt-2 text-xs text-red-500 hover:text-red-700 underline"
              >
                Reintentar
              </button>
            )}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">
              {searchQuery ? 'No se encontraron conversaciones' : 'No hay conversaciones'}
            </p>
            {!searchQuery && (
              <p className="text-xs mt-1 text-gray-400">
                Los mensajes aparecerán aquí cuando lleguen
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredConversations.map((conversation) => {
              const isSelected = selectedConversation?.id === conversation.id;
              const hasUnread = conversation.unread_count > 0;

              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation)}
                  className={`w-full p-4 text-left hover:bg-gray-100 transition-all ${
                    isSelected ? 'bg-green-50 border-l-4 border-l-green-500 shadow-sm' : ''
                  } active:bg-gray-50`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`font-medium text-sm truncate ${
                          hasUnread ? 'text-gray-900 font-semibold' : 'text-gray-700'
                        }`}>
                          {formatPhoneNumber(conversation.phone_number)}
                        </p>
                        {hasUnread && (
                          <span className="flex-shrink-0 w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">
                            {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatRelativeTime(conversation.last_message_at)}
                      </p>
                      {/* Etiquetas */}
                      {conversation.labels && conversation.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {conversation.labels.map((label) => (
                            <span
                              key={label.id}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded-full"
                              style={{
                                backgroundColor: `${label.color}20`,
                                color: label.color,
                                border: `1px solid ${label.color}40`
                              }}
                            >
                              <div
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: label.color }}
                              />
                              {label.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

