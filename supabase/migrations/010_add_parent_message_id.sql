-- Agregar parent_message_id para agrupar transacciones del mismo mensaje
-- Permite identificar múltiples predicciones que vienen de un solo mensaje WhatsApp

ALTER TABLE predicciones_groq
ADD COLUMN IF NOT EXISTS parent_message_id VARCHAR(255);

ALTER TABLE pending_confirmations
ADD COLUMN IF NOT EXISTS parent_message_id VARCHAR(255);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_parent_message_id 
ON predicciones_groq(parent_message_id);

CREATE INDEX IF NOT EXISTS idx_pending_parent_message 
ON pending_confirmations(parent_message_id);

-- Comentarios para documentación
COMMENT ON COLUMN predicciones_groq.parent_message_id 
IS 'ID del mensaje WhatsApp original que generó estas predicciones (para agrupar múltiples TX)';

COMMENT ON COLUMN pending_confirmations.parent_message_id 
IS 'ID del mensaje WhatsApp original que generó esta confirmación (para agrupar múltiples TX)';

