-- Agregar columnas metodo_pago y moneda a transacciones
-- Estas columnas fueron agregadas en WhatsApp pero no existían en el schema inicial

ALTER TABLE transacciones
ADD COLUMN IF NOT EXISTS metodo_pago VARCHAR(50) DEFAULT 'efectivo';

ALTER TABLE transacciones
ADD COLUMN IF NOT EXISTS moneda VARCHAR(10) DEFAULT 'BOB';

-- Comentarios para documentación
COMMENT ON COLUMN transacciones.metodo_pago 
IS 'Método de pago: efectivo, tarjeta, transferencia, cheque, crypto, otro';

COMMENT ON COLUMN transacciones.moneda 
IS 'Código de moneda ISO: BOB, USD, PEN, etc.';



