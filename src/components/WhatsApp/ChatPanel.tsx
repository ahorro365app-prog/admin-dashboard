'use client';

import { MessageCircle } from 'lucide-react';

/**
 * Panel de Chat de WhatsApp
 * 
 * Este componente mostrará la interfaz de chat similar a WhatsApp Web.
 * Por ahora es un placeholder que se implementará en la Fase 2 (Híbrida).
 */
export default function ChatPanel() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Chat de WhatsApp</h2>
          <p className="text-sm text-gray-500">Conversaciones y mensajes de WhatsApp</p>
        </div>
      </div>

      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
          <MessageCircle className="w-8 h-8 text-blue-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Chat (Próximamente)
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          La funcionalidad de chat se implementará en la Fase 2, cuando conviertamos este panel en híbrido.
          Por ahora, enfocamos en el panel de transacciones.
        </p>
      </div>
    </div>
  );
}


