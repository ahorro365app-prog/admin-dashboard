-- Tabla para almacenar agregados mensuales
CREATE TABLE IF NOT EXISTS feedback_metrics_monthly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code VARCHAR(3) NOT NULL,
  year_month DATE NOT NULL,
  total_predicciones INT DEFAULT 0,
  confirmadas INT DEFAULT 0,
  rechazadas INT DEFAULT 0,
  accuracy FLOAT DEFAULT 0,
  top_categorias JSONB,
  top_monedas JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(country_code, year_month)
);

CREATE INDEX IF NOT EXISTS idx_metrics_pais_fecha 
ON feedback_metrics_monthly(country_code, year_month DESC);

COMMENT ON TABLE feedback_metrics_monthly IS 'Agregados mensuales de predicciones por país';


