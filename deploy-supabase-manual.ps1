# Script Alternativo - Usa npx ao inves de supabase CLI global
# Use este script se o Supabase CLI nao estiver instalado globalmente

Write-Host "Fazendo deploy usando npx..." -ForegroundColor Cyan
Write-Host ""

$projectPath = "C:\Users\rafae\OneDrive\Desktop\RENDIZY PASTA OFICIAL"
$supabasePath = Join-Path $projectPath "supabase"

if (-not (Test-Path $supabasePath)) {
    Write-Host "Erro: Pasta supabase nao encontrada!" -ForegroundColor Red
    exit 1
}

Set-Location $supabasePath
Write-Host "Diretorio: $(Get-Location)" -ForegroundColor Green
Write-Host ""

Write-Host "Executando deploy via npx..." -ForegroundColor Cyan
npx supabase functions deploy rendizy-server --no-verify-jwt

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Deploy concluido com sucesso!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Erro durante o deploy." -ForegroundColor Red
    exit 1
}

Set-Location $projectPath
