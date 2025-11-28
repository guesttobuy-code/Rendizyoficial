# Script simplificado para deploy imediato
$ErrorActionPreference = "Continue"

Write-Host "`n=== DEPLOY RENDIZY-SERVER ===" -ForegroundColor Green
Write-Host ""

# Navegar para o diretório
Set-Location "c:\Users\rafae\Downloads\login-que-funcionou-20251124-172504 BACKUP"

# Deploy direto
Write-Host "Executando deploy..." -ForegroundColor Yellow
Write-Host ""

& npx supabase functions deploy rendizy-server

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ DEPLOY CONCLUÍDO!" -ForegroundColor Green
    Write-Host "`nA rota /chat/channels/config está disponível em:" -ForegroundColor Cyan
    Write-Host "https://odcgnzfremrqnvtitpcc.supabase.co/functions/v1/rendizy-server/chat/channels/config" -ForegroundColor White
} else {
    Write-Host "`n❌ ERRO NO DEPLOY" -ForegroundColor Red
    Write-Host "Verifique se está logado: npx supabase login" -ForegroundColor Yellow
}

Write-Host ""
