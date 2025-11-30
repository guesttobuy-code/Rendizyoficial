# Script para Inicializar Git e Fazer Deploy Completo no GitHub
# Configura tudo do zero se necessario

Write-Host "=== SETUP GIT E DEPLOY PARA GITHUB ===" -ForegroundColor Cyan
Write-Host ""

$projectPath = "C:\Users\rafae\OneDrive\Desktop\RENDIZY PASTA OFICIAL"
Set-Location $projectPath

# 1. Verificar se ja e um repositorio Git
Write-Host "1. Verificando se ja e um repositorio Git..." -ForegroundColor Yellow
$isGitRepo = git rev-parse --git-dir 2>$null

if (-not $isGitRepo) {
    Write-Host "   Nao e um repositorio Git. Inicializando..." -ForegroundColor Yellow
    git init
    Write-Host "   Repositorio Git inicializado!" -ForegroundColor Green
} else {
    Write-Host "   Repositorio Git ja existe!" -ForegroundColor Green
}
Write-Host ""

# 2. Verificar branch atual
Write-Host "2. Verificando branch..." -ForegroundColor Yellow
$currentBranch = git branch --show-current
if (-not $currentBranch) {
    Write-Host "   Criando branch main..." -ForegroundColor Yellow
    git checkout -b main 2>$null
    $currentBranch = "main"
}
Write-Host "   Branch atual: $currentBranch" -ForegroundColor Cyan
Write-Host ""

# 3. Verificar remote
Write-Host "3. Verificando remote do GitHub..." -ForegroundColor Yellow
$remote = git remote get-url origin 2>$null

# Credenciais do GitHub (do documento "Ligando os motores.md")
$githubToken = "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"
$githubRepo = "guesttobuy-code/Rendizyoficial"
$githubUrl = "https://${githubToken}@github.com/${githubRepo}.git"
$githubUrlPublic = "https://github.com/${githubRepo}.git"

if (-not $remote) {
    Write-Host "   Nenhum remote configurado!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Configurando automaticamente com credenciais do projeto..." -ForegroundColor Cyan
    Write-Host "   Repositorio: $githubRepo" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "   Adicionando remote..." -ForegroundColor Yellow
    git remote add origin $githubUrl
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   Remote adicionado com sucesso!" -ForegroundColor Green
        Write-Host "   URL: $githubUrlPublic" -ForegroundColor Gray
    } else {
        Write-Host "   Erro ao adicionar remote." -ForegroundColor Red
        exit 1
    }
} else {
    # Verificar se precisa atualizar
    if ($remote -notlike "*${githubRepo}*") {
        Write-Host "   Remote existe mas aponta para outro repositorio:" -ForegroundColor Yellow
        Write-Host "   Atual: $remote" -ForegroundColor Gray
        Write-Host "   Atualizando para: $githubRepo" -ForegroundColor Yellow
        git remote set-url origin $githubUrl
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   Remote atualizado com sucesso!" -ForegroundColor Green
        }
    } else {
        Write-Host "   Remote ja configurado: $githubUrlPublic" -ForegroundColor Green
    }
}
Write-Host ""

# 4. Adicionar todos os arquivos
Write-Host "4. Adicionando todos os arquivos..." -ForegroundColor Yellow
git add -A
$stagedFiles = git diff --cached --name-only
if ($stagedFiles) {
    Write-Host "   Arquivos adicionados ao staging!" -ForegroundColor Green
} else {
    Write-Host "   Nenhum arquivo novo para adicionar." -ForegroundColor Gray
}
Write-Host ""

# 5. Verificar se ha mudancas para commitar
Write-Host "5. Verificando mudancas..." -ForegroundColor Yellow
$status = git status --porcelain
if ($status) {
    Write-Host "   Mudancas encontradas:" -ForegroundColor Cyan
    git status --short
    Write-Host ""
    
    # 6. Fazer commit
    Write-Host "6. Fazendo commit..." -ForegroundColor Yellow
    $commitMessage = @"
feat: Implementar cadeados em todas as capsulas + Corrigir routes-organizations

- Implementado cadeados completos (3 niveis) em: WhatsApp, Auth, Reservations, Properties
- Implementado cadeados minimos em: Dashboard, Calendar, Guests, Locations, Settings, Pricing, Integrations, ClientSites
- Corrigido routes-organizations.ts: Removido uso de KV Store (agora usa apenas SQL)
- Corrigido erros de sintaxe (}); incorretos em funcoes exportadas)
- Deploy Supabase realizado com sucesso
- Total: 12 capsulas protegidas
"@
    
    git commit -m $commitMessage
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   Commit realizado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "   Erro ao fazer commit." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "   Nenhuma mudanca para commitar." -ForegroundColor Gray
    Write-Host "   Todos os arquivos ja estao commitados." -ForegroundColor Gray
}
Write-Host ""

# 7. Verificar se tem remote para fazer push
Write-Host "7. Verificando remote antes do push..." -ForegroundColor Yellow
$remote = git remote get-url origin 2>$null

# Se remote nao existe, configurar agora
if (-not $remote) {
    Write-Host "   Remote nao encontrado. Configurando agora..." -ForegroundColor Yellow
    git remote add origin $githubUrl
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   Remote configurado com sucesso!" -ForegroundColor Green
        $remote = $githubUrlPublic
    } else {
        Write-Host "   Erro ao configurar remote." -ForegroundColor Red
        exit 1
    }
}

if ($remote) {
    Write-Host "   Fazendo push para GitHub..." -ForegroundColor Yellow
    Write-Host "   Remote: $githubUrlPublic" -ForegroundColor Gray
    Write-Host "   Branch: $currentBranch" -ForegroundColor Gray
    Write-Host ""
    
    # Tentar push normal primeiro
    git push origin $currentBranch
    
    # Se falhar, tentar com -u (primeira vez)
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "   Tentando push com upstream..." -ForegroundColor Yellow
        git push -u origin $currentBranch
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "=== DEPLOY CONCLUIDO COM SUCESSO! ===" -ForegroundColor Green
        Write-Host "Codigo sincronizado com GitHub!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "Erro ao fazer push. Possiveis causas:" -ForegroundColor Red
        Write-Host "  - Credenciais do GitHub nao configuradas" -ForegroundColor Yellow
        Write-Host "  - Repositorio nao existe no GitHub" -ForegroundColor Yellow
        Write-Host "  - Sem permissoes de escrita" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Solucoes:" -ForegroundColor Cyan
        Write-Host "  1. Configure autenticacao (token ou SSH)" -ForegroundColor White
        Write-Host "  2. Crie o repositorio no GitHub se ainda nao existir" -ForegroundColor White
        Write-Host "  3. Verifique a URL do remote: git remote -v" -ForegroundColor White
    }
} else {
    Write-Host "   Erro: Nao foi possivel configurar remote." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== PROCESSO CONCLUIDO ===" -ForegroundColor Cyan
Write-Host ""
