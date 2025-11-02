-- Tabla para gestionar confirmaciones pendientes de WhatsApp
CREATE TABLE IF NOT EXISTS pending_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES predicciones_groq(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL,
  country_code VARCHAR(3) NOT NULL,
  wa_message_id VARCHAR(255),
  
  expires_at TIMESTAMP NOT NULL,
  confirmed BOOLEAN,
  confirmed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pending_confirmations_expires
ON pending_confirmations(expires_at, confirmed)
WHERE confirmed IS NULL;

CREATE INDEX idx_pending_confirmations_prediction
ON pending_confirmations(prediction_id);

CREATE INDEX idx_pending_confirmations_usuario
ON pending_confirmations(usuario_id, created_at DESC);

COMMENT ON TABLE pending_confirmations IS 'Transacciones pendientes de confirmación en WhatsApp';
COMMENT ON COLUMN pending_confirmations.expires_at IS 'Cuándo se auto-confirma si no hay respuesta';
COMMENT ON COLUMN pending_confirmations.confirmed IS 'NULL=pending, true=confirmed, false=cancelled';

