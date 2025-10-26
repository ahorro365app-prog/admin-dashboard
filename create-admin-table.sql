-- Script SQL para crear la tabla de administradores en tu base de datos existente
-- Ejecuta este script en el SQL Editor de Supabase

-- Crear tabla de usuarios administradores
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para búsquedas rápidas por email
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- Crear índice para búsquedas por rol
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- Insertar usuario administrador inicial
INSERT INTO admin_users (email, password_hash, role)
VALUES ('admin@demo.com', 'admin123', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir acceso solo con service_role
CREATE POLICY "Service role can access admin_users" ON admin_users
    FOR ALL USING (auth.role() = 'service_role');

-- Verificar que la tabla se creó correctamente
SELECT * FROM admin_users;

