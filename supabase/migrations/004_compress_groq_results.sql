-- Agregar columna para URL de resultado raw en Storage
ALTER TABLE predicciones_groq 
ADD COLUMN IF NOT EXISTS resultado_raw_url VARCHAR(500);

-- Vista "lite" para consultas rápidas sin JSON gigante
CREATE OR REPLACE VIEW predicciones_groq_lite AS
SELECT 
  id,
  usuario_id,
  country_code,
  transcripcion,
  categoria_detectada,
  (resultado->>'monto')::FLOAT as monto,
  (resultado->>'moneda') as moneda,
  confirmado,
  created_at,
  wa_message_id,
  mensaje_origen
FROM predicciones_groq
WHERE resultado IS NOT NULL;

COMMENT ON COLUMN predicciones_groq.resultado_raw_url IS 'URL en Storage del JSON completo (migración futura)';
COMMENT ON VIEW predicciones_groq_lite IS 'Vista optimizada sin JSON para queries rápidas';


