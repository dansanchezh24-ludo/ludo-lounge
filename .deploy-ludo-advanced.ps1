# ==========================
# deploy-ludo-advanced.ps1
# ==========================

# ---------- CONFIGURACIÓN DEL TOKEN ----------
# Pon tu token de Vercel aquí (entre comillas)
$env:VC_TOKEN = "vcp_1BHP1P8MgCJ4o0LJdTHuibTWZd9TeMPjsmMpf49Y6DRD1wa37Z2HheU7"   # <-- REEMPLAZA ESTO CON TU TOKEN

# ---------- FIN CONFIGURACIÓN TOKEN ----------

# Limpiar node_modules y package-lock.json
Write-Host "Cache de npm limpiada y archivos temporales eliminados..."
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .\node_modules -ErrorAction SilentlyContinue
Remove-Item -Force .\package-lock.json -ErrorAction SilentlyContinue
npm cache clean --force

# Instalar dependencias
Write-Host "Instalando dependencias..."
npm install --legacy-peer-deps

# Generar build de producción
Write-Host "Generando build de producción..."
npm run build

# Commit y push automático a Git
Write-Host "Commit y push al repositorio..."
git add .
git commit -m "Deploy automático: limpieza, build y push"
git push origin main

# Deploy en Vercel usando el token
Write-Host "Iniciando deploy en Vercel..."
npx vercel --prod --confirm   # <-- El script usará $env:VC_TOKEN automáticamente

Write-Host "Deploy finalizado. Preview local disponible en http://localhost:4173/"
Write-Host "Para exponer en red: npx vite preview --host"