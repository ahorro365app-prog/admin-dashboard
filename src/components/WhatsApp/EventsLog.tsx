'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface Event {
  id: string;
  timestamp: string;
  type: string;
  phone: string;
  status: string;
  message: string;
}

export default function EventsLog() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/whatsapp/events?limit=20');
        const data = await res.json();
        setEvents(data);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 15000); // Cada 15 segundos
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="animate-pulse text-gray-500">Cargando eventos...</div>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Últimos Eventos</h3>
        <div className="text-center py-8 text-gray-500">
          No hay eventos registrados
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold">Últimos Eventos</h3>
      </div>

      <div className="divide-y max-h-96 overflow-y-auto">
        {events.map((event) => (
          <div key={event.id} className="p-4 flex gap-4 hover:bg-gray-50 transition-colors">
            {/* Icon */}
            <div className="flex-shrink-0">
              {event.status === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">{event.type}</span>
                <span className="text-xs text-gray-500">
                  {new Date(event.timestamp).toLocaleTimeString('es-ES')}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{event.message}</p>
              {event.phone && (
                <p className="text-xs text-gray-400 mt-1">{event.phone}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
