-- ⚠️ VERSIÓN SEGURA: Conserva filas, limpia solo resultado JSON (evita problemas con FK)
CREATE OR REPLACE FUNCTION cleanup_old_predictions()
RETURNS TABLE(deleted_count INT, aggregated_count INT) AS $$
DECLARE
  v_deleted INT := 0;
  v_aggregated INT := 0;
BEGIN
  -- 1. Agregar predicciones del mes anterior a feedback_metrics_monthly
  INSERT INTO feedback_metrics_monthly (country_code, year_month, total_predicciones, confirmadas, rechazadas, accuracy, top_categorias, top_monedas)
  SELECT 
    fu.country_code,
    DATE_TRUNC('month', fu.created_at)::DATE,
    COUNT(*) as total,
    COUNT(CASE WHEN fu.era_correcto = true THEN 1 END) as confirmadas,
    COUNT(CASE WHEN fu.era_correcto = false THEN 1 END) as rechazadas,
    ROUND(100.0 * COUNT(CASE WHEN fu.era_correcto = true THEN 1 END) / NULLIF(COUNT(*), 0), 2) as accuracy,
    -- Top 10 categorías con conteo
    (SELECT jsonb_object_agg(categoria, cnt) FROM (
      SELECT COALESCE(pg.resultado->>'categoria', 'desconocida') AS categoria, COUNT(*) AS cnt
      FROM feedback_usuarios fu2
      LEFT JOIN predicciones_groq pg ON fu2.prediction_id = pg.id
      WHERE fu2.country_code = fu.country_code
        AND DATE_TRUNC('month', fu2.created_at) = DATE_TRUNC('month', fu.created_at)
      GROUP BY 1
      ORDER BY cnt DESC
      LIMIT 10
    ) s),
    -- Top 5 monedas con conteo
    (SELECT jsonb_object_agg(moneda, cnt) FROM (
      SELECT COALESCE(pg.resultado->>'moneda', 'desconocida') AS moneda, COUNT(*) AS cnt
      FROM feedback_usuarios fu2
      LEFT JOIN predicciones_groq pg ON fu2.prediction_id = pg.id
      WHERE fu2.country_code = fu.country_code
        AND DATE_TRUNC('month', fu2.created_at) = DATE_TRUNC('month', fu.created_at)
      GROUP BY 1
      ORDER BY cnt DESC
      LIMIT 5
    ) s)
  FROM feedback_usuarios fu
  WHERE DATE_TRUNC('month', fu.created_at)::DATE < DATE_TRUNC('month', NOW())::DATE
  GROUP BY fu.country_code, DATE_TRUNC('month', fu.created_at)::DATE
  ON CONFLICT (country_code, year_month) DO UPDATE SET
    total_predicciones = EXCLUDED.total_predicciones,
    confirmadas = EXCLUDED.confirmadas,
    rechazadas = EXCLUDED.rechazadas,
    accuracy = EXCLUDED.accuracy,
    top_categorias = EXCLUDED.top_categorias,
    top_monedas = EXCLUDED.top_monedas,
    updated_at = NOW();
  
  GET DIAGNOSTICS v_aggregated = ROW_COUNT;

  -- 2. ⚠️ VERSIÓN SEGURA: Limpiar JSON pesado en predicciones >90 días (sin borrar filas)
  -- Para evitar problemas con FK desde feedback_usuarios
  UPDATE predicciones_groq
  SET resultado = NULL, resultado_raw_url = 'archived', updated_at = NOW()
  WHERE created_at < NOW() - INTERVAL '90 days'
  AND confirmado IS NOT NULL
  AND resultado IS NOT NULL;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN QUERY SELECT v_deleted, v_aggregated;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_predictions() IS 'Agrega a feedback_metrics_monthly y limpia resultado JSON >90 días (sin borrar filas)';


