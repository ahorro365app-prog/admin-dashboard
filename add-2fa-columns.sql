-- Agregar columnas de 2FA a la tabla admin_users
-- Ejecutar en Supabase SQL Editor

-- Agregar columnas para 2FA
ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(255),
ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS backup_codes TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_admin_users_totp_enabled ON admin_users(totp_enabled);

-- Comentarios para documentación
COMMENT ON COLUMN admin_users.totp_secret IS 'Secreto TOTP encriptado para 2FA';
COMMENT ON COLUMN admin_users.totp_enabled IS 'Indica si 2FA está habilitado para este usuario';
COMMENT ON COLUMN admin_users.backup_codes IS 'Códigos de respaldo hasheados para 2FA';

-- Verificar que las columnas se agregaron correctamente
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'admin_users' 
  AND column_name IN ('totp_secret', 'totp_enabled', 'backup_codes')
ORDER BY column_name;

