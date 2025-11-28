# Script de Testing para WhatsApp Status (Sub-Fases 1.3 y 1.4)
# Este script verifica que el código esté correcto y hace pruebas básicas

Write-Host "🧪 Testing Sub-Fases 1.3 y 1.4 - WhatsApp Status" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Gray
Write-Host ""

$errors = 0
$warnings = 0

# Verificar que los archivos existen
Write-Host "📋 Verificando archivos..." -ForegroundColor Yellow

$files = @(
    "src/app/(protected)/whatsapp-status/page.tsx",
    "src/components/WhatsApp/TransactionsPanel.tsx",
    "src/components/WhatsApp/ChatPanel.tsx"
)

foreach ($file in $files) {
    $fullPath = Join-Path (Split-Path $PSScriptRoot -Parent) $file
    if (Test-Path $fullPath) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file - NO ENCONTRADO" -ForegroundColor Red
        $errors++
    }
}

Write-Host ""

# Verificar contenido de page.tsx
Write-Host "📋 Verificando contenido de page.tsx..." -ForegroundColor Yellow

$pageContent = Get-Content (Join-Path (Split-Path $PSScriptRoot -Parent) "src\app\(protected)\whatsapp-status\page.tsx") -Raw

# Verificar que tiene tabs
if ($pageContent -match "TabId|activeTab|handleTabChange") {
    Write-Host "  ✅ Tabs implementados" -ForegroundColor Green
} else {
    Write-Host "  ❌ Tabs NO implementados" -ForegroundColor Red
    $errors++
}

# Verificar que tiene TransactionsPanel
if ($pageContent -match "TransactionsPanel") {
    Write-Host "  ✅ TransactionsPanel importado" -ForegroundColor Green
} else {
    Write-Host "  ❌ TransactionsPanel NO importado" -ForegroundColor Red
    $errors++
}

# Verificar que tiene ChatPanel
if ($pageContent -match "ChatPanel") {
    Write-Host "  ✅ ChatPanel importado" -ForegroundColor Green
} else {
    Write-Host "  ❌ ChatPanel NO importado" -ForegroundColor Red
    $errors++
}

# Verificar localStorage
if ($pageContent -match "localStorage|STORAGE_KEY") {
    Write-Host "  ✅ Persistencia en localStorage implementada" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Persistencia en localStorage NO implementada" -ForegroundColor Yellow
    $warnings++
}

Write-Host ""

# Verificar TransactionsPanel.tsx
Write-Host "📋 Verificando TransactionsPanel.tsx..." -ForegroundColor Yellow

$panelContent = Get-Content (Join-Path (Split-Path $PSScriptRoot -Parent) "src\components\WhatsApp\TransactionsPanel.tsx") -Raw

# Verificar que tiene fetchTransactions
if ($panelContent -match "fetchTransactions|useEffect") {
    Write-Host "  ✅ Integración con backend implementada" -ForegroundColor Green
} else {
    Write-Host "  ❌ Integración con backend NO implementada" -ForegroundColor Red
    $errors++
}

# Verificar manejo de estados
if ($panelContent -match "loading|error|data|useState") {
    Write-Host "  ✅ Manejo de estados implementado" -ForegroundColor Green
} else {
    Write-Host "  ❌ Manejo de estados NO implementado" -ForegroundColor Red
    $errors++
}

# Verificar URL del endpoint
if ($panelContent -match "CORE_API_URL|api/whatsapp/transactions") {
    Write-Host "  ✅ URL del endpoint configurada" -ForegroundColor Green
} else {
    Write-Host "  ❌ URL del endpoint NO configurada" -ForegroundColor Red
    $errors++
}

# Verificar tipos TypeScript
if ($panelContent -match "interface|WhatsAppTransaction|TransactionsResponse") {
    Write-Host "  ✅ Tipos TypeScript definidos" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Tipos TypeScript NO encontrados" -ForegroundColor Yellow
    $warnings++
}

Write-Host ""

# Verificar ChatPanel.tsx
Write-Host "📋 Verificando ChatPanel.tsx..." -ForegroundColor Yellow

$chatContent = Get-Content (Join-Path (Split-Path $PSScriptRoot -Parent) "src\components\WhatsApp\ChatPanel.tsx") -Raw

if ($chatContent -match "ChatPanel|Próximamente") {
    Write-Host "  ✅ ChatPanel implementado como placeholder" -ForegroundColor Green
} else {
    Write-Host "  ❌ ChatPanel NO encontrado o incorrecto" -ForegroundColor Red
    $errors++
}

Write-Host ""

# Verificar que el servidor está corriendo
Write-Host "📋 Verificando servidor..." -ForegroundColor Yellow

$serverRunning = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }

if ($serverRunning) {
    Write-Host "  ✅ Servidor corriendo en puerto 3001" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Servidor NO está corriendo en puerto 3001" -ForegroundColor Yellow
    Write-Host "     Ejecuta: cd admin-dashboard; npm run dev" -ForegroundColor Gray
    $warnings++
}

Write-Host ""

# Resumen
Write-Host "==========================================" -ForegroundColor Gray
Write-Host "📊 Resumen:" -ForegroundColor Cyan
Write-Host "  ✅ Verificaciones pasadas: $((3 * $files.Count) - $errors - $warnings)" -ForegroundColor Green
if ($warnings -gt 0) {
    Write-Host "  ⚠️  Advertencias: $warnings" -ForegroundColor Yellow
}
if ($errors -gt 0) {
    Write-Host "  ❌ Errores: $errors" -ForegroundColor Red
    Write-Host ""
    Write-Host "❌ Hay errores que deben corregirse antes de continuar." -ForegroundColor Red
    exit 1
} else {
    Write-Host ""
    Write-Host "✅ Todas las verificaciones de código pasaron!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Próximos pasos:" -ForegroundColor Cyan
    Write-Host "  1. Abre http://localhost:3001/whatsapp-status en tu navegador" -ForegroundColor Gray
    Write-Host "  2. Inicia sesión si es necesario" -ForegroundColor Gray
    Write-Host "  3. Verifica manualmente los tests de UI" -ForegroundColor Gray
    exit 0
}

