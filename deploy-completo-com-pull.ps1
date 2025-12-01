# Deploy completo com pull antes do push
$log = "C:\Users\rafae\OneDrive\Desktop\RENDIZY PASTA OFICIAL\powershell-outputs.txt"
Set-Location "C:\Users\rafae\OneDrive\Desktop\RENDIZY PASTA OFICIAL"

function Executar {
    param([string]$cmd, [string]$desc)
    $ts = Get-Date -Format "HH:mm:ss"
    "`n[$ts] $desc" | Out-File $log -Append -Encoding UTF8
    "Comando: $cmd" | Out-File $log -Append -Encoding UTF8
    "---" | Out-File $log -Append -Encoding UTF8
    $result = Invoke-Expression $cmd 2>&1 | Out-String
    $result | Out-File $log -Append -Encoding UTF8
    "Exit: $LASTEXITCODE" | Out-File $log -Append -Encoding UTF8
    Write-Host "[$ts] $desc" -ForegroundColor Cyan
    return $result
}

Write-Host "=== DEPLOY COMPLETO COM PULL ===" -ForegroundColor Cyan

# 1. Verificar branch
$branch = git branch --show-current
if ($branch -eq "master") {
    Write-Host "Renomeando master para main..." -ForegroundColor Yellow
    git branch -m master main
    $branch = "main"
}

# 2. Adicionar arquivos
Executar "git add -A" "1. Adicionando arquivos"

# 3. Commit (se houver mudanças)
$status = git status --porcelain
if ($status) {
    Executar 'git commit -m "feat: Deploy completo - Cadeados + Scripts PowerShell"' "2. Commit"
} else {
    "[$(Get-Date -Format 'HH:mm:ss')] Nenhuma mudança para commitar" | Out-File $log -Append -Encoding UTF8
    Write-Host "Nenhuma mudança para commitar" -ForegroundColor Gray
}

# 4. Pull primeiro (integrar mudanças remotas)
Executar "git pull origin $branch --allow-unrelated-histories --no-edit" "3. Pull (integrar mudanças remotas)"

# 5. Push
Executar "git push -u origin $branch" "4. Push para GitHub"

Write-Host "`n✅ Deploy concluído! Log: $log" -ForegroundColor Green
