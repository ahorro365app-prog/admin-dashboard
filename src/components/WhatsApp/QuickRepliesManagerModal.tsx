'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Plus, Edit2, Trash2, MessageSquare, Image as ImageIcon, XCircle } from 'lucide-react';
import EmojiPicker, { EmojiButton } from './EmojiPicker';

interface QuickReply {
  id: string;
  command: string;
  message: string;
  description?: string;
  image_url?: string;
}

interface QuickRepliesManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuickReplyCreated?: () => void;
  onQuickReplyUpdated?: () => void;
  onQuickReplyDeleted?: () => void;
}

export default function QuickRepliesManagerModal({
  isOpen,
  onClose,
  onQuickReplyCreated,
  onQuickReplyUpdated,
  onQuickReplyDeleted
}: QuickRepliesManagerModalProps) {
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingQuickReply, setEditingQuickReply] = useState<QuickReply | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    command: '',
    message: '',
    description: '',
    image_url: ''
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Cargar respuestas rápidas
  useEffect(() => {
    if (isOpen) {
      fetchQuickReplies();
    }
  }, [isOpen]);

  // Cerrar modal con tecla Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Solo cerrar si no hay formulario abierto
        if (!showCreateForm && !editingQuickReply) {
          onClose();
        } else {
          // Si hay formulario abierto, cancelar el formulario primero
          setEditingQuickReply(null);
          setFormData({ command: '', message: '', description: '', image_url: '' });
          setImagePreview(null);
          setShowCreateForm(false);
          setError(null);
          setShowEmojiPicker(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, showCreateForm, editingQuickReply, onClose]);

  const fetchQuickReplies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/whatsapp/support/quick-replies');
      const data = await response.json();
      if (data.success) {
        setQuickReplies(data.data || []);
      }
    } catch (error) {
      console.error('❌ Error cargando respuestas rápidas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede ser mayor a 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      setError(null);

      const formDataToSend = new FormData();
      formDataToSend.append('file', file);

      const response = await fetch('/api/whatsapp/support/quick-replies/upload-image', {
        method: 'POST',
        body: formDataToSend
      });

      const data = await response.json();
      if (data.success) {
        setFormData({ ...formData, image_url: data.url });
        setImagePreview(data.url);
      } else {
        setError(data.error || 'Error al subir imagen');
      }
    } catch (error: any) {
      setError(error.message || 'Error al subir imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageRemove = () => {
    setFormData({ ...formData, image_url: '' });
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreate = async () => {
    if (!formData.command.trim()) {
      setError('El comando es requerido');
      return;
    }

    if (!formData.message.trim() && !formData.image_url.trim()) {
      setError('El mensaje o la imagen es requerida');
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);
      setSaving(true);
      
      const response = await fetch('/api/whatsapp/support/quick-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: formData.command.trim(),
          message: formData.message.trim(),
          description: formData.description.trim() || null,
          image_url: formData.image_url.trim() || null
        })
      });

      const data = await response.json();
      if (data.success) {
        setFormData({ command: '', message: '', description: '', image_url: '' });
        setImagePreview(null);
        setShowCreateForm(false);
        setSuccessMessage('Respuesta rápida creada exitosamente');
        fetchQuickReplies();
        // Notificar a ChatArea para que recargue las respuestas rápidas
        window.dispatchEvent(new CustomEvent('refreshQuickReplies'));
        if (onQuickReplyCreated) onQuickReplyCreated();
        
        // Limpiar mensaje de éxito después de 3 segundos
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(data.error || 'Error al crear respuesta rápida');
      }
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('Error de conexión. Verifica tu conexión a internet e intenta nuevamente.');
      } else {
        setError(error.message || 'Error al crear respuesta rápida');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingQuickReply || !formData.command.trim()) {
      setError('El comando es requerido');
      return;
    }

    if (!formData.message.trim() && !formData.image_url.trim()) {
      setError('El mensaje o la imagen es requerida');
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);
      setSaving(true);
      
      const response = await fetch(`/api/whatsapp/support/quick-replies/${editingQuickReply.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: formData.command.trim(),
          message: formData.message.trim(),
          description: formData.description.trim() || null,
          image_url: formData.image_url.trim() || null
        })
      });

      const data = await response.json();
      if (data.success) {
        setEditingQuickReply(null);
        setFormData({ command: '', message: '', description: '', image_url: '' });
        setImagePreview(null);
        setSuccessMessage('Respuesta rápida actualizada exitosamente');
        fetchQuickReplies();
        // Notificar a ChatArea para que recargue las respuestas rápidas
        window.dispatchEvent(new CustomEvent('refreshQuickReplies'));
        if (onQuickReplyUpdated) onQuickReplyUpdated();
        
        // Limpiar mensaje de éxito después de 3 segundos
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(data.error || 'Error al actualizar respuesta rápida');
      }
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('Error de conexión. Verifica tu conexión a internet e intenta nuevamente.');
      } else {
        setError(error.message || 'Error al actualizar respuesta rápida');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (quickReplyId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta respuesta rápida?')) {
      return;
    }

    try {
      setDeleting(quickReplyId);
      setError(null);
      
      const response = await fetch(`/api/whatsapp/support/quick-replies/${quickReplyId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        setSuccessMessage('Respuesta rápida eliminada exitosamente');
        fetchQuickReplies();
        // Notificar a ChatArea para que recargue las respuestas rápidas
        window.dispatchEvent(new CustomEvent('refreshQuickReplies'));
        if (onQuickReplyDeleted) onQuickReplyDeleted();
        
        // Limpiar mensaje de éxito después de 3 segundos
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(data.error || 'Error al eliminar respuesta rápida');
      }
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('Error de conexión. Verifica tu conexión a internet e intenta nuevamente.');
      } else {
        setError(error.message || 'Error al eliminar respuesta rápida');
      }
    } finally {
      setDeleting(null);
    }
  };

  const startEdit = (quickReply: QuickReply) => {
    setEditingQuickReply(quickReply);
    setFormData({
      command: quickReply.command,
      message: quickReply.message,
      description: quickReply.description || '',
      image_url: quickReply.image_url || ''
    });
    setImagePreview(quickReply.image_url || null);
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingQuickReply(null);
    setFormData({ command: '', message: '', description: '', image_url: '' });
    setImagePreview(null);
    setShowCreateForm(false);
    setError(null);
    setShowEmojiPicker(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Gestionar Respuestas Rápidas</h2>
              <p className="text-sm text-gray-500">Crea y organiza respuestas rápidas para usar con "/"</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg animate-fadeIn">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg animate-fadeIn">
              <p className="text-sm text-green-600">{successMessage}</p>
            </div>
          )}

          {/* Formulario de crear/editar */}
          {(showCreateForm || editingQuickReply) && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                {editingQuickReply ? 'Editar Respuesta Rápida' : 'Nueva Respuesta Rápida'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comando <span className="text-gray-500">(ej: saludo, despedida)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">/</span>
                    <input
                      type="text"
                      value={formData.command}
                      onChange={(e) => setFormData({ ...formData, command: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
                      placeholder="saludo"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Se usará como: /{formData.command || 'comando'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mensaje <span className="text-gray-500">(opcional si hay imagen)</span>
                  </label>
                  <div className="relative">
                    <textarea
                      ref={messageTextareaRef}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Escribe el mensaje completo que se insertará (o caption de la imagen)..."
                      rows={4}
                      className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    />
                    {/* Botón de emoji en textarea */}
                    <div className="absolute right-2 bottom-2">
                      <div className="relative">
                        <EmojiButton
                          onClick={() => {
                            setShowEmojiPicker(!showEmojiPicker);
                          }}
                          isActive={showEmojiPicker}
                          className="w-8 h-8"
                        />
                        
                        {/* Picker de emojis */}
                        {showEmojiPicker && (
                          <EmojiPicker
                            onEmojiSelect={(emoji) => {
                              const textarea = messageTextareaRef.current;
                              if (textarea) {
                                const cursorPosition = textarea.selectionStart || formData.message.length;
                                const newMessage = 
                                  formData.message.substring(0, cursorPosition) + 
                                  emoji + 
                                  formData.message.substring(cursorPosition);
                                setFormData({ ...formData, message: newMessage });
                                setShowEmojiPicker(false);
                                
                                // Restaurar cursor después del emoji
                                setTimeout(() => {
                                  if (textarea) {
                                    const newPosition = cursorPosition + emoji.length;
                                    textarea.setSelectionRange(newPosition, newPosition);
                                    textarea.focus();
                                  }
                                }, 0);
                              }
                            }}
                            isOpen={showEmojiPicker}
                            onClose={() => setShowEmojiPicker(false)}
                            position="top"
                            align="right"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.message.length} caracteres
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Imagen <span className="text-gray-500">(opcional)</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file);
                      }
                    }}
                    className="hidden"
                  />
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full max-h-48 object-contain rounded-lg border border-gray-300"
                      />
                      <button
                        onClick={handleImageRemove}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        title="Eliminar imagen"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-green-600 disabled:opacity-50"
                    >
                    {uploadingImage ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                        <span className="text-sm">Subiendo imagen... {uploadProgress > 0 && `${uploadProgress}%`}</span>
                      </>
                    ) : (
                        <>
                          <ImageIcon className="w-5 h-5" />
                          <span className="text-sm">Haz clic para subir una imagen</span>
                        </>
                      )}
                    </button>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Máximo 5MB. Formatos: JPG, PNG, WEBP, GIF
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ej: Saludo inicial estándar"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={editingQuickReply ? handleUpdate : handleCreate}
                    disabled={saving}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {editingQuickReply ? 'Actualizando...' : 'Creando...'}
                      </>
                    ) : (
                      editingQuickReply ? 'Actualizar' : 'Crear'
                    )}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Botón para crear nueva */}
          {!showCreateForm && !editingQuickReply && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="mb-4 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva Respuesta Rápida
            </button>
          )}

          {/* Lista de respuestas rápidas */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
              <p className="text-sm">Cargando respuestas rápidas...</p>
            </div>
          ) : quickReplies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No hay respuestas rápidas creadas</p>
              <p className="text-xs mt-1 text-gray-400">
                Crea una respuesta rápida para usar con el comando "/"
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {quickReplies.map((qr) => (
                <div
                  key={qr.id}
                  className="flex items-start justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-green-600 font-mono text-sm">/{qr.command}</span>
                      {qr.description && (
                        <span className="text-xs text-gray-500">- {qr.description}</span>
                      )}
                    </div>
                    {qr.image_url && (
                      <div className="mb-2">
                        <img
                          src={qr.image_url}
                          alt="Quick reply"
                          className="max-w-xs max-h-32 object-contain rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                    {qr.message && (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                        {qr.message}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => startEdit(qr)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(qr.id)}
                      disabled={deleting === qr.id}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Eliminar"
                    >
                      {deleting === qr.id ? (
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

