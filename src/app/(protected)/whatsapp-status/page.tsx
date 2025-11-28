"use client";

import { useState, useEffect, useCallback } from 'react';
import StatusCard from '@/components/WhatsApp/StatusCard';
import MetricsCard from '@/components/WhatsApp/MetricsCard';
import EventsLog from '@/components/WhatsApp/EventsLog';
import QRScanner from '@/components/WhatsApp/QRScanner';
import TransactionsPanel from '@/components/WhatsApp/TransactionsPanel';
import ChatPanel from '@/components/WhatsApp/ChatPanel';

// Tipo para los tabs
type TabId = 'transactions' | 'chat' | 'metrics';

// Clave para localStorage
const STORAGE_KEY = 'whatsapp_status_active_tab';

// Función para obtener el tab inicial desde localStorage o usar 'transactions' por defecto
const getInitialTab = (): TabId => {
  if (typeof window === 'undefined') return 'transactions';
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && ['transactions', 'chat', 'metrics'].includes(saved)) {
    return saved as TabId;
  }
  return 'transactions';
};

export default function WhatsAppStatusPage() {
  // Estado para el tab activo
  const [activeTab, setActiveTab] = useState<TabId>(getInitialTab);

  // Persistencia - Guardar tab en localStorage cuando cambia
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, activeTab);
  }, [activeTab]);

  // Handler para cambiar de tab
  const handleTabChange = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
  }, []);

  // Definición de tabs
  const tabs: Array<{ id: TabId; label: string; icon: string; disabled?: boolean }> = [
    { id: 'transactions', label: 'Transacciones', icon: '💳' },
    { id: 'chat', label: 'Chat', icon: '💬', disabled: true }, // Deshabilitado hasta Fase 2
    { id: 'metrics', label: 'Métricas', icon: '📊' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">WhatsApp Status</h1>
        <span className="text-sm text-gray-500">Panel de gestión de WhatsApp</span>
      </div>

      {/* Tabs de navegación */}
      <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && handleTabChange(tab.id)}
              disabled={tab.disabled}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 sm:px-5 sm:py-3 text-sm font-semibold transition-all duration-300 ease-in-out transform ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 scale-105 hover:scale-110'
                  : tab.disabled
                  ? 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-50'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 hover:border-purple-300 hover:shadow-md hover:scale-105'
              }`}
              aria-pressed={activeTab === tab.id}
              aria-label={`Cambiar a ${tab.label}`}
              aria-disabled={tab.disabled}
            >
              <span className="text-base sm:text-lg transition-transform duration-300">{tab.icon}</span>
              <span className="whitespace-nowrap">{tab.label}</span>
              {tab.disabled && (
                <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
                  Próximamente
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido según tab activo */}
      <div className="animate-fadeIn">
        {activeTab === 'transactions' && <TransactionsPanel />}
        {activeTab === 'chat' && <ChatPanel />}
        {activeTab === 'metrics' && (
          <div className="space-y-6">
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
        )}
      </div>
    </div>
  );
}
