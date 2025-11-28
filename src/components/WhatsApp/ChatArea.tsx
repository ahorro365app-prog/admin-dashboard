'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, Tag } from 'lucide-react';
import ConversationLabelsModal from './ConversationLabelsModal';
import EmojiPicker, { EmojiButton } from './EmojiPicker';

interface QuickReply {
  id: string;
  command: string;
  message: string;
  description?: string;
  image_url?: string;
}

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

interface ChatAreaProps {
  conversation: Conversation | null;
  messages: Message[];
  loading?: boolean;
  error?: string | null;
  onMessageSent?: () => void; // Callback cuando se envía un mensaje
}

export default function ChatArea({
  conversation,
  messages,
  loading = false,
  error = null,
  onMessageSent
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [messageInput, setMessageInput] = useState('');
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Estado para respuestas rápidas
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [quickReplyFilter, setQuickReplyFilter] = useState('');
  const [selectedQuickReplyIndex, setSelectedQuickReplyIndex] = useState(0);
  const quickReplyDropdownRef = useRef<HTMLDivElement>(null);
  
  // Estado para modal de etiquetas
  const [showLabelsModal, setShowLabelsModal] = useState(false);

  // Cargar respuestas rápidas al montar y cuando se actualizan
  useEffect(() => {
    const fetchQuickReplies = async () => {
      try {
        const response = await fetch('/api/whatsapp/support/quick-replies');
        const data = await response.json();
        if (data.success) {
          setQuickReplies(data.data || []);
        }
      } catch (error) {
        console.error('❌ Error cargando respuestas rápidas:', error);
      }
    };
    
    fetchQuickReplies();
    
    // Escuchar evento para refrescar respuestas rápidas
    const handleRefresh = () => {
      fetchQuickReplies();
    };
    
    window.addEventListener('refreshQuickReplies', handleRefresh);
    
    return () => {
      window.removeEventListener('refreshQuickReplies', handleRefresh);
    };
  }, []);

  // Detectar "/" y mostrar autocompletado
  useEffect(() => {
    const input = messageInput;
    const lastChar = input[input.length - 1];
    const slashIndex = input.lastIndexOf('/');
    
    if (lastChar === '/' || (slashIndex !== -1 && input.substring(slashIndex).trim().length > 0)) {
      // Hay un "/" en el input
      const afterSlash = input.substring(slashIndex + 1);
      setQuickReplyFilter(afterSlash.toLowerCase());
      setShowQuickReplies(true);
      setSelectedQuickReplyIndex(0);
    } else {
      setShowQuickReplies(false);
      setQuickReplyFilter('');
    }
  }, [messageInput]);

  // Filtrar respuestas rápidas con debounce
  const filteredQuickReplies = React.useMemo(() => {
    if (!quickReplyFilter) return quickReplies;
    const filter = quickReplyFilter.toLowerCase();
    return quickReplies.filter(qr =>
      qr.command.toLowerCase().includes(filter) ||
      (qr.description && qr.description.toLowerCase().includes(filter)) ||
      (qr.message && qr.message.toLowerCase().includes(filter))
    );
  }, [quickReplies, quickReplyFilter]);

  // Manejar selección de respuesta rápida
  const handleQuickReplySelect = (quickReply: QuickReply) => {
    const input = messageInput;
    const slashIndex = input.lastIndexOf('/');
    
    if (slashIndex !== -1) {
      // Reemplazar desde "/" hasta el final con el mensaje completo
      const beforeSlash = input.substring(0, slashIndex);
      setMessageInput(beforeSlash + (quickReply.message || ''));
    } else {
      // Si no hay "/", simplemente insertar el mensaje
      setMessageInput(quickReply.message || '');
    }
    
    // Si tiene imagen, guardarla para enviar
    if (quickReply.image_url) {
      setPendingImageUrl(quickReply.image_url);
    }
    
    setShowQuickReplies(false);
    setQuickReplyFilter('');
    textareaRef.current?.focus();
  };

  // Manejar navegación con teclado en autocompletado
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Atajo de teclado para abrir picker de emojis (Ctrl+E o Cmd+E)
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
      e.preventDefault();
      setShowEmojiPicker(!showEmojiPicker);
      if (showQuickReplies) {
        setShowQuickReplies(false);
      }
      return;
    }
    
    if (showQuickReplies && filteredQuickReplies.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedQuickReplyIndex(prev => 
          prev < filteredQuickReplies.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedQuickReplyIndex(prev => 
          prev > 0 ? prev - 1 : filteredQuickReplies.length - 1
        );
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (filteredQuickReplies[selectedQuickReplyIndex]) {
          handleQuickReplySelect(filteredQuickReplies[selectedQuickReplyIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowQuickReplies(false);
        setQuickReplyFilter('');
        setShowEmojiPicker(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      // Si no hay autocompletado, enviar mensaje
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);
  
  // Simular indicador de escritura (por ahora solo visual, sin backend)
  useEffect(() => {
    // Limpiar timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Si hay texto en el input, mostrar indicador de escritura
    if (messageInput.trim().length > 0 && conversation) {
      setIsTyping(true);
      
      // Ocultar después de 3 segundos sin escribir
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 3000);
    } else {
      setIsTyping(false);
    }
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [messageInput, conversation]);

  // Formatear timestamp
  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
    
    return date.toLocaleString('es-ES', { 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  // Renderizar contenido del mensaje según tipo
  const renderMessageContent = (message: Message) => {
    if (message.message_type === 'image' && message.media_url) {
      return (
        <div className="space-y-2">
          <img 
            src={message.media_url} 
            alt="Imagen" 
            className="max-w-xs rounded-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {message.content && (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          )}
        </div>
      );
    }
    
    if (message.message_type === 'document' && message.media_url) {
      return (
        <div className="space-y-2">
          <a 
            href={message.media_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-blue-500 hover:text-blue-700 underline"
          >
            📎 Documento
          </a>
          {message.content && (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          )}
        </div>
      );
    }
    
    if (message.message_type === 'audio' && message.media_url) {
      return (
        <div className="space-y-2">
          <audio controls className="max-w-xs">
            <source src={message.media_url} />
            Tu navegador no soporta audio.
          </audio>
          {message.content && (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          )}
        </div>
      );
    }
    
    if (message.message_type === 'video' && message.media_url) {
      return (
        <div className="space-y-2">
          <video controls className="max-w-xs rounded-lg">
            <source src={message.media_url} />
            Tu navegador no soporta video.
          </video>
          {message.content && (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          )}
        </div>
      );
    }
    
    // Texto por defecto
    return (
      <p className="text-sm whitespace-pre-wrap break-words">
        {message.content || '(Mensaje sin contenido)'}
      </p>
    );
  };

  // Formatear número de teléfono
  const formatPhoneNumber = (phone: string) => {
    if (phone.length > 10) {
      return `+${phone}`;
    }
    return phone;
  };

  // Handler para enviar mensaje
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageInput.trim() && !pendingImageUrl) || !conversation || sending) return;

    const messageText = messageInput.trim();
    const imageUrl = pendingImageUrl;
    setMessageInput('');
    setPendingImageUrl(null);
    setSending(true);
    setSendError(null);

    try {
      const encodedPhone = encodeURIComponent(conversation.phone_number);
      const response = await fetch(`/api/whatsapp/support/conversations/${encodedPhone}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: messageText || undefined,
          imageUrl: imageUrl || undefined
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al enviar mensaje');
      }

      // Mensaje enviado exitosamente
      // El polling automático actualizará los mensajes
      if (onMessageSent) {
        onMessageSent();
      }

      // Limpiar error si había uno previo
      setSendError(null);
    } catch (err: any) {
      console.error('❌ Error enviando mensaje:', err);
      setSendError(err.message || 'Error al enviar mensaje');
      // Restaurar el mensaje en el input para que el usuario pueda reintentar
      setMessageInput(messageText);
      if (imageUrl) {
        setPendingImageUrl(imageUrl);
      }
    } finally {
      setSending(false);
    }
  };

  // Estado vacío (sin conversación seleccionada)
  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Selecciona una conversación
          </h3>
          <p className="text-sm text-gray-500">
            Elige una conversación del panel lateral o crea una nueva para ver los mensajes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header de la conversación */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">
              {formatPhoneNumber(conversation.phone_number)}
            </h3>
            <p className="text-xs text-gray-500">
              {conversation.unread_count > 0 && (
                <span className="text-green-600 font-medium">
                  {conversation.unread_count} no leído{conversation.unread_count !== 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowLabelsModal(true)}
            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Gestionar etiquetas"
          >
            <Tag className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Modal de etiquetas */}
      <ConversationLabelsModal
        isOpen={showLabelsModal}
        onClose={() => setShowLabelsModal(false)}
        phoneNumber={conversation.phone_number}
        onLabelsUpdated={() => {
          // Refrescar conversaciones para actualizar etiquetas
          const event = new CustomEvent('refreshConversations');
          window.dispatchEvent(event);
        }}
      />

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Cargando mensajes...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-red-600">
              <p className="text-sm">{error}</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No hay mensajes aún</p>
              <p className="text-xs mt-1 text-gray-400">
                Los mensajes aparecerán aquí cuando se envíen o reciban
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isOutbound = message.direction === 'outbound';
            const messageDate = new Date(message.timestamp);

            return (
              <div
                key={message.id}
                className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    isOutbound
                      ? 'bg-green-500 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  {renderMessageContent(message)}
                  <div className={`flex items-center justify-end gap-1 mt-1 ${
                    isOutbound ? 'text-green-100' : 'text-gray-400'
                  }`}>
                    <span className="text-xs">
                      {formatTimestamp(message.timestamp)}
                    </span>
                    {isOutbound && (
                      <span className="text-xs flex items-center gap-0.5">
                        {message.status === 'read' ? (
                          <span className="text-blue-300" title="Leído">✓✓</span>
                        ) : message.status === 'delivered' ? (
                          <span className="text-green-200" title="Entregado">✓✓</span>
                        ) : message.status === 'sent' ? (
                          <span className="text-green-100" title="Enviado">✓</span>
                        ) : message.status === 'failed' ? (
                          <span className="text-red-300" title="Fallido">✗</span>
                        ) : (
                          <span className="text-gray-300" title="Pendiente">○</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {/* Indicador de escritura */}
        {isTyping && conversation && (
          <div className="flex justify-end">
            <div className="max-w-[70%] rounded-lg px-4 py-2 bg-gray-100 border border-gray-200">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">Escribiendo</span>
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input para enviar mensaje */}
      <div className="px-6 py-4 border-t border-gray-200 bg-white">
        {sendError && (
          <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-600">{sendError}</p>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 relative">
          <div className="flex-1 relative">
            <textarea
              value={messageInput}
              onChange={(e) => {
                setMessageInput(e.target.value);
                setSendError(null); // Limpiar error al escribir
              }}
              onKeyDown={handleKeyDown}
              placeholder={conversation ? "Escribe un mensaje... (usa / para respuestas rápidas)" : "Selecciona una conversación"}
              rows={1}
              className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none min-h-[40px] max-h-[120px] overflow-y-auto"
              disabled={!conversation || sending}
              ref={textareaRef}
              style={{
                height: 'auto',
                minHeight: '40px',
              }}
              onInput={(e) => {
                // Auto-resize textarea
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                
                // Reset typing indicator timeout
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                }
                setIsTyping(true);
                typingTimeoutRef.current = setTimeout(() => {
                  setIsTyping(false);
                }, 3000);
              }}
            />
            
            {/* Botón de emoji dentro del textarea */}
            <div className="absolute right-2 bottom-2">
              <EmojiButton
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                  if (showQuickReplies) {
                    setShowQuickReplies(false);
                  }
                }}
                isActive={showEmojiPicker}
                className="w-8 h-8"
              />
            </div>
            
            {/* Picker de emojis */}
            {showEmojiPicker && (
              <EmojiPicker
                onEmojiSelect={(emoji) => {
                  const cursorPosition = textareaRef.current?.selectionStart || messageInput.length;
                  const newMessage = 
                    messageInput.substring(0, cursorPosition) + 
                    emoji + 
                    messageInput.substring(cursorPosition);
                  setMessageInput(newMessage);
                  setShowEmojiPicker(false);
                  
                  // Restaurar cursor después del emoji
                  setTimeout(() => {
                    if (textareaRef.current) {
                      const newPosition = cursorPosition + emoji.length;
                      textareaRef.current.setSelectionRange(newPosition, newPosition);
                      textareaRef.current.focus();
                    }
                  }, 0);
                }}
                isOpen={showEmojiPicker}
                onClose={() => setShowEmojiPicker(false)}
                position="top"
              />
            )}
            
            {/* Dropdown de respuestas rápidas */}
            {showQuickReplies && filteredQuickReplies.length > 0 && (
              <div
                ref={quickReplyDropdownRef}
                className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50"
              >
                {filteredQuickReplies.map((qr, index) => (
                  <button
                    key={qr.id}
                    type="button"
                    onClick={() => handleQuickReplySelect(qr)}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors ${
                      index === selectedQuickReplyIndex ? 'bg-green-50 border-l-2 border-green-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 font-mono text-xs">/{qr.command}</span>
                      {qr.description && (
                        <span className="text-xs text-gray-500">- {qr.description}</span>
                      )}
                    </div>
                    {qr.image_url && (
                      <div className="mt-1">
                        <img
                          src={qr.image_url}
                          alt="Quick reply"
                          className="max-w-32 max-h-20 object-contain rounded border border-gray-200"
                        />
                      </div>
                    )}
                    {qr.message && (
                      <p className="text-xs text-gray-600 mt-1 truncate">{qr.message}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={(!messageInput.trim() && !pendingImageUrl) || !conversation || sending}
            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[40px] min-h-[40px] hover:scale-105 active:scale-95 disabled:hover:scale-100"
            title="Enviar mensaje (Enter)"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

