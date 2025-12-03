# ============================================================================
# DEPLOY RÁPIDO - GITHUB + SUPABASE
# ============================================================================
# Script rápido para commit, push e deploy
# ============================================================================

Write-Host "DEPLOY RAPIDO - GITHUB + SUPABASE" -ForegroundColor Cyan
Write-Host ""

# Adicionar tudo
git add -A

# Commit com timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$commitMsg = "feat: atualizacao automatica - $timestamp"

Write-Host "Fazendo commit..." -ForegroundColor Yellow
git commit -m $commitMsg

# Push
Write-Host "Fazendo push..." -ForegroundColor Yellow
$branch = git branch --show-current
git push origin $branch

Write-Host ""
Write-Host "SUCESSO! Codigo atualizado no GitHub." -ForegroundColor Green
Write-Host ""

# Deploy Supabase (opcional)
Write-Host "Fazer deploy no Supabase? (y/n): " -ForegroundColor Yellow -NoNewline
$deploy = Read-Host

if ($deploy -eq "y" -or $deploy -eq "Y") {
    Write-Host "Fazendo deploy..." -ForegroundColor Yellow
    supabase functions deploy rendizy-server
    Write-Host "Deploy concluido!" -ForegroundColor Green
}

Write-Host ""
Write-Host "PRONTO!" -ForegroundColor Green
