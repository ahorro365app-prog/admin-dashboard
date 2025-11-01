-- ⚠️ EJECUTAR ANTES de 002 (agrega categoria_detectada que 002 necesita indexar)
-- Agregar columnas necesarias para deduplicación
ALTER TABLE predicciones_groq 
ADD COLUMN IF NOT EXISTS wa_message_id VARCHAR(255);

ALTER TABLE predicciones_groq 
ADD COLUMN IF NOT EXISTS mensaje_origen VARCHAR(50) DEFAULT 'app';

ALTER TABLE predicciones_groq 
ADD COLUMN IF NOT EXISTS categoria_detectada VARCHAR(100);

-- Índice ÚNICO parcial para deduplicación
CREATE UNIQUE INDEX IF NOT EXISTS idx_predicciones_wa_message_id 
ON predicciones_groq(wa_message_id) 
WHERE wa_message_id IS NOT NULL;

COMMENT ON COLUMN predicciones_groq.wa_message_id IS 'ID único de mensaje WhatsApp (msg.key.id) para deduplicación';
COMMENT ON COLUMN predicciones_groq.mensaje_origen IS 'Origen: app, whatsapp, web, etc';
COMMENT ON COLUMN predicciones_groq.categoria_detectada IS 'Categoría extraída para búsquedas rápidas (indexed)';


