'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Smile } from 'lucide-react';

// Lazy load del picker de emojis para optimizar bundle
const EmojiPickerComponent = dynamic(
  () => import('emoji-picker-react'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-[350px] h-[400px] flex items-center justify-center bg-white rounded-lg border border-gray-200">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    )
  }
);

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  isOpen: boolean;
  onClose: () => void;
  position?: 'top' | 'bottom';
  align?: 'left' | 'right';
}

export default function EmojiPicker({
  onEmojiSelect,
  isOpen,
  onClose,
  position = 'bottom',
  align = 'left'
}: EmojiPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);

  // Cerrar picker al hacer clic fuera
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Agregar listener después de un pequeño delay para evitar cerrar inmediatamente
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={pickerRef}
      className={`absolute z-50 ${
        position === 'top' ? 'bottom-full mb-4' : 'top-full mt-2'
      } ${align === 'right' ? 'right-0' : 'left-0'} animate-fadeIn`}
    >
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
        <EmojiPickerComponent
          onEmojiClick={(emojiData) => {
            onEmojiSelect(emojiData.emoji);
            onClose();
          }}
          theme="light"
          width={350}
          height={400}
          previewConfig={{
            showPreview: false
          }}
          searchDisabled={false}
          skinTonesDisabled={false}
        />
      </div>
    </div>
  );
}

// Botón de emoji reutilizable
interface EmojiButtonProps {
  onClick: () => void;
  isActive?: boolean;
  className?: string;
}

export function EmojiButton({ onClick, isActive = false, className = '' }: EmojiButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 
        rounded-lg transition-colors flex items-center justify-center
        ${isActive ? 'bg-green-50 text-green-600' : ''}
        ${className}
      `}
      title="Insertar emoji (Ctrl+E)"
    >
      <Smile className="w-5 h-5" />
    </button>
  );
}

