-- ⚠️ EJECUTAR DESPUÉS de 003 (que crea categoria_detectada)

-- Índices para invitaciones
CREATE INDEX IF NOT EXISTS idx_invitaciones_telefono_fecha 
ON invitaciones_no_registrados(telefono, created_at DESC);

-- Índices para predicciones_groq
CREATE INDEX IF NOT EXISTS idx_predicciones_usuario_fecha 
ON predicciones_groq(usuario_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_predicciones_confirmado 
ON predicciones_groq(confirmado, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_predicciones_pais_fecha 
ON predicciones_groq(country_code, created_at DESC);

-- ⚠️ SOLO AQUÍ (categoria_detectada viene de 003)
CREATE INDEX IF NOT EXISTS idx_predicciones_categoria 
ON predicciones_groq(categoria_detectada, created_at DESC);

-- Índices para feedback_usuarios
CREATE INDEX IF NOT EXISTS idx_feedback_pais_fecha 
ON feedback_usuarios(country_code, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_usuario_id 
ON feedback_usuarios(usuario_id, created_at DESC);

-- Índices para usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_telefono 
ON usuarios(telefono);

CREATE INDEX IF NOT EXISTS idx_usuarios_country_code 
ON usuarios(country_code);

COMMENT ON INDEX idx_predicciones_usuario_fecha IS 'Queries rápidas por usuario y fecha';
COMMENT ON INDEX idx_predicciones_categoria IS 'Queries por categoría detectada';


