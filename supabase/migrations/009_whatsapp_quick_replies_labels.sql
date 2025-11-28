-- Migración: Respuestas Rápidas y Etiquetas para WhatsApp Soporte
-- Fecha: 2024
-- Descripción: Crea tablas para respuestas rápidas (comandos con "/") y etiquetas por colores

-- Tabla de respuestas rápidas
CREATE TABLE IF NOT EXISTS whatsapp_quick_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  command TEXT NOT NULL UNIQUE, -- Ej: "saludo", "despedida", "horarios"
  message TEXT NOT NULL, -- Mensaje completo que se insertará
  description TEXT, -- Descripción opcional de cuándo usar esta respuesta
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de etiquetas (labels)
CREATE TABLE IF NOT EXISTS whatsapp_labels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, -- Nombre de la etiqueta: "Urgente", "Pendiente", etc.
  color TEXT NOT NULL, -- Color en formato hex: #FF5733
  description TEXT, -- Descripción opcional
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de relación: conversaciones con etiquetas (muchos a muchos)
CREATE TABLE IF NOT EXISTS whatsapp_conversation_labels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  label_id UUID REFERENCES whatsapp_labels(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, label_id) -- Una conversación no puede tener la misma etiqueta dos veces
);

-- Agregar columna de notas internas a conversaciones (preparación para futuro)
ALTER TABLE whatsapp_conversations 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_whatsapp_quick_replies_command ON whatsapp_quick_replies(command);
CREATE INDEX IF NOT EXISTS idx_whatsapp_labels_name ON whatsapp_labels(name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversation_labels_conversation ON whatsapp_conversation_labels(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversation_labels_label ON whatsapp_conversation_labels(label_id);

-- Comentarios para documentación
COMMENT ON TABLE whatsapp_quick_replies IS 'Almacena respuestas rápidas para usar con comandos "/" en el chat';
COMMENT ON TABLE whatsapp_labels IS 'Almacena etiquetas de colores para organizar conversaciones';
COMMENT ON TABLE whatsapp_conversation_labels IS 'Relación muchos a muchos entre conversaciones y etiquetas';
COMMENT ON COLUMN whatsapp_quick_replies.command IS 'Comando único para activar la respuesta (ej: "saludo")';
COMMENT ON COLUMN whatsapp_quick_replies.message IS 'Mensaje completo que se insertará cuando se use el comando';
COMMENT ON COLUMN whatsapp_labels.color IS 'Color de la etiqueta en formato hexadecimal (ej: #FF5733)';
COMMENT ON COLUMN whatsapp_conversations.notes IS 'Notas internas de los agentes sobre la conversación';

-- Datos de ejemplo (opcional, se pueden eliminar después)
INSERT INTO whatsapp_quick_replies (command, message, description) VALUES
  ('saludo', 'Hola, ¿en qué puedo ayudarte?', 'Saludo inicial estándar'),
  ('despedida', 'Gracias por contactarnos. ¡Que tengas un buen día!', 'Despedida estándar'),
  ('horarios', 'Nuestro horario de atención es de lunes a viernes de 9:00 AM a 6:00 PM.', 'Información de horarios')
ON CONFLICT (command) DO NOTHING;

INSERT INTO whatsapp_labels (name, color, description) VALUES
  ('Urgente', '#EF4444', 'Requiere atención inmediata'),
  ('Pendiente', '#F97316', 'Pendiente de seguimiento'),
  ('En Seguimiento', '#EAB308', 'Seguimiento activo'),
  ('Resuelto', '#22C55E', 'Problema resuelto'),
  ('Información', '#3B82F6', 'Solo información'),
  ('VIP', '#A855F7', 'Cliente VIP'),
  ('Archivado', '#6B7280', 'Conversación archivada')
ON CONFLICT DO NOTHING;

