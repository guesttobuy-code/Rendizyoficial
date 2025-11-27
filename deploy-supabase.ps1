# ============================================================================
# Script para Deploy da Edge Function no Supabase
# ============================================================================
# Faz login interativo e deploy da função rendizy-server
#
# Uso: .\deploy-supabase.ps1
# ============================================================================

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "   DEPLOY SUPABASE EDGE FUNCTION" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# PASSO 1: Verificar Supabase CLI
# ============================================================================
Write-Host "PASSO 1: Verificando Supabase CLI..." -ForegroundColor Yellow
$supabaseCheck = npx supabase --version 2>&1
if ($?) {
    Write-Host "   OK - Supabase CLI encontrado" -ForegroundColor Green
} else {
    Write-Host "   ERRO - Supabase CLI nao esta disponivel!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# ============================================================================
# PASSO 2: Verificar Login
# ============================================================================
Write-Host "PASSO 2: Verificando login no Supabase..." -ForegroundColor Yellow

# Token padrao (conta com acesso ao projeto odcgnzfremrqnvtitpcc)
$defaultToken = "sbp_1c0b41c941ac6c1c584ce47be4f2afc2a99ef12b"

# Se nao tiver token na variavel de ambiente, usar o padrao
if (-not $env:SUPABASE_ACCESS_TOKEN) {
    $env:SUPABASE_ACCESS_TOKEN = $defaultToken
    Write-Host "   Usando token padrao configurado..." -ForegroundColor Gray
}

$projectsCheck = npx supabase projects list 2>&1

if ($?) {
    Write-Host "   OK - Login verificado" -ForegroundColor Green
    Write-Host $projectsCheck
    Write-Host ""
    
    # Verificar se tem acesso ao projeto correto
    if ($projectsCheck -match "odcgnzfremrqnvtitpcc") {
        Write-Host "   OK - Acesso ao projeto odcgnzfremrqnvtitpcc confirmado" -ForegroundColor Green
    } else {
        Write-Host "   AVISO - Projeto odcgnzfremrqnvtitpcc nao encontrado na lista" -ForegroundColor Yellow
        Write-Host "   Faca login com conta que tem acesso ao projeto" -ForegroundColor Yellow
    }
} else {
    Write-Host "   AVISO - Nao esta logado ou sem acesso" -ForegroundColor Yellow
    Write-Host "   Fazendo login com token..." -ForegroundColor Cyan
    
    npx supabase login --token $env:SUPABASE_ACCESS_TOKEN
    
    if ($?) {
        Write-Host "   OK - Login realizado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "   ERRO - Erro ao fazer login" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# ============================================================================
# PASSO 3: Verificar Funcao Local
# ============================================================================
Write-Host "PASSO 3: Verificando funcao local..." -ForegroundColor Yellow
$functionPath = "supabase\functions\rendizy-server"

if (Test-Path $functionPath) {
    Write-Host "   OK - Funcao encontrada em: $functionPath" -ForegroundColor Green
} else {
    Write-Host "   ERRO - Funcao nao encontrada em: $functionPath" -ForegroundColor Red
    exit 1
}
Write-Host ""

# ============================================================================
# PASSO 4: Deploy da Funcao
# ============================================================================
Write-Host "PASSO 4: Fazendo deploy da funcao rendizy-server..." -ForegroundColor Yellow
Write-Host "   Isso pode levar alguns minutos..." -ForegroundColor Gray
Write-Host ""

$deployResult = npx supabase functions deploy rendizy-server --project-ref odcgnzfremrqnvtitpcc 2>&1
$deploySuccess = $?

if ($deploySuccess) {
    Write-Host ""
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host "   DEPLOY REALIZADO COM SUCESSO!" -ForegroundColor Green
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "URL da funcao:" -ForegroundColor Cyan
    Write-Host "   https://odcgnzfremrqnvtitpcc.supabase.co/functions/v1/rendizy-server" -ForegroundColor Gray
    Write-Host ""
    Write-Host $deployResult
} else {
    Write-Host ""
    Write-Host "============================================================================" -ForegroundColor Red
    Write-Host "   ERRO NO DEPLOY" -ForegroundColor Red
    Write-Host "============================================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host $deployResult -ForegroundColor Yellow
    Write-Host ""
    Write-Host "POSSIVEIS SOLUCOES:" -ForegroundColor Cyan
    Write-Host "   1. Fazer login com conta que tem acesso ao projeto:" -ForegroundColor Gray
    Write-Host "      npx supabase login --token SEU_TOKEN_DA_CONTA_CORRETA" -ForegroundColor Gray
    Write-Host "   2. Obter Access Token da conta correta em:" -ForegroundColor Gray
    Write-Host "      https://supabase.com/dashboard/account/tokens" -ForegroundColor Gray
    Write-Host "   3. Verificar se a conta tem acesso ao projeto odcgnzfremrqnvtitpcc" -ForegroundColor Gray
    Write-Host "   4. Verificar permissoes no dashboard do Supabase" -ForegroundColor Gray
    exit 1
}

Write-Host ""