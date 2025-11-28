'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Tag } from 'lucide-react';

interface Label {
  id: string;
  name: string;
  color: string;
  description?: string;
}

interface LabelManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLabelCreated?: () => void;
  onLabelUpdated?: () => void;
  onLabelDeleted?: () => void;
}

export default function LabelManagerModal({
  isOpen,
  onClose,
  onLabelCreated,
  onLabelUpdated,
  onLabelDeleted
}: LabelManagerModalProps) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    description: ''
  });
  const [error, setError] = useState<string | null>(null);

  // Colores predefinidos
  const predefinedColors = [
    '#EF4444', // Rojo
    '#F97316', // Naranja
    '#EAB308', // Amarillo
    '#22C55E', // Verde
    '#3B82F6', // Azul
    '#A855F7', // Púrpura
    '#6B7280', // Gris
  ];

  // Cargar etiquetas
  useEffect(() => {
    if (isOpen) {
      fetchLabels();
    }
  }, [isOpen]);

  // Cerrar modal con tecla Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Solo cerrar si no hay formulario abierto
        if (!showCreateForm && !editingLabel) {
          onClose();
        } else {
          // Si hay formulario abierto, cancelar el formulario primero
          setEditingLabel(null);
          setFormData({ name: '', color: '#3B82F6', description: '' });
          setShowCreateForm(false);
          setError(null);
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, showCreateForm, editingLabel, onClose]);

  const fetchLabels = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/whatsapp/support/labels');
      const data = await response.json();
      if (data.success) {
        setLabels(data.data || []);
      }
    } catch (error) {
      console.error('❌ Error cargando etiquetas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    try {
      setError(null);
      const response = await fetch('/api/whatsapp/support/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          color: formData.color,
          description: formData.description.trim() || null
        })
      });

      const data = await response.json();
      if (data.success) {
        setFormData({ name: '', color: '#3B82F6', description: '' });
        setShowCreateForm(false);
        fetchLabels();
        if (onLabelCreated) onLabelCreated();
      } else {
        setError(data.error || 'Error al crear etiqueta');
      }
    } catch (error: any) {
      setError(error.message || 'Error al crear etiqueta');
    }
  };

  const handleUpdate = async () => {
    if (!editingLabel || !formData.name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/whatsapp/support/labels/${editingLabel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          color: formData.color,
          description: formData.description.trim() || null
        })
      });

      const data = await response.json();
      if (data.success) {
        setEditingLabel(null);
        setFormData({ name: '', color: '#3B82F6', description: '' });
        fetchLabels();
        if (onLabelUpdated) onLabelUpdated();
      } else {
        setError(data.error || 'Error al actualizar etiqueta');
      }
    } catch (error: any) {
      setError(error.message || 'Error al actualizar etiqueta');
    }
  };

  const handleDelete = async (labelId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta etiqueta? Se quitará de todas las conversaciones.')) {
      return;
    }

    try {
      const response = await fetch(`/api/whatsapp/support/labels/${labelId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        fetchLabels();
        if (onLabelDeleted) onLabelDeleted();
      } else {
        alert(data.error || 'Error al eliminar etiqueta');
      }
    } catch (error: any) {
      alert(error.message || 'Error al eliminar etiqueta');
    }
  };

  const startEdit = (label: Label) => {
    setEditingLabel(label);
    setFormData({
      name: label.name,
      color: label.color,
      description: label.description || ''
    });
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingLabel(null);
    setFormData({ name: '', color: '#3B82F6', description: '' });
    setShowCreateForm(false);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Tag className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Gestionar Etiquetas</h2>
              <p className="text-sm text-gray-500">Crea y organiza etiquetas para tus conversaciones</p>
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
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Formulario de crear/editar */}
          {(showCreateForm || editingLabel) && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                {editingLabel ? 'Editar Etiqueta' : 'Nueva Etiqueta'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Urgente, Pendiente..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <div className="flex gap-2">
                      {predefinedColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData({ ...formData, color })}
                          className={`w-8 h-8 rounded border-2 ${
                            formData.color === color ? 'border-gray-900' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ej: Requiere atención inmediata"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={editingLabel ? handleUpdate : handleCreate}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    {editingLabel ? 'Actualizar' : 'Crear'}
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
          {!showCreateForm && !editingLabel && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="mb-4 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva Etiqueta
            </button>
          )}

          {/* Lista de etiquetas */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
              <p className="text-sm">Cargando etiquetas...</p>
            </div>
          ) : labels.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Tag className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No hay etiquetas creadas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {labels.map((label) => (
                <div
                  key={label.id}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{label.name}</p>
                      {label.description && (
                        <p className="text-xs text-gray-500">{label.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(label)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(label.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
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

