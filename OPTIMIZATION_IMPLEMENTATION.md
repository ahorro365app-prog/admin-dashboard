# 🚀 Implementación Final: Optimización para 1M Usuarios

## ⚠️ ORDEN DE EJECUCIÓN SQL (CRÍTICO)

Abre Supabase Dashboard → SQL Editor y ejecuta en este ORDEN exacto:

1. ✅ 00_enable_pgcrypto.sql ← PRIMERO (habilita gen_random_uuid)
2. ✅ 000_make_resultado_nullable.sql ← permite NULL en resultado
3. ✅ 001_feedback_metrics_monthly.sql
4. ✅ 003_add_wa_message_id.sql ← ANTES que 002
5. ✅ 002_create_critical_indexes.sql ← DESPUÉS que 003
6. ✅ 004_compress_groq_results.sql
7. ✅ 005_cleanup_job.sql ← ÚLTIMO

---

## 1️⃣ PASO 1: Variables de Entorno (admin-dashboard/.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_GROQ_API_KEY=...
GROQ_API_KEY=...

CLEANUP_API_KEY=your-super-secret-cleanup-key-abc123xyz789
CRON_SECRET=your-cron-secret-def456uvw012
```

---

## 2️⃣ PASO 2: Endpoint de WhatsApp (deduplicación)

Archivo: `src/app/api/webhooks/baileys/route.ts`

- Lee `wa_message_id` desde `body`
- Si hay caché, retorna sin reprocesar
- Guarda predicción con `insertPredictionWithDedup`
- Devuelve siempre mismo shape de respuesta

---

## 3️⃣ PASO 3: Worker (Baileys)

- En `src/services/whatsapp.ts` agrega `messageId: msg.key.id` al `messageData`
- En `src/index.ts` envía `wa_message_id: (message as any).messageId` en el payload

---

## 4️⃣ PASO 4: Cron de Cleanup

- `vercel.json` (en admin-dashboard) incluye:

```
{
  "crons": [
    { "path": "/api/admin/cleanup", "schedule": "0 2 * * *" }
  ]
}
```

- Endpoint manual: `src/app/api/admin/cleanup/route.ts`
- Endpoint cron: `src/app/api/cron/cleanup/route.ts`

---

## 5️⃣ Pruebas

- Deduplicación: enviar el mismo mensaje WhatsApp dos veces → el segundo debe responder más rápido con `cached: true`.
- Cleanup manual: `curl -X POST https://tu-app.com/api/admin/cleanup -H "x-api-key: <CLEANUP_API_KEY>"`.

---

## 🎯 Beneficios

- Menor costo (menos almacenamiento y cómputo repetido)
- Respuestas más rápidas (caché por `wa_message_id`)
- BD sostenible (retención + vista lite + métricas mensuales)
- Idempotencia y estabilidad (índice único parcial)


