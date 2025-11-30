# Script robusto para iniciar o servidor Rendizy
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INICIANDO SERVIDOR RENDIZY" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navegar para o diretório
$projectPath = "c:\Users\rafae\Downloads\login-que-funcionou-20251124-172504 BACKUP\RendizyPrincipal"
Set-Location $projectPath
Write-Host "Diretório: $projectPath" -ForegroundColor Yellow
Write-Host ""

# Verificar Node.js
Write-Host "1. Verificando Node.js..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version 2>&1
    Write-Host "   ✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Node.js não encontrado!" -ForegroundColor Red
    exit 1
}

# Verificar npm
Write-Host "2. Verificando npm..." -ForegroundColor Cyan
try {
    $npmVersion = npm --version 2>&1
    Write-Host "   ✅ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ npm não encontrado!" -ForegroundColor Red
    exit 1
}

# Parar processos Node existentes
Write-Host "3. Parando processos Node existentes..." -ForegroundColor Cyan
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "   ✅ Processos parados" -ForegroundColor Green

# Verificar node_modules
Write-Host "4. Verificando dependências..." -ForegroundColor Cyan
if (-not (Test-Path "node_modules")) {
    Write-Host "   ⚠️  node_modules não encontrado. Instalando..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Erro ao instalar dependências!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "   ✅ node_modules encontrado" -ForegroundColor Green
}

# Verificar dependências @dnd-kit
Write-Host "5. Verificando @dnd-kit..." -ForegroundColor Cyan
$dndKitCheck = npm list @dnd-kit/core 2>&1
if ($dndKitCheck -match "empty" -or $dndKitCheck -match "not found") {
    Write-Host "   ⚠️  @dnd-kit não encontrado. Instalando..." -ForegroundColor Yellow
    npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
} else {
    Write-Host "   ✅ @dnd-kit instalado" -ForegroundColor Green
}

Write-Host ""
Write-Host "6. Iniciando servidor Vite..." -ForegroundColor Cyan
Write-Host "   URL: http://localhost:5173" -ForegroundColor Yellow
Write-Host "   Aguarde alguns segundos..." -ForegroundColor Yellow
Write-Host ""

# Iniciar servidor
npm run dev
