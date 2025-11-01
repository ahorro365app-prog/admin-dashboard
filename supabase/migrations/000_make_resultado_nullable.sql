-- Permitir NULL en resultado para cleanup seguro
ALTER TABLE predicciones_groq 
ALTER COLUMN resultado DROP NOT NULL;

COMMENT ON COLUMN predicciones_groq.resultado IS 'JSON con datos de predicción (puede ser NULL después de cleanup >90 días)';


