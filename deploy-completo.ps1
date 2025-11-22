# Script para fazer deploy completo (Backend + Banco + Frontend)
# Uso: .\deploy-completo.ps1 [mensagem-do-commit]
# Executa no VS Code: Terminal > Run Task > deploy-completo

$ErrorActionPreference = "Stop"

# Define o diretório do projeto
$projectPath = "C:\Users\rafae\Downloads\Rendizy2producao-main github 15 11 2025\Rendizy2producao-main"
Set-Location $projectPath

Write-Host "`n🚀 DEPLOY COMPLETO - Rendizy" -ForegroundColor Magenta
Write-Host "============================`n" -ForegroundColor Magenta

# 1. Backend
Write-Host "`n[1/3] Backend (Supabase Functions)" -ForegroundColor Cyan
Write-Host "-----------------------------------" -ForegroundColor Cyan
& "$PSScriptRoot\deploy-backend.ps1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Falha no deploy do backend. Abortando.`n" -ForegroundColor Red
    exit 1
}

# 2. Banco de Dados
Write-Host "`n[2/3] Banco de Dados (Supabase DB)" -ForegroundColor Cyan
Write-Host "----------------------------------" -ForegroundColor Cyan
& "$PSScriptRoot\deploy-db.ps1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n⚠️  Falha no deploy do banco. Continuando com frontend...`n" -ForegroundColor Yellow
}

# 3. Frontend
Write-Host "`n[3/3] Frontend (GitHub → Vercel)" -ForegroundColor Cyan
Write-Host "---------------------------------" -ForegroundColor Cyan
$commitMsg = if ($args.Count -gt 0) { $args[0] } else { "chore: Deploy completo - backend, banco e frontend" }
& "$PSScriptRoot\deploy-frontend.ps1" $commitMsg
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n⚠️  Falha no deploy do frontend.`n" -ForegroundColor Yellow
}

Write-Host "`n✅ Deploy completo finalizado!`n" -ForegroundColor Green
Write-Host "   Verifique os logs acima para detalhes.`n" -ForegroundColor Gray

