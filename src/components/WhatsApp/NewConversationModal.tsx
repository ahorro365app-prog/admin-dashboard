'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Phone, AlertCircle } from 'lucide-react';

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (phoneNumber: string) => void;
}

export default function NewConversationModal({
  isOpen,
  onClose,
  onConfirm
}: NewConversationModalProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus en input cuando se abre el modal
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Limpiar estado al cerrar
  useEffect(() => {
    if (!isOpen) {
      setPhoneNumber('');
      setError(null);
    }
  }, [isOpen]);

  // Validar número de teléfono
  const validatePhoneNumber = (phone: string): boolean => {
    // Remover espacios, guiones, paréntesis y +
    const cleaned = phone.replace(/[\s\-+()]/g, '');
    
    // Debe tener entre 8 y 15 dígitos
    if (cleaned.length < 8 || cleaned.length > 15) {
      return false;
    }
    
    // Debe contener solo números
    if (!/^\d+$/.test(cleaned)) {
      return false;
    }
    
    return true;
  };

  // Formatear número mientras se escribe
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Permitir solo números, espacios, guiones, paréntesis y +
    const cleaned = value.replace(/[^\d\s\-+()]/g, '');
    setPhoneNumber(cleaned);
    setError(null);
  };

  // Handler para confirmar
  const handleConfirm = () => {
    if (!phoneNumber.trim()) {
      setError('Por favor ingresa un número de teléfono');
      return;
    }

    const cleaned = phoneNumber.replace(/[\s\-+()]/g, '');
    
    if (!validatePhoneNumber(cleaned)) {
      setError('Número de teléfono inválido. Debe tener entre 8 y 15 dígitos.');
      return;
    }

    onConfirm(cleaned);
    onClose();
  };

  // Handler para Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Phone className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Nueva Conversación</h2>
              <p className="text-sm text-gray-500">Inicia un chat con un número nuevo</p>
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
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="phone-input" className="block text-sm font-medium text-gray-700 mb-2">
                Número de Teléfono
              </label>
              <input
                ref={inputRef}
                id="phone-input"
                type="text"
                value={phoneNumber}
                onChange={handlePhoneChange}
                onKeyDown={handleKeyDown}
                placeholder="Ej: 59176990076 o +591 76990076"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                autoComplete="off"
              />
              <p className="mt-1 text-xs text-gray-500">
                Formato: código de país + número (sin espacios ni guiones)
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>Nota:</strong> La conversación se creará automáticamente cuando envíes el primer mensaje.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!phoneNumber.trim() || !!error}
            className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Iniciar Conversación
          </button>
        </div>
      </div>
    </div>
  );
}

