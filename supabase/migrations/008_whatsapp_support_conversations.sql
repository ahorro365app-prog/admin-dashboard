-- Migración: Tablas para WhatsApp Soporte con Coexistencia
-- Fecha: 2024
-- Descripción: Crea tablas para almacenar conversaciones y mensajes del número de soporte

-- Tabla de conversaciones de WhatsApp Soporte
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE,
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(phone_number)
);

-- Tabla de mensajes de WhatsApp Soporte
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  wa_message_id TEXT UNIQUE, -- ID del mensaje de WhatsApp (para deduplicación)
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'audio', 'document', 'video')),
  content TEXT, -- Contenido del mensaje
  media_url TEXT, -- URL de media si aplica
  status TEXT, -- 'sent', 'delivered', 'read', 'failed', 'pending'
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL, -- Timestamp del mensaje original
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(wa_message_id)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone ON whatsapp_conversations(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_last_message ON whatsapp_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_unread ON whatsapp_conversations(unread_count);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation ON whatsapp_messages(conversation_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone ON whatsapp_messages(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_wa_id ON whatsapp_messages(wa_message_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_direction ON whatsapp_messages(direction);

-- Comentarios para documentación
COMMENT ON TABLE whatsapp_conversations IS 'Almacena conversaciones del número de WhatsApp para soporte';
COMMENT ON TABLE whatsapp_messages IS 'Almacena mensajes individuales de las conversaciones de soporte';
COMMENT ON COLUMN whatsapp_conversations.phone_number IS 'Número de teléfono del usuario/cliente (formato: 59176990076)';
COMMENT ON COLUMN whatsapp_messages.wa_message_id IS 'ID único del mensaje de WhatsApp para deduplicación';
COMMENT ON COLUMN whatsapp_messages.direction IS 'Dirección: inbound (entrante) o outbound (saliente)';
COMMENT ON COLUMN whatsapp_messages.status IS 'Estado del mensaje: sent, delivered, read, failed, pending';

