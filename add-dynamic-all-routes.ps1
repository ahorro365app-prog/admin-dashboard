# Script para agregar export const dynamic a TODAS las rutas API
# Ejecutar: powershell -ExecutionPolicy Bypass -File add-dynamic-all-routes.ps1

Write-Host "Agregando export const dynamic a todas las rutas API..." -ForegroundColor Cyan

$routes = Get-ChildItem -Recurse -Filter "route.ts" src/app/api

foreach ($file in $routes) {
    $content = Get-Content $file.FullName -Raw
    
    # Verificar si ya tiene export const dynamic
    if ($content -match "export const dynamic") {
        Write-Host "Ya tiene: $($file.Name)" -ForegroundColor Green
        continue
    }
    
    # Buscar la primera ocurrencia de "export async function"
    if ($content -match "(import.*?\n)(export async function)") {
        $newContent = $content -replace "(import.*?\n)(export async function)", "`$1`n// Force dynamic rendering - Vercel cache buster`nexport const dynamic = 'force-dynamic';`nexport const runtime = 'nodejs';`n`n`$2"
        
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        Write-Host "Agregado a: $($file.Name)" -ForegroundColor Yellow
    } else {
        Write-Host "No se encontro export async function en: $($file.Name)" -ForegroundColor Red
    }
}

Write-Host "Proceso completado!" -ForegroundColor Green



