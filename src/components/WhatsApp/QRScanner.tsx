'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface QRData {
  qr: string | null;
  connected: boolean;
  timestamp: number | null;
}

export default function QRScanner() {
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchQR = async () => {
    try {
      const res = await fetch('/api/whatsapp/qr');
      const data = await res.json();
      setQrData(data);
    } catch (error) {
      console.error('Failed to fetch QR:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQR();
    const interval = setInterval(fetchQR, 3000); // Poll cada 3 segundos
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Cargando QR...</span>
        </div>
      </div>
    );
  }

  if (qrData?.connected) {
    return (
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-green-600 mb-2">WhatsApp Conectado</h3>
          <p className="text-gray-500">Tu dispositivo está vinculado y listo para recibir mensajes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-4">Conectar WhatsApp</h3>
        
        {qrData?.qr ? (
          <>
            <div className="flex justify-center mb-4">
              <img 
                src={qrData.qr} 
                alt="QR Code" 
                className="w-64 h-64 border-2 border-gray-200 rounded-lg p-4"
              />
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p>1. Abre WhatsApp Business en tu teléfono</p>
              <p>2. Ve a Configuración → Dispositivos vinculados</p>
              <p>3. Toca "Vincular dispositivo"</p>
              <p>4. Escanea este código QR con tu cámara</p>
            </div>
          </>
        ) : (
          <div className="py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-500">Generando código QR...</p>
          </div>
        )}
      </div>
    </div>
  );
}

