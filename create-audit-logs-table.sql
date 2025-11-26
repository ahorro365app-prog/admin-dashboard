-- Crear tabla de audit logs para acciones administrativas
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL, -- NULLable para login_failed
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  target_user_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(20) DEFAULT 'success', -- success, error, warning
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON admin_audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user_id ON admin_audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON admin_audit_logs(status);

-- Índice compuesto para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_created ON admin_audit_logs(admin_id, created_at DESC);

-- Comentarios para documentación
COMMENT ON TABLE admin_audit_logs IS 'Registro de auditoría de todas las acciones administrativas';
COMMENT ON COLUMN admin_audit_logs.admin_id IS 'ID del administrador que realizó la acción';
COMMENT ON COLUMN admin_audit_logs.action IS 'Tipo de acción realizada (login, update_user, etc.)';
COMMENT ON COLUMN admin_audit_logs.resource_type IS 'Tipo de recurso afectado (user, payment, settings, etc.)';
COMMENT ON COLUMN admin_audit_logs.resource_id IS 'ID del recurso afectado';
COMMENT ON COLUMN admin_audit_logs.target_user_id IS 'ID del usuario objetivo (si aplica)';
COMMENT ON COLUMN admin_audit_logs.details IS 'Detalles adicionales en formato JSON';
COMMENT ON COLUMN admin_audit_logs.ip_address IS 'Dirección IP desde donde se realizó la acción';
COMMENT ON COLUMN admin_audit_logs.user_agent IS 'User agent del navegador';
COMMENT ON COLUMN admin_audit_logs.status IS 'Estado de la acción (success, error, warning)';
COMMENT ON COLUMN admin_audit_logs.error_message IS 'Mensaje de error si la acción falló';

-- Verificar que la tabla se creó correctamente
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'admin_audit_logs'
ORDER BY ordinal_position;

