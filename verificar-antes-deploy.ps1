# 🛡️ VERIFICAÇÃO OBRIGATÓRIA ANTES DE DEPLOY
# Bloqueia deploy se houver conflitos de merge
# REGRA: NUNCA fazer deploy com conflitos

Write-Host "=== VERIFICAÇÃO ANTES DE DEPLOY ===" -ForegroundColor Cyan
Write-Host ""

$projectPath = "C:\dev\RENDIZY PASTA OFICIAL"
$hasConflicts = $false
$conflictFiles = @()

# Buscar TODOS os arquivos com conflitos
Write-Host "Verificando conflitos de merge..." -ForegroundColor Yellow

$files = Get-ChildItem -Path $projectPath -Recurse -Include "*.ts","*.tsx","*.js","*.jsx","*.json","*.md","*.sql" -File | Where-Object {
    $_.FullName -notlike "*node_modules*" -and
    $_.FullName -notlike "*\.git*" -and
    $_.FullName -notlike "*dist*" -and
    $_.FullName -notlike "*build*"
}

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -and ($content -match '<<<<<<< HEAD' -or $content -match '^<<<<<<< ' -or $content -match '^=======' -or $content -match '^>>>>>>>')) {
        $hasConflicts = $true
        $conflictFiles += $file.FullName
        Write-Host "  ❌ CONFLITO: $($file.Name)" -ForegroundColor Red
    }
}

Write-Host ""

if ($hasConflicts) {
    Write-Host "🚨 ERRO CRÍTICO: CONFLITOS DE MERGE DETECTADOS!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Arquivos com conflitos:" -ForegroundColor Yellow
    foreach ($file in $conflictFiles) {
        Write-Host "  - $file" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "⚠️  DEPLOY BLOQUEADO!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Execute para corrigir:" -ForegroundColor Cyan
    Write-Host "  .\resolver-todos-conflitos-definitivo.ps1" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Depois execute novamente:" -ForegroundColor Cyan
    Write-Host "  .\verificar-antes-deploy.ps1" -ForegroundColor Yellow
    Write-Host ""
    exit 1
} else {
    Write-Host "✅ Nenhum conflito encontrado. Deploy permitido!" -ForegroundColor Green
    Write-Host ""
    exit 0
}
