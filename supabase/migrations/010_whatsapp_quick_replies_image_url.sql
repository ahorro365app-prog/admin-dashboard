-- Migración: Agregar soporte para imágenes en respuestas rápidas
-- Fecha: 2024
-- Descripción: Agrega campo image_url a whatsapp_quick_replies para soportar imágenes

-- Agregar columna image_url a whatsapp_quick_replies
ALTER TABLE whatsapp_quick_replies 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Comentario para documentación
COMMENT ON COLUMN whatsapp_quick_replies.image_url IS 'URL de la imagen asociada a la respuesta rápida (opcional)';

