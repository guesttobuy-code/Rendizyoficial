# Script para Deploy Completo no GitHub com Outputs Salvos
# Salva todos os outputs em arquivo para o Auto ler

$outputFile = "C:\Users\rafae\OneDrive\Desktop\RENDIZY PASTA OFICIAL\deploy-github-output.txt"
$projectPath = "C:\Users\rafae\OneDrive\Desktop\RENDIZY PASTA OFICIAL"

# Limpar arquivo anterior
"" | Out-File -FilePath $outputFile -Encoding UTF8

function Write-ToFile {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp | $Message" | Out-File -FilePath $outputFile -Append -Encoding UTF8
}

function Write-Output-Both {
    param([string]$Message, [string]$Color = "White")
    Write-ToFile $Message
    Write-Host $Message -ForegroundColor $Color
}

Write-Output-Both "=== DEPLOY COMPLETO PARA GITHUB ===" "Cyan"
Write-Output-Both "Iniciado em: $(Get-Date)" "Gray"
Write-Output-Both ""

Set-Location $projectPath

# 1. Verificar se é repositório Git
Write-Output-Both "1. Verificando se é repositório Git..." "Yellow"
$isGitRepo = git rev-parse --git-dir 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Output-Both "   Não é um repositório Git. Inicializando..." "Yellow"
    $initOutput = git init 2>&1 | Out-String
    Write-ToFile "   Output: $initOutput"
    Write-Host "   Repositório Git inicializado!" -ForegroundColor Green
} else {
    Write-Output-Both "   ✅ Repositório Git já existe!" "Green"
}
Write-Output-Both ""

# 2. Verificar branch
Write-Output-Both "2. Verificando branch..." "Yellow"
$currentBranch = git branch --show-current 2>&1 | Out-String
$currentBranch = $currentBranch.Trim()
if (-not $currentBranch -or $currentBranch -eq "") {
    Write-Output-Both "   Criando branch main..." "Yellow"
    git checkout -b main 2>&1 | Out-Null
    $currentBranch = "main"
}
Write-Output-Both "   Branch atual: $currentBranch" "Cyan"
Write-Output-Both ""

# 3. Verificar/configurar remote
Write-Output-Both "3. Verificando remote do GitHub..." "Yellow"
$remote = git remote get-url origin 2>&1 | Out-String
$remote = $remote.Trim()

$githubToken = "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"
$githubRepo = "guesttobuy-code/Rendizyoficial"
$githubUrl = "https://${githubToken}@github.com/${githubRepo}.git"
$githubUrlPublic = "https://github.com/${githubRepo}.git"

if (-not $remote -or $remote -like "*error*" -or $remote -eq "") {
    Write-Output-Both "   Nenhum remote configurado!" "Yellow"
    Write-Output-Both "   Configurando automaticamente..." "Cyan"
    $remoteOutput = git remote add origin $githubUrl 2>&1 | Out-String
    Write-ToFile "   Output: $remoteOutput"
    Write-Output-Both "   ✅ Remote adicionado: $githubUrlPublic" "Green"
} else {
    if ($remote -notlike "*${githubRepo}*") {
        Write-Output-Both "   Remote existe mas aponta para outro repositório" "Yellow"
        Write-Output-Both "   Atual: $remote" "Gray"
        $updateOutput = git remote set-url origin $githubUrl 2>&1 | Out-String
        Write-ToFile "   Output: $updateOutput"
        Write-Output-Both "   ✅ Remote atualizado!" "Green"
    } else {
        Write-Output-Both "   ✅ Remote já configurado: $githubUrlPublic" "Green"
    }
}
Write-Output-Both ""

# 4. Status do Git
Write-Output-Both "4. Verificando status do Git..." "Yellow"
$statusOutput = git status --porcelain 2>&1 | Out-String
Write-ToFile "   Status: $statusOutput"

if ($statusOutput -and $statusOutput.Trim() -ne "") {
    Write-Output-Both "   Mudanças encontradas!" "Cyan"
    Write-ToFile "   Mudanças: $statusOutput"
} else {
    Write-Output-Both "   Nenhuma mudança pendente." "Gray"
}
Write-Output-Both ""

# 5. Adicionar todos os arquivos
Write-Output-Both "5. Adicionando todos os arquivos..." "Yellow"
$addOutput = git add -A 2>&1 | Out-String
Write-ToFile "   Output: $addOutput"
$stagedFiles = git diff --cached --name-only 2>&1 | Out-String
if ($stagedFiles -and $stagedFiles.Trim() -ne "") {
    Write-Output-Both "   ✅ Arquivos adicionados ao staging!" "Green"
    Write-ToFile "   Arquivos staged: $stagedFiles"
} else {
    Write-Output-Both "   Nenhum arquivo novo para adicionar." "Gray"
}
Write-Output-Both ""

# 6. Verificar se precisa fazer pull
Write-Output-Both "6. Verificando se precisa fazer pull..." "Yellow"
$fetchOutput = git fetch origin $currentBranch 2>&1 | Out-String
Write-ToFile "   Fetch output: $fetchOutput"

$localCommit = git rev-parse HEAD 2>&1 | Out-String
$remoteCommit = git rev-parse "origin/$currentBranch" 2>&1 | Out-String

Write-ToFile "   Local commit: $localCommit"
Write-ToFile "   Remote commit: $remoteCommit"

if ($remoteCommit -and $remoteCommit.Trim() -ne "" -and $localCommit.Trim() -ne $remoteCommit.Trim()) {
    Write-Output-Both "   Repositório remoto tem mudanças. Fazendo pull..." "Yellow"
    $pullOutput = git pull origin $currentBranch --allow-unrelated-histories --no-edit 2>&1 | Out-String
    Write-ToFile "   Pull output: $pullOutput"
    if ($LASTEXITCODE -eq 0) {
        Write-Output-Both "   ✅ Pull realizado com sucesso!" "Green"
    } else {
        Write-Output-Both "   ⚠️ ATENÇÃO: Possíveis conflitos detectados." "Red"
        Write-ToFile "   Erro no pull: $pullOutput"
    }
} else {
    Write-Output-Both "   ✅ Repositório local está atualizado." "Green"
}
Write-Output-Both ""

# 7. Fazer commit
Write-Output-Both "7. Fazendo commit..." "Yellow"
$commitMessage = @"
feat: Implementar cadeados em todas as capsulas + Corrigir routes-organizations

- Implementado cadeados completos (3 niveis) em: WhatsApp, Auth, Reservations, Properties
- Implementado cadeados minimos em: Dashboard, Calendar, Guests, Locations, Settings, Pricing, Integrations, ClientSites
- Corrigido routes-organizations.ts: Removido uso de KV Store (agora usa apenas SQL)
- Corrigido erros de sintaxe (}); incorretos em funcoes exportadas)
- Deploy Supabase realizado com sucesso
- Total: 12 capsulas protegidas
- Scripts de teste PowerShell criados
"@

$commitOutput = git commit -m $commitMessage 2>&1 | Out-String
Write-ToFile "   Commit output: $commitOutput"

if ($LASTEXITCODE -eq 0) {
    Write-Output-Both "   ✅ Commit realizado com sucesso!" "Green"
} else {
    if ($commitOutput -like "*nothing to commit*" -or $commitOutput -like "*no changes*") {
        Write-Output-Both "   ℹ️ Nenhuma mudança para commitar (já está tudo commitado)." "Gray"
    } else {
        Write-Output-Both "   ❌ Erro ao fazer commit." "Red"
        Write-ToFile "   Erro: $commitOutput"
    }
}
Write-Output-Both ""

# 8. Fazer push
Write-Output-Both "8. Fazendo push para GitHub..." "Yellow"
Write-Output-Both "   Remote: $githubUrlPublic" "Gray"
Write-Output-Both "   Branch: $currentBranch" "Gray"
Write-Output-Both ""

$pushOutput = git push origin $currentBranch 2>&1 | Out-String
Write-ToFile "   Push output: $pushOutput"

if ($LASTEXITCODE -ne 0) {
    Write-Output-Both "   Tentando push com upstream..." "Yellow"
    $pushOutput2 = git push -u origin $currentBranch 2>&1 | Out-String
    Write-ToFile "   Push com -u output: $pushOutput2"
    $pushOutput = $pushOutput2
}

if ($LASTEXITCODE -eq 0) {
    Write-Output-Both "" "White"
    Write-Output-Both "=== ✅ DEPLOY CONCLUÍDO COM SUCESSO! ===" "Green"
    Write-Output-Both "Código sincronizado com GitHub!" "Green"
    Write-Output-Both "Repositório: $githubUrlPublic" "Cyan"
} else {
    Write-Output-Both "" "White"
    Write-Output-Both "❌ Erro ao fazer push." "Red"
    Write-Output-Both "Possíveis causas:" "Yellow"
    Write-Output-Both "  - Credenciais do GitHub não configuradas" "Yellow"
    Write-Output-Both "  - Repositório não existe no GitHub" "Yellow"
    Write-Output-Both "  - Sem permissões de escrita" "Yellow"
    Write-ToFile "   Erro completo: $pushOutput"
}

Write-Output-Both "" "White"
Write-Output-Both "=== PROCESSO CONCLUÍDO ===" "Cyan"
Write-Output-Both "Arquivo de log: $outputFile" "Gray"
Write-Output-Both "O Auto pode ler este arquivo para ver todos os detalhes." "Yellow"
