"use client";

import StatusCard from '@/components/WhatsApp/StatusCard';
import MetricsCard from '@/components/WhatsApp/MetricsCard';
import EventsLog from '@/components/WhatsApp/EventsLog';
import QRScanner from '@/components/WhatsApp/QRScanner';

export default function WhatsAppStatusPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">WhatsApp Status</h1>
        <span className="text-sm text-gray-500">Actualización: cada 15-30 seg</span>
      </div>

      {/* QR Scanner / Connection Status */}
      <QRScanner />

      {/* Status Card */}
      <StatusCard />

      {/* Metrics Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Métricas de Hoy</h2>
        <MetricsCard />
      </div>

      {/* Events Log */}
      <EventsLog />
    </div>
  );
}
