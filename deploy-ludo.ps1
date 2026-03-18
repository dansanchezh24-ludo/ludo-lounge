# deploy-ludo.ps1 - Script avanzado para Windows PowerShell

# Mensaje de commit automático
$commitMessage = "Deploy automático - build lista para Vercel"

Write-Host "1 Limpiando dependencias antiguas..."
Remove-Item -Recurse -Force .\node_modules -ErrorAction SilentlyContinue
Remove-Item -Force .\package-lock.json -ErrorAction SilentlyContinue

Write-Host "2️ Instalando dependencias con legacy-peer-deps..."
npm install --legacy-peer-deps

Write-Host "3️ Asegurando permisos correctos para Vite (Linux/Vercel)..."
# Si está en Linux (Vercel) aplica chmod, en Windows se salta
if ($env:OS -ne "Windows_NT") {
    chmod +x ./node_modules/.bin/vite
}

Write-Host "4️ Generando build de producción..."
npm run build

Write-Host "5️ Levantando preview local en http://localhost:4173/ (opcional)..."
Start-Process "cmd" "/c npm run preview"

Write-Host "6️ Haciendo commit y push automático a GitHub..."
git add .
git commit -m "$commitMessage"
git push origin main

Write-Host "¡Todo listo! Build subida a GitHub y lista para deploy en Vercel."