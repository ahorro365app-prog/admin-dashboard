'use client';

import { useState, useEffect } from 'react';
import { X, Tag, Plus } from 'lucide-react';

interface Label {
  id: string;
  name: string;
  color: string;
  description?: string;
  assigned_at?: string;
}

interface ConversationLabelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: string;
  onLabelsUpdated?: () => void;
}

export default function ConversationLabelsModal({
  isOpen,
  onClose,
  phoneNumber,
  onLabelsUpdated
}: ConversationLabelsModalProps) {
  const [allLabels, setAllLabels] = useState<Label[]>([]);
  const [assignedLabels, setAssignedLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar etiquetas y etiquetas asignadas
  useEffect(() => {
    if (isOpen && phoneNumber) {
      fetchData();
    }
  }, [isOpen, phoneNumber]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar todas las etiquetas
      const labelsResponse = await fetch('/api/whatsapp/support/labels');
      const labelsData = await labelsResponse.json();
      if (labelsData.success) {
        setAllLabels(labelsData.data || []);
      }

      // Cargar etiquetas asignadas a esta conversación
      const encodedPhone = encodeURIComponent(phoneNumber);
      const assignedResponse = await fetch(`/api/whatsapp/support/conversations/${encodedPhone}/labels`);
      const assignedData = await assignedResponse.json();
      if (assignedData.success) {
        setAssignedLabels(assignedData.data || []);
      }
    } catch (error: any) {
      setError(error.message || 'Error al cargar etiquetas');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignLabel = async (labelId: string) => {
    try {
      setError(null);
      const encodedPhone = encodeURIComponent(phoneNumber);
      const response = await fetch(`/api/whatsapp/support/conversations/${encodedPhone}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label_id: labelId })
      });

      const data = await response.json();
      if (data.success) {
        fetchData(); // Recargar
        if (onLabelsUpdated) onLabelsUpdated();
      } else {
        setError(data.error || 'Error al asignar etiqueta');
      }
    } catch (error: any) {
      setError(error.message || 'Error al asignar etiqueta');
    }
  };

  const handleRemoveLabel = async (labelId: string) => {
    try {
      setError(null);
      const encodedPhone = encodeURIComponent(phoneNumber);
      const response = await fetch(`/api/whatsapp/support/conversations/${encodedPhone}/labels/${labelId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        fetchData(); // Recargar
        if (onLabelsUpdated) onLabelsUpdated();
      } else {
        setError(data.error || 'Error al quitar etiqueta');
      }
    } catch (error: any) {
      setError(error.message || 'Error al quitar etiqueta');
    }
  };

  const assignedLabelIds = new Set(assignedLabels.map(l => l.id));
  const availableLabels = allLabels.filter(l => !assignedLabelIds.has(l.id));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Tag className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Etiquetas</h2>
              <p className="text-sm text-gray-500">{phoneNumber}</p>
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
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
              <p className="text-sm">Cargando...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Etiquetas asignadas */}
              {assignedLabels.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Etiquetas asignadas</h3>
                  <div className="space-y-2">
                    {assignedLabels.map((label) => (
                      <div
                        key={label.id}
                        className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: label.color }}
                          />
                          <span className="text-sm font-medium text-gray-900">{label.name}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveLabel(label.id)}
                          className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                        >
                          Quitar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Etiquetas disponibles */}
              {availableLabels.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    {assignedLabels.length > 0 ? 'Agregar etiqueta' : 'Etiquetas disponibles'}
                  </h3>
                  <div className="space-y-2">
                    {availableLabels.map((label) => (
                      <button
                        key={label.id}
                        onClick={() => handleAssignLabel(label.id)}
                        className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: label.color }}
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">{label.name}</span>
                          {label.description && (
                            <p className="text-xs text-gray-500">{label.description}</p>
                          )}
                        </div>
                        <Plus className="w-4 h-4 text-gray-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {assignedLabels.length === 0 && availableLabels.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Tag className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No hay etiquetas disponibles</p>
                  <p className="text-xs mt-1 text-gray-400">
                    Crea etiquetas desde el menú de gestión
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

