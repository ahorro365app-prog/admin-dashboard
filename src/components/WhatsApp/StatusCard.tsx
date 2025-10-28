'use client';

import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, X } from 'lucide-react';

interface StatusData {
  status: 'connected' | 'disconnected';
  uptime: number;
  number: string;
  lastSync: string;
}

export default function StatusCard() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/status');
      const data = await res.json();
      setData(data);
    } catch (error) {
      console.error('Failed to fetch status:', error);
    } finally {
      setLoading(false);
    }
  };

  const [disconnecting, setDisconnecting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleReconnect = async () => {
    setReconnecting(true);
    try {
      const res = await fetch('/api/whatsapp/status', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reconnect' })
      });
      const result = await res.json();
      alert(result.message || 'Reconectando...');
      setTimeout(() => fetchStatus(), 5000);
    } catch (error) {
      alert('Reconnection failed');
    } finally {
      setReconnecting(false);
    }
  };

  const handleDisconnectClick = () => {
    setShowConfirmDialog(true);
  };

  const handleDisconnectConfirm = async () => {
    setShowConfirmDialog(false);
    setDisconnecting(true);
    try {
      const res = await fetch('/api/whatsapp/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' })
      });
      
      const result = await res.json();
      
      if (result.success) {
        alert('Desconectado exitosamente. Por favor, reinicia el Baileys Worker para generar un nuevo QR.');
        // Recargar la página después de 2 segundos
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        alert('Error al desconectar: ' + result.error);
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      alert('Error al desconectar');
    } finally {
      setDisconnecting(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-gray-500">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-600">Cargando...</span>
        </div>
      </div>
    );
  }

  const isConnected = data?.status === 'connected';

  return (
    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
      <h3 className="text-lg font-semibold mb-4">Estado de Baileys</h3>
      
      <div className="space-y-4">
        {/* Status Indicator */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Estado:</span>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className={`font-semibold ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>

        {/* Uptime */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Uptime:</span>
          <span className="font-semibold">{data?.uptime.toFixed(1)}%</span>
        </div>

        {/* Number */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Número:</span>
          <span className="font-mono text-sm">{data?.number || 'N/A'}</span>
        </div>

        {/* Last Sync */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Última sincronización:</span>
          <span className="text-sm">
            {data?.lastSync 
              ? new Date(data.lastSync).toLocaleTimeString('es-ES')
              : 'N/A'
            }
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={handleReconnect}
            disabled={reconnecting || disconnecting}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-2 rounded flex items-center justify-center gap-2 transition-colors"
          >
            {reconnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Reconectando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Reconectar
              </>
            )}
          </button>
          
          <button
            onClick={handleDisconnectClick}
            disabled={!isConnected || reconnecting || disconnecting}
            className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-semibold py-2 rounded flex items-center justify-center gap-2 transition-colors"
          >
            {disconnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Desconectando...
              </>
            ) : (
              <>
                Desconectar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Confirmación Modal */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">¿Desconectar de WhatsApp?</h3>
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                Se cerrará la sesión actual de WhatsApp.
              </p>
              <p className="text-gray-600">
                Necesitarás escanear el QR nuevamente para reconectar.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDisconnectConfirm}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded transition-colors"
              >
                Desconectar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
