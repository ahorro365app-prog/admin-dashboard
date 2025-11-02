ALTER TABLE predicciones_groq
ADD COLUMN IF NOT EXISTS original_timestamp TIMESTAMP DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_predictions_original_timestamp
ON predicciones_groq(original_timestamp DESC);

COMMENT ON COLUMN predicciones_groq.original_timestamp IS 'Hora exacta cuando usuario envió la transacción (no cambia)';

