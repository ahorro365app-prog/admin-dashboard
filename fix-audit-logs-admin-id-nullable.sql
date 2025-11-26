-- Corregir admin_id para permitir NULL (necesario para login_failed)
-- Ejecutar en Supabase SQL Editor

-- Cambiar admin_id a nullable
ALTER TABLE admin_audit_logs
ALTER COLUMN admin_id DROP NOT NULL;

-- Verificar el cambio
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'admin_audit_logs' 
  AND column_name = 'admin_id';

