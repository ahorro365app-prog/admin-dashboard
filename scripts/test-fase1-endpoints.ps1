# Script de Testing para Fase 1: Endpoints Separados
# Uso: .\scripts\test-fase1-endpoints.ps1

Write-Host "`n🧪 Testing Fase 1: Endpoints Separados`n" -ForegroundColor Cyan
Write-Host "=====================================`n" -ForegroundColor Gray

$baseUrl = "http://localhost:3001"

# Verificar que el servidor esté corriendo
Write-Host "1. Verificando que el servidor esté corriendo..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl" -Method GET -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    Write-Host "   ✅ Servidor corriendo en $baseUrl" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Servidor NO está corriendo en $baseUrl" -ForegroundColor Red
    Write-Host "   💡 Inicia el servidor con: npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n2. Verificando endpoints (requieren autenticación)...`n" -ForegroundColor Yellow

# Nota: Estos endpoints requieren autenticación, así que solo verificamos que existan
$endpoints = @(
    "/api/analytics/recent-transactions",
    "/api/analytics/recent-registrations",
    "/api/analytics/activities"
)

foreach ($endpoint in $endpoints) {
    Write-Host "   Verificando: $endpoint" -ForegroundColor Gray
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl$endpoint" -Method GET -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 401) {
            Write-Host "   ✅ Endpoint existe (Status: $($response.StatusCode))" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️ Endpoint responde con Status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 401) {
            Write-Host "   ✅ Endpoint existe (requiere autenticación)" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host "`n3. Verificando estructura de archivos...`n" -ForegroundColor Yellow

$files = @(
    "src/app/api/analytics/recent-transactions/route.ts",
    "src/app/api/analytics/recent-registrations/route.ts",
    "src/app/api/analytics/activities/route.ts"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file NO encontrado" -ForegroundColor Red
    }
}

Write-Host "`n✅ Testing Fase 1 completado`n" -ForegroundColor Green
Write-Host "💡 Para testing completo con autenticación:" -ForegroundColor Yellow
Write-Host "   1. Inicia sesión en http://localhost:3001" -ForegroundColor Gray
Write-Host "   2. Abre DevTools (F12)" -ForegroundColor Gray
Write-Host "   3. Ejecuta en la consola:" -ForegroundColor Gray
Write-Host "      fetch('/api/analytics/recent-transactions').then(r => r.json()).then(console.log)" -ForegroundColor Cyan
Write-Host "      fetch('/api/analytics/recent-registrations').then(r => r.json()).then(console.log)" -ForegroundColor Cyan

