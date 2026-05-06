# -------------------------------
# DEPLOY LUDO AUTOMATICO CON PR
# -------------------------------
# Lee tokens desde .env (NO committear el .env).
# Variables requeridas: VC_TOKEN, GITHUB_TOKEN, GITHUB_USER, GITHUB_REPO
# Ver scripts/.env.example para referencia.

# --- CARGAR .env ---
$envFile = Join-Path $PSScriptRoot "..\.env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#=\s]+)\s*=\s*(.*?)\s*$') {
            $name  = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"').Trim("'")
            if ($name -and -not (Test-Path "env:$name")) {
                Set-Item -Path "env:$name" -Value $value
            }
        }
    }
} else {
    Write-Host "No se encontro .env en la raiz del proyecto. Crea uno basado en scripts/.env.example" -ForegroundColor Red
    exit 1
}

# --- VALIDAR VARIABLES ---
$required = @("VC_TOKEN", "GITHUB_TOKEN", "GITHUB_USER", "GITHUB_REPO")
$missing  = $required | Where-Object { -not (Get-Item "env:$_" -ErrorAction SilentlyContinue) }
if ($missing) {
    Write-Host "Faltan variables en .env: $($missing -join ', ')" -ForegroundColor Red
    exit 1
}

$githubToken = $env:GITHUB_TOKEN
$githubUser  = $env:GITHUB_USER
$githubRepo  = $env:GITHUB_REPO
$tempBranch  = if ($env:DEPLOY_BRANCH) { $env:DEPLOY_BRANCH } else { "deploy-temp" }

Write-Host "Deteniendo procesos Node..." -ForegroundColor Cyan
Stop-Process -Name node -Force -ErrorAction SilentlyContinue

Write-Host "Limpiando cache y dependencias..." -ForegroundColor Cyan
Remove-Item -Recurse -Force .\node_modules -ErrorAction SilentlyContinue
Remove-Item -Force .\package-lock.json -ErrorAction SilentlyContinue
npm cache clean --force

Write-Host "Instalando dependencias..." -ForegroundColor Cyan
npm install --legacy-peer-deps

Write-Host "Generando build de produccion..." -ForegroundColor Cyan
npm run build

# --- PUSH A GITHUB ---
Write-Host "Creando rama temporal para push..." -ForegroundColor Cyan
git checkout -b $tempBranch

git add package.json package-lock.json dist -f
git commit -m "Deploy automatico: build lista para Vercel" -ErrorAction SilentlyContinue

Write-Host "Haciendo push a rama temporal $tempBranch..." -ForegroundColor Cyan
git push "https://$githubToken@github.com/$githubUser/$githubRepo.git" $tempBranch -f

# --- CREAR PULL REQUEST ---
Write-Host "Creando pull request automaticamente..." -ForegroundColor Cyan
$prBody = @{
    title = "Deploy automatico: build lista para Vercel"
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
