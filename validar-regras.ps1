# Script de validacao de regras estabelecidas
# Executa verificacoes automaticas antes de commitar

Write-Host "[INFO] Validando regras estabelecidas..." -ForegroundColor Cyan
Write-Host ""

$errors = @()
$warnings = @()

# 1. Verificar uso de localStorage para dados permanentes
Write-Host "1. Verificando localStorage..." -ForegroundColor Yellow
$localStorageFiles = Get-ChildItem -Recurse -Include *.ts,*.tsx |
    Select-String -Pattern "localStorage\.setItem" | Where-Object {
        $_.Line -notmatch "rendizy-token" -and
        $_.Line -notmatch "cache:" -and
        $_.Line -notmatch "temp:" -and
        $_.Line -notmatch "process:" -and
        $_.Line -notmatch "lock:" -and
        $_.Line -notmatch "queue:"
    }

if ($localStorageFiles) {
    $errors += "[ERRO] localStorage usado para dados permanentes (ver REGRA_KV_STORE_VS_SQL.md)"
    foreach ($file in $localStorageFiles) {
        Write-Host ("   [ALERTA] {0}:{1} - {2}" -f $file.Path,$file.LineNumber,$file.Line.Trim()) -ForegroundColor Red
    }
} else {
    Write-Host "   [OK] Nenhum uso problematico de localStorage encontrado" -ForegroundColor Green
}

# 2. Verificar multiplos setInterval no modulo de chat
Write-Host "`n2. Verificando setInterval no modulo de chat..." -ForegroundColor Yellow
$chatFiles = Get-ChildItem -Recurse -Include *Chat*.tsx,*WhatsApp*.tsx,*Evolution*.tsx,*chat*.ts,*whatsapp*.ts -ErrorAction SilentlyContinue
$chatSetIntervals = $chatFiles | Select-String -Pattern "setInterval"
$allSetIntervals = (Get-ChildItem -Recurse -Include *.ts,*.tsx -ErrorAction SilentlyContinue | Select-String -Pattern "setInterval").Count

if ($chatSetIntervals.Count -gt 3) {
    $warnings += "[AVISO] Muitos setInterval no modulo de chat ($($chatSetIntervals.Count))"
    Write-Host ("   [AVISO] {0} setInterval encontrados no modulo de chat" -f $chatSetIntervals.Count) -ForegroundColor Yellow
    Write-Host "   Arquivos:" -ForegroundColor Cyan
    $chatSetIntervals | ForEach-Object {
        Write-Host ("      - {0}:{1}" -f $_.Path,$_.LineNumber) -ForegroundColor Gray
    }
} else {
    Write-Host ("   [OK] Quantidade razoavel de setInterval no chat ({0})" -f $chatSetIntervals.Count) -ForegroundColor Green
}

Write-Host ("   Total de setInterval no projeto: {0}" -f $allSetIntervals) -ForegroundColor Gray

# 3. Verificar uso de KV Store para dados permanentes
Write-Host "`n3. Verificando KV Store..." -ForegroundColor Yellow
$kvStoreFiles = Get-ChildItem -Recurse -Include *.ts |
    Select-String -Pattern "kv\.set" | Where-Object {
        $_.Line -notmatch "cache:" -and
        $_.Line -notmatch "temp:" -and
        $_.Line -notmatch "process:" -and
        $_.Line -notmatch "lock:" -and
        $_.Line -notmatch "queue:"
    }

if ($kvStoreFiles) {
    $errors += "[ERRO] KV Store usado para dados permanentes (ver REGRA_KV_STORE_VS_SQL.md)"
    foreach ($file in $kvStoreFiles) {
        Write-Host ("   [ALERTA] {0}:{1} - {2}" -f $file.Path,$file.LineNumber,$file.Line.Trim()) -ForegroundColor Red
    }
} else {
    Write-Host "   [OK] Nenhum uso problematico de KV Store encontrado" -ForegroundColor Green
}

# 4. Verificar uso de X-Auth-Token no WhatsApp
Write-Host "`n4. Verificando X-Auth-Token no modulo WhatsApp..." -ForegroundColor Yellow
$whatsappFiles = Get-ChildItem -Recurse -Include *whatsapp*,*evolution*,*Chat*.ts,*Chat*.tsx -ErrorAction SilentlyContinue |
    Select-String -Pattern "X-Auth-Token"
$apiFiles = Get-ChildItem -Recurse -Include *whatsappChatApi.ts,*evolutionContactsService.ts,*api.ts -ErrorAction SilentlyContinue |
    Select-String -Pattern "X-Auth-Token"
$allWhatsappFiles = @($whatsappFiles) + @($apiFiles) | Where-Object { $_ -ne $null }

if ($allWhatsappFiles.Count -gt 0) {
    Write-Host ("   [OK] X-Auth-Token encontrado ({0} ocorrencias)" -f $allWhatsappFiles.Count) -ForegroundColor Green
} else {
    $warnings += "[AVISO] X-Auth-Token nao encontrado em arquivos do WhatsApp"
    Write-Host "   [AVISO] X-Auth-Token nao encontrado" -ForegroundColor Yellow
}

# 5. Verificar se CORS esta correto
Write-Host "`n5. Verificando configuracao de CORS..." -ForegroundColor Yellow
$corsFiles = Get-ChildItem -Recurse -Include *index.ts,*server.ts -ErrorAction SilentlyContinue |
    Select-String -Pattern "cors\(" -Context 0,5 |
    Where-Object {
        $_.Line -match "credentials.*true" -or
        ($_.Context.PostContext -join "`n") -match "credentials.*true"
    }

if ($corsFiles) {
    $errors += "[ERRO] credentials: true encontrado no CORS (ver SOLUCAO_SIMPLES_CORS_LOGIN_20251120.md)"
    foreach ($file in $corsFiles) {
        Write-Host ("   [ALERTA] {0}:{1} - revisar configuracao CORS" -f $file.Path,$file.LineNumber) -ForegroundColor Red
    }
} else {
    Write-Host "   [OK] CORS esta configurado sem credentials: true" -ForegroundColor Green
}

# Resumo
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "[RESUMO] Resultado da validacao" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "[SUCESSO] Todas as verificacoes passaram" -ForegroundColor Green
    exit 0
} else {
    if ($errors.Count -gt 0) {
        Write-Host ("`n[ERROS] {0} problema(s) encontrado(s):" -f $errors.Count) -ForegroundColor Red
        foreach ($error in $errors) {
            Write-Host ("   - {0}" -f $error) -ForegroundColor Red
        }
    }

    if ($warnings.Count -gt 0) {
        Write-Host ("`n[AVISOS] {0} ponto(s) de atencao:" -f $warnings.Count) -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host ("   - {0}" -f $warning) -ForegroundColor Yellow
        }
    }

    Write-Host "`nConsulte:" -ForegroundColor Cyan
    Write-Host "   - CHECKLIST_ANTES_DE_MUDAR_CODIGO.md" -ForegroundColor Cyan
    Write-Host "   - REGRAS_ESTABELECIDAS_REFERENCIA_RAPIDA.md" -ForegroundColor Cyan
    Write-Host "   - Ligando os motores.md" -ForegroundColor Cyan

    exit 1
}

