-- Tabla de configuración por país para confirmaciones
CREATE TABLE IF NOT EXISTS feedback_confirmation_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code VARCHAR(3) NOT NULL UNIQUE,
  
  require_confirmation BOOLEAN DEFAULT true,
  confirmation_timeout_minutes INT DEFAULT 30,
  
  min_accuracy_for_auto FLOAT DEFAULT 90.0,
  min_transactions_for_auto INT DEFAULT 1000,
  
  total_transactions INT DEFAULT 0,
  confirmed_correct INT DEFAULT 0,
  accuracy FLOAT DEFAULT 0,
  
  is_auto_enabled BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO feedback_confirmation_config (country_code, require_confirmation)
VALUES 
  ('BOL', true), ('MEX', true), ('ARG', true),
  ('CHL', true), ('PER', true), ('COL', true),
  ('URY', true)
ON CONFLICT (country_code) DO NOTHING;

CREATE INDEX idx_config_status
ON feedback_confirmation_config(country_code, require_confirmation, accuracy);

COMMENT ON TABLE feedback_confirmation_config IS 'Configuración de confirmaciones por país';
COMMENT ON COLUMN feedback_confirmation_config.require_confirmation IS 'Si requiere confirmación manual o es automático';
COMMENT ON COLUMN feedback_confirmation_config.confirmation_timeout_minutes IS 'Tiempo de espera antes de auto-confirmar';



