# Script PowerShell para arreglar deploy de Vercel
# Ejecutar: powershell -ExecutionPolicy Bypass -File fix-vercel-deploy.ps1

Write-Host "Fixing Vercel deploy..." -ForegroundColor Cyan

# Verificar que estamos en admin-dashboard
if (!(Test-Path "package.json")) {
    Write-Host "ERROR: Debe ejecutarse desde admin-dashboard/" -ForegroundColor Red
    exit 1
}

# Verificar Git
Write-Host "Verificando Git..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "Hay cambios sin commitear:" -ForegroundColor Yellow
    Write-Host $gitStatus
}

# Verificar ultimo commit
Write-Host "Verificando ultimo commit..." -ForegroundColor Yellow
$lastCommit = git log --oneline -1
Write-Host "Ultimo commit local: $lastCommit" -ForegroundColor Green

# Forzar push
Write-Host "Forzando push..." -ForegroundColor Yellow
git push origin main --force-with-lease

# Verificar Vercel CLI
Write-Host "Verificando Vercel CLI..." -ForegroundColor Yellow
$vercelCheck = vercel --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Vercel CLI no encontrado. Instalando..." -ForegroundColor Yellow
    npm install -g vercel
} else {
    Write-Host "Vercel CLI instalado: $vercelCheck" -ForegroundColor Green
}

# Intentar deploy
Write-Host "Deployando a Vercel..." -ForegroundColor Cyan
Write-Host "NOTA: Si falla por cron incompatible, ve al Vercel Dashboard manualmente"
Write-Host ""

vercel --prod --force --yes

if ($LASTEXITCODE -eq 0) {
    Write-Host "Deploy exitoso!" -ForegroundColor Green
} else {
    Write-Host "Deploy fallo. Razon posible: cron incompatible" -ForegroundColor Red
    Write-Host ""
    Write-Host "SOLUCION:" -ForegroundColor Yellow
    Write-Host "1. Ir a: https://vercel.com/dashboard" -ForegroundColor White
    Write-Host "2. Proyecto: admin-dashboard" -ForegroundColor White
    Write-Host "3. Settings -> Git -> Disconnect" -ForegroundColor White
    Write-Host "4. Connect Git Repository" -ForegroundColor White
    Write-Host "5. Seleccionar: ahorro365app-prog/admin-dashboard" -ForegroundColor White
}

Write-Host ""
Write-Host "Proceso completado" -ForegroundColor Cyan
