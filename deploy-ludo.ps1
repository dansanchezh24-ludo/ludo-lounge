# deploy-ludo.ps1
# 🚀 Deploy automático de LUDO para Vercel

# -- Configuración --
$commitMessage = "Deploy automático: build y dependencias actualizadas"

Write-Host "Cerrando procesos Node (si existen)..."
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host " Limpiando dependencias antiguas..."
Remove-Item -Recurse -Force .\node_modules -ErrorAction SilentlyContinue
Remove-Item -Force .\package-lock.json -ErrorAction SilentlyContinue

Write-Host "Instalando dependencias con legacy-peer-deps..."
npm install --legacy-peer-deps

Write-Host "Generando build de producción..."
npx vite build

Write-Host " Guardando cambios en GitHub..."
git add .
git commit -m $commitMessage
git push origin main

Write-Host " Deploy completo. Carpeta 'dist' lista para Vercel."