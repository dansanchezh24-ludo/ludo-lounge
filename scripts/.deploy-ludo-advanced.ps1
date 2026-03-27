# -------------------------------
# DEPLOY LUDO AUTOMÁTICO CON PR
# -------------------------------

# --- CONFIGURACIÓN ---
# Token de Vercel
$env:VC_TOKEN = "vcp_5njO7vYzTgjV3EneecWfSXVA64Ar6erNKafsejsoJfnMbYoUVN1KnzKf"

# Token de GitHub (con permisos repo)
$githubToken = "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"

# Usuario y repositorio
$githubUser = "dansanchezh24-ludo"
$githubRepo = "ludo-store"

# Rama temporal
$tempBranch = "deploy-temp"

# --- FIN CONFIGURACIÓN ---

Write-Host "Deteniendo procesos Node..." -ForegroundColor Cyan
Stop-Process -Name node -Force -ErrorAction SilentlyContinue

Write-Host "Limpiando cache y dependencias..." -ForegroundColor Cyan
Remove-Item -Recurse -Force .\node_modules -ErrorAction SilentlyContinue
Remove-Item -Force .\package-lock.json -ErrorAction SilentlyContinue
npm cache clean --force

Write-Host "Instalando dependencias..." -ForegroundColor Cyan
npm install --legacy-peer-deps

Write-Host "Generando build de producción..." -ForegroundColor Cyan
npm run build

# --- PUSH A GITHUB ---
Write-Host "Creando rama temporal para push..." -ForegroundColor Cyan
git checkout -b $tempBranch

git add package.json package-lock.json dist -f
git commit -m "Deploy automático: build lista para Vercel" -ErrorAction SilentlyContinue

Write-Host "Haciendo push a rama temporal $tempBranch..." -ForegroundColor Cyan
git push https://$githubToken@github.com/$githubUser/$githubRepo.git $tempBranch -f

# --- CREAR PULL REQUEST ---
Write-Host "Creando pull request automáticamente..." -ForegroundColor Cyan
$prBody = @{
    title = "Deploy automático: build lista para Vercel"
    head  = $tempBranch
    base  = "main"
    body  = "Este PR contiene la build lista para deploy en Vercel."
} | ConvertTo-Json

$prResponse = Invoke-RestMethod -Uri "https://api.github.com/repos/$githubUser/$githubRepo/pulls" `
    -Method Post `
    -Body $prBody `
    -Headers @{Authorization = "token $githubToken"; "User-Agent" = "PowerShell"}

Write-Host "PR creado: $($prResponse.html_url)" -ForegroundColor Green

# --- DEPLOY EN VERCEL ---
Write-Host "Iniciando deploy en Vercel..." -ForegroundColor Cyan
npx vercel --prod --yes

Write-Host "Deploy finalizado." -ForegroundColor Green
Write-Host "Preview local disponible: http://localhost:4173/" -ForegroundColor Green
Write-Host "Para exponer en red: npx vite preview --host" -ForegroundColor Green