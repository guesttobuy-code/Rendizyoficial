# Script para Verificar Status do Deploy
Write-Host "=== VERIFICACAO DE DEPLOY ===" -ForegroundColor Cyan
Write-Host ""

$projectPath = "C:\Users\rafae\OneDrive\Desktop\RENDIZY PASTA OFICIAL"
Set-Location $projectPath

Write-Host "1. Status do Git:" -ForegroundColor Yellow
git status
Write-Host ""

Write-Host "2. Ultimos 3 commits:" -ForegroundColor Yellow
git log --oneline -3
Write-Host ""

Write-Host "3. Remote configurado:" -ForegroundColor Yellow
git remote -v
Write-Host ""

Write-Host "4. Branch atual:" -ForegroundColor Yellow
git branch --show-current
Write-Host ""

Write-Host "5. Comparando com remoto:" -ForegroundColor Yellow
git fetch origin master 2>&1 | Out-Null
$localCommit = git rev-parse HEAD 2>$null
$remoteCommit = git rev-parse origin/master 2>$null

if ($localCommit -eq $remoteCommit) {
    Write-Host "   ✅ Local e remoto estao sincronizados!" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Local e remoto estao diferentes" -ForegroundColor Yellow
    Write-Host "   Local:  $localCommit" -ForegroundColor Gray
    Write-Host "   Remoto: $remoteCommit" -ForegroundColor Gray
}
Write-Host ""

Write-Host "=== FIM DA VERIFICACAO ===" -ForegroundColor Cyan


