'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import ConversationsSidebar from './ConversationsSidebar';
import ChatArea from './ChatArea';
import NewConversationModal from './NewConversationModal';
import LabelManagerModal from './LabelManagerModal';
import QuickRepliesManagerModal from './QuickRepliesManagerModal';
import { MessageCircle, Tag, MessageSquare } from 'lucide-react';

interface Conversation {
  id: string;
  phone_number: string;
  last_message_at: string | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  phone_number: string;
  wa_message_id: string | null;
  direction: 'inbound' | 'outbound';
  message_type: 'text' | 'image' | 'audio' | 'document' | 'video';
  content: string | null;
  media_url: string | null;
  status: string | null;
  timestamp: string;
  created_at: string;
}

export default function SupportChatPanel() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs para polling
  const conversationsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messagesIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Configuración de polling (cada 5 segundos)
  const POLLING_INTERVAL = 5000;
  
  // Función para reproducir sonido de notificación
  const playNotificationSound = useCallback(() => {
    try {
      // Crear un sonido simple usando Web Audio API (no requiere archivo)
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Frecuencia y duración del sonido
      oscillator.frequency.value = 800; // Frecuencia en Hz
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      // Fallback: intentar usar archivo de audio si existe
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch {}
    }
  }, []);

  // Estado para filtro de etiquetas
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  
  // Cargar conversaciones (sin setLoading para polling silencioso)
  const fetchConversations = useCallback(async (silent = false, labelFilter?: string | null) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      // Construir URL con filtro de etiqueta si existe
      let url = '/api/whatsapp/support/conversations';
      if (labelFilter) {
        url += `?label=${encodeURIComponent(labelFilter)}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al cargar conversaciones');
      }

      let newConversations = data.data || [];
      
      // Cargar etiquetas para cada conversación
      const conversationsWithLabels = await Promise.all(
        newConversations.map(async (conv: Conversation) => {
          try {
            const encodedPhone = encodeURIComponent(conv.phone_number);
            const labelsResponse = await fetch(`/api/whatsapp/support/conversations/${encodedPhone}/labels`);
            const labelsData = await labelsResponse.json();
            if (labelsData.success) {
              return { ...conv, labels: labelsData.data || [] };
            }
          } catch (error) {
            console.error('❌ Error cargando etiquetas para conversación:', error);
          }
          return { ...conv, labels: [] };
        })
      );
      
      newConversations = conversationsWithLabels;
      
      // Detectar nuevas conversaciones o cambios en unread_count
      setConversations(prev => {
        const hasNewUnread = newConversations.some((conv: Conversation) => {
          const prevConv = prev.find(p => p.id === conv.id);
          return prevConv && prevConv.unread_count < conv.unread_count;
        });
        
        // Notificación de nuevos mensajes no leídos
        if (hasNewUnread && !document.hidden) {
          const newUnread = newConversations.find((conv: Conversation) => {
            const prevConv = prev.find(p => p.id === conv.id);
            return prevConv && prevConv.unread_count < conv.unread_count;
          });
          
          if (newUnread && newUnread.phone_number !== selectedConversation?.phone_number) {
            // Solo notificar si no es la conversación actual
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`Nuevo mensaje de ${newUnread.phone_number}`, {
                body: `${newUnread.unread_count} mensaje(s) no leído(s)`,
                icon: '/favicon.ico',
                tag: `whatsapp-${newUnread.phone_number}`
              });
            }
          }
        }
        
        return newConversations;
      });
    } catch (err: any) {
      console.error('❌ Error cargando conversaciones:', err);
      if (!silent) {
        setError(err.message || 'Error al cargar conversaciones');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [selectedConversation]);

  // Cargar mensajes de una conversación (sin setLoadingMessages para polling silencioso)
  const fetchMessages = useCallback(async (phoneNumber: string, silent = false) => {
    if (!phoneNumber) return;

    try {
      if (!silent) {
        setLoadingMessages(true);
      }
      setError(null);

      const encodedPhone = encodeURIComponent(phoneNumber);
      const response = await fetch(`/api/whatsapp/support/conversations/${encodedPhone}/messages`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al cargar mensajes');
      }

      const newMessages = data.data || [];
      
      // Detectar nuevos mensajes
      setMessages(prev => {
        if (prev.length === 0) return newMessages;
        
        const prevLastId = prev[prev.length - 1]?.id;
        const newMessagesCount = newMessages.length - prev.length;
        
        // Si hay nuevos mensajes y la conversación está seleccionada, notificar
        if (newMessagesCount > 0 && selectedConversation?.phone_number === phoneNumber) {
          const newMessagesList = newMessages.slice(-newMessagesCount);
          const hasInbound = newMessagesList.some((msg: Message) => msg.direction === 'inbound');
          
          if (hasInbound && !document.hidden) {
            // Sonido de notificación
            playNotificationSound();
          }
        }
        
        return newMessages;
      });
    } catch (err: any) {
      console.error('❌ Error cargando mensajes:', err);
      if (!silent) {
        setError(err.message || 'Error al cargar mensajes');
      }
    } finally {
      if (!silent) {
        setLoadingMessages(false);
      }
    }
  }, [selectedConversation]);
  
  // Marcar conversación como leída
  const markAsRead = useCallback(async (phoneNumber: string) => {
    if (!phoneNumber) return;
    
    try {
      const encodedPhone = encodeURIComponent(phoneNumber);
      const response = await fetch(`/api/whatsapp/support/conversations/${encodedPhone}/read`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Actualizar contador local
        setConversations(prev => 
          prev.map(conv => 
            conv.phone_number === phoneNumber 
              ? { ...conv, unread_count: 0 }
              : conv
          )
        );
      }
    } catch (err) {
      console.error('❌ Error marcando como leída:', err);
    }
  }, []);

  // Solicitar permisos de notificación al montar
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

    // Cargar conversaciones al montar y configurar polling
  useEffect(() => {
    fetchConversations(false, selectedLabelId);
    
    // Configurar polling de conversaciones (solo si la página está visible)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pausar polling cuando la página está oculta
        if (conversationsIntervalRef.current) {
          clearInterval(conversationsIntervalRef.current);
          conversationsIntervalRef.current = null;
        }
      } else {
        // Reanudar polling cuando la página es visible
        if (!conversationsIntervalRef.current) {
          conversationsIntervalRef.current = setInterval(() => {
            if (!document.hidden) {
              fetchConversations(true, selectedLabelId); // Polling silencioso
            }
          }, POLLING_INTERVAL);
        }
      }
    };
    
    // Polling inicial
    if (!document.hidden) {
      conversationsIntervalRef.current = setInterval(() => {
        if (!document.hidden) {
          fetchConversations(true, selectedLabelId); // Polling silencioso
        }
      }, POLLING_INTERVAL);
    }
    
    // Escuchar cambios de visibilidad
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      if (conversationsIntervalRef.current) {
        clearInterval(conversationsIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchConversations, selectedLabelId]);

  // Cargar mensajes cuando se selecciona una conversación y configurar polling
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.phone_number);
      
      // Marcar como leída al seleccionar
      markAsRead(selectedConversation.phone_number);
      
      // Configurar polling de mensajes (solo si la página está visible)
      const handleVisibilityChange = () => {
        if (document.hidden) {
          // Pausar polling cuando la página está oculta
          if (messagesIntervalRef.current) {
            clearInterval(messagesIntervalRef.current);
            messagesIntervalRef.current = null;
          }
        } else {
          // Reanudar polling cuando la página es visible
          if (!messagesIntervalRef.current && selectedConversation) {
            messagesIntervalRef.current = setInterval(() => {
              if (!document.hidden && selectedConversation) {
                fetchMessages(selectedConversation.phone_number, true); // Polling silencioso
              }
            }, POLLING_INTERVAL);
          }
        }
      };
      
      // Polling inicial
      if (!document.hidden) {
        messagesIntervalRef.current = setInterval(() => {
          if (!document.hidden && selectedConversation) {
            fetchMessages(selectedConversation.phone_number, true); // Polling silencioso
          }
        }, POLLING_INTERVAL);
      }
      
      // Escuchar cambios de visibilidad
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        if (messagesIntervalRef.current) {
          clearInterval(messagesIntervalRef.current);
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    } else {
      setMessages([]);
      if (messagesIntervalRef.current) {
        clearInterval(messagesIntervalRef.current);
        messagesIntervalRef.current = null;
      }
    }
  }, [selectedConversation, fetchMessages, markAsRead]);

  // Handler para seleccionar conversación
  const handleSelectConversation = useCallback((conversation: Conversation) => {
    setSelectedConversation(conversation);
    // Marcar como leída al seleccionar
    markAsRead(conversation.phone_number);
  }, [markAsRead]);
  
  // Handler para crear nueva conversación
  const handleNewConversation = useCallback(async (phoneNumber: string) => {
    // Normalizar número (remover espacios, guiones, +)
    const normalizedPhone = phoneNumber.replace(/[\s\-+]/g, '');
    
    // Crear conversación temporal para abrir el chat
    const newConversation: Conversation = {
      id: `temp-${Date.now()}`,
      phone_number: normalizedPhone,
      last_message_at: null,
      unread_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Seleccionar la conversación (esto creará la conversación en el backend cuando se carguen los mensajes)
    setSelectedConversation(newConversation);
    
    // Refrescar conversaciones para obtener la conversación real del backend
    setTimeout(() => {
      fetchConversations();
    }, 1000);
  }, [fetchConversations]);
  
  // Estado para modales
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [showLabelManagerModal, setShowLabelManagerModal] = useState(false);
  const [showQuickRepliesManagerModal, setShowQuickRepliesManagerModal] = useState(false);
  
  // Escuchar eventos para abrir modales
  useEffect(() => {
    const handleOpenNewConversation = () => {
      setShowNewConversationModal(true);
    };
    
    const handleOpenLabelManager = () => {
      setShowLabelManagerModal(true);
    };
    
    window.addEventListener('openNewConversationModal', handleOpenNewConversation);
    window.addEventListener('openLabelManagerModal', handleOpenLabelManager);
    
    return () => {
      window.removeEventListener('openNewConversationModal', handleOpenNewConversation);
      window.removeEventListener('openLabelManagerModal', handleOpenLabelManager);
    };
  }, []);

  // Escuchar evento para refrescar conversaciones (cuando se actualizan etiquetas)
  useEffect(() => {
    const handleRefresh = () => {
      fetchConversations(false, selectedLabelId);
    };
    
    window.addEventListener('refreshConversations', handleRefresh);
    
    return () => {
      window.removeEventListener('refreshConversations', handleRefresh);
    };
  }, [fetchConversations, selectedLabelId]);
  
  // Refrescar conversaciones cuando cambia el filtro de etiqueta
  useEffect(() => {
    fetchConversations(false, selectedLabelId);
  }, [selectedLabelId, fetchConversations]);
  
  // Handler para refrescar conversaciones
  const handleRefresh = useCallback(() => {
    fetchConversations(false, selectedLabelId);
  }, [fetchConversations, selectedLabelId]);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Chat de Soporte</h2>
              <p className="text-sm text-gray-500">Gestiona conversaciones de WhatsApp</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQuickRepliesManagerModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Gestionar respuestas rápidas"
            >
              <MessageSquare className="w-4 h-4" />
              Respuestas Rápidas
            </button>
            <button
              onClick={() => setShowLabelManagerModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Gestionar etiquetas"
            >
              <Tag className="w-4 h-4" />
              Etiquetas
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-300px)] min-h-[600px]">
        {/* Sidebar de Conversaciones */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <ConversationsSidebar
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={handleSelectConversation}
            onRefresh={handleRefresh}
            loading={loading}
            error={error}
            selectedLabelId={selectedLabelId}
            onLabelFilterChange={setSelectedLabelId}
          />
        </div>

        {/* Área de Chat Principal */}
        <div className="flex-1 flex flex-col">
          <ChatArea
            conversation={selectedConversation}
            messages={messages}
            loading={loadingMessages}
            error={error}
            onMessageSent={() => {
              // Refrescar mensajes después de enviar
              if (selectedConversation) {
                fetchMessages(selectedConversation.phone_number);
              }
            }}
          />
        </div>
      </div>
      
      {/* Modal para nueva conversación */}
      <NewConversationModal
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        onConfirm={handleNewConversation}
      />
      
      {/* Modal para gestionar etiquetas */}
      <LabelManagerModal
        isOpen={showLabelManagerModal}
        onClose={() => setShowLabelManagerModal(false)}
        onLabelCreated={() => {
          fetchConversations(); // Refrescar para mostrar nuevas etiquetas
        }}
        onLabelUpdated={() => {
          fetchConversations();
        }}
        onLabelDeleted={() => {
          fetchConversations();
        }}
      />
      
      {/* Modal para gestionar respuestas rápidas */}
      <QuickRepliesManagerModal
        isOpen={showQuickRepliesManagerModal}
        onClose={() => setShowQuickRepliesManagerModal(false)}
        onQuickReplyCreated={() => {
          // Las respuestas rápidas se recargan automáticamente en ChatArea
        }}
        onQuickReplyUpdated={() => {
          // Las respuestas rápidas se recargan automáticamente en ChatArea
        }}
        onQuickReplyDeleted={() => {
          // Las respuestas rápidas se recargan automáticamente en ChatArea
        }}
      />
    </div>
  );
}

