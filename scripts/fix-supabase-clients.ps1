# Script para corregir todos los archivos que crean clientes de Supabase en el nivel superior
# Reemplaza con getSupabaseAdmin() helper

$files = @(
    "src/app/api/analytics/activities/route.ts",
    "src/app/api/analytics/recent-transactions/route.ts",
    "src/app/api/analytics/recent-registrations/route.ts",
    "src/app/api/webhooks/baileys/route.ts",
    "src/app/api/whatsapp/update-session/route.ts",
    "src/app/api/whatsapp/status/route.ts",
    "src/app/api/whatsapp/metrics/route.ts",
    "src/app/api/whatsapp/health/route.ts",
    "src/app/api/whatsapp/events/route.ts",
    "src/app/api/whatsapp/disconnect/route.ts",
    "src/app/api/webhooks/whatsapp/confirm/route.ts",
    "src/app/api/users/[id]/transactions/route.ts",
    "src/app/api/users/[id]/debts/route.ts",
    "src/app/api/test/transacciones-hoy/route.ts",
    "src/app/api/debug/usuarios/route.ts",
    "src/app/api/debug/transacciones/route.ts",
    "src/app/api/debug/tables/route.ts",
    "src/app/api/debug/login/route.ts",
    "src/app/api/debug/database/route.ts",
    "src/app/api/debug/admin/route.ts",
    "src/app/api/auth/simple-login/route.ts",
    "src/app/api/analytics/charts/route.ts",
    "src/app/api/admin/create-table/route.ts",
    "src/app/api/auth/verify-2fa-login/route.ts",
    "src/app/api/auth/revalidate-2fa/route.ts",
    "src/app/api/audit-logs/route.ts",
    "src/app/api/auth/verify-2fa-setup/route.ts",
    "src/app/api/auth/setup-2fa/route.ts",
    "src/app/api/auth/disable-2fa/route.ts"
)

Write-Host "📋 Archivos a corregir: $($files.Count)" -ForegroundColor Yellow
Write-Host ""

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot ".." $file
    if (Test-Path $fullPath) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file (no encontrado)" -ForegroundColor Red
    }
}

Write-Host "`n💡 Este script lista los archivos. La corrección se hará manualmente para cada uno." -ForegroundColor Cyan

