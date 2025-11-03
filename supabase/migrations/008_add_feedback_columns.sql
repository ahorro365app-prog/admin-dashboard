-- Agregar columnas para tracking de origen y confiabilidad del feedback

-- predicciones_groq: tracking de cómo se confirmó
ALTER TABLE predicciones_groq
ADD COLUMN IF NOT EXISTS confirmado_por VARCHAR(50);

COMMENT ON COLUMN predicciones_groq.confirmado_por IS 'Origen: whatsapp_reaction, app_edit, timeout, manual';
COMMENT ON COLUMN predicciones_groq.categoria_detectada IS 'Categoría extraída para búsquedas rápidas (indexed) - Ya existe desde 003';

-- feedback_usuarios: tracking de origen y peso
ALTER TABLE feedback_usuarios
ADD COLUMN IF NOT EXISTS origen VARCHAR(50);

ALTER TABLE feedback_usuarios
ADD COLUMN IF NOT EXISTS confiabilidad FLOAT DEFAULT 1.0;

CREATE INDEX IF NOT EXISTS idx_predicciones_confirmado_por
ON predicciones_groq(confirmado_por, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_origen_confiabilidad
ON feedback_usuarios(origen, confiabilidad, country_code, created_at DESC);

COMMENT ON COLUMN feedback_usuarios.origen IS 'Origen: whatsapp_reaction (1.0), app_edit (2.0), manual (1.5)';
COMMENT ON COLUMN feedback_usuarios.confiabilidad IS 'Peso para accuracy ponderado: 1.0=normal, 2.0=máximo (edición app)';



