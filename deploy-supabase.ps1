# ============================================================================
# 🚀 Deploy Automático Supabase - Rendizy
# ============================================================================
# Este script automatiza o deploy do backend e banco de dados
#
# Uso: .\deploy-supabase.ps1
# ============================================================================

Write-Host "🚀 RENDIZY - Deploy Supabase" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$PROJECT_ID = "odcgnzfremrqnvtitpcc"
$ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kY2duemZyZW1ycW52dGl0cGNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNTQxNzEsImV4cCI6MjA3NzkzMDE3MX0.aljqrK3mKwQ6T6EB_fDPfkbP7QC_hhiZwxUZbtnqVqQ"

# ============================================================================
# 📋 Passo 1: Verificar Pré-requisitos
# ============================================================================

Write-Host "📋 Passo 1: Verificando pré-requisitos..." -ForegroundColor Yellow
Write-Host ""

# Verificar se SQL existe
if (!(Test-Path "supabase\migrations\20241112_create_channel_config.sql")) {
    Write-Host "❌ Arquivo SQL não encontrado!" -ForegroundColor Red
    Write-Host "   Esperado: supabase\migrations\20241112_create_channel_config.sql" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Arquivo SQL encontrado" -ForegroundColor Green

# Verificar se backend existe
if (!(Test-Path "supabase\functions\rendizy-server\index.ts")) {
    Write-Host "❌ Backend não encontrado!" -ForegroundColor Red
    Write-Host "   Esperado: supabase\functions\rendizy-server\index.ts" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Backend encontrado" -ForegroundColor Green
Write-Host ""

# ============================================================================
# 🗄️ Passo 2: Criar Tabela no Banco
# ============================================================================

Write-Host "🗄️ Passo 2: Criando tabela no banco de dados..." -ForegroundColor Yellow
Write-Host ""

$sql = Get-Content "supabase\migrations\20241112_create_channel_config.sql" -Raw

Write-Host "📝 SQL a ser executado:" -ForegroundColor Cyan
Write-Host $sql.Substring(0, [Math]::Min(500, $sql.Length)) + "..." -ForegroundColor Gray
Write-Host ""

Write-Host "⚠️  IMPORTANTE: Execute o SQL manualmente no Dashboard" -ForegroundColor Yellow
Write-Host ""
Write-Host "👉 Acesse: https://supabase.com/dashboard/project/$PROJECT_ID/sql/new" -ForegroundColor White
Write-Host ""
Write-Host "1. Abra o link acima" -ForegroundColor White
Write-Host "2. Cole o SQL de: supabase\migrations\20241112_create_channel_config.sql" -ForegroundColor White
Write-Host "3. Clique em RUN" -ForegroundColor White
Write-Host ""

$continue = Read-Host "Já executou o SQL? (s/n)"
if ($continue -ne "s" -and $continue -ne "S") {
    Write-Host "❌ Deploy cancelado. Execute o SQL primeiro." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Tabela criada (presumido)" -ForegroundColor Green
Write-Host ""

# ============================================================================
# ⚙️ Passo 3: Informações sobre Deploy da Edge Function
# ============================================================================

Write-Host "⚙️ Passo 3: Deploy da Edge Function" -ForegroundColor Yellow
Write-Host ""

Write-Host "📦 Opção 1 - Via Supabase CLI (Recomendado):" -ForegroundColor Cyan
Write-Host ""
Write-Host "   npm install -g supabase" -ForegroundColor Gray
Write-Host "   supabase login" -ForegroundColor Gray
Write-Host "   supabase link --project-ref $PROJECT_ID" -ForegroundColor Gray
Write-Host "   supabase functions deploy rendizy-server" -ForegroundColor Gray
Write-Host ""

Write-Host "📦 Opção 2 - Via Dashboard:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   1. Acesse: https://supabase.com/dashboard/project/$PROJECT_ID/functions" -ForegroundColor White
Write-Host "   2. Clique em 'Deploy a new function'" -ForegroundColor White
Write-Host "   3. Name: rendizy-server" -ForegroundColor White
Write-Host "   4. Upload pasta: supabase\functions\rendizy-server\" -ForegroundColor White
Write-Host "   5. Clique em Deploy" -ForegroundColor White
Write-Host ""

Write-Host "⚠️  O deploy pode levar 1-2 minutos" -ForegroundColor Yellow
Write-Host ""

$deployed = Read-Host "Já fez o deploy da Edge Function? (s/n)"
if ($deployed -ne "s" -and $deployed -ne "S") {
    Write-Host "❌ Complete o deploy antes de continuar" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Edge Function deployada (presumido)" -ForegroundColor Green
Write-Host ""

# ============================================================================
# 🧪 Passo 4: Testar Backend
# ============================================================================

Write-Host "🧪 Passo 4: Testando backend..." -ForegroundColor Yellow
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $ANON_KEY"
}

try {
    Write-Host "📡 Testando health check..." -ForegroundColor Cyan
    $response = Invoke-RestMethod `
        -Uri "https://$PROJECT_ID.supabase.co/functions/v1/rendizy-server/make-server-67caf26a/health" `
        -Headers $headers `
        -Method Get `
        -ErrorAction Stop
    
    Write-Host "✅ Backend ONLINE!" -ForegroundColor Green
    Write-Host "   Status: $($response.status)" -ForegroundColor Gray
    Write-Host "   Service: $($response.service)" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host "❌ Backend não está respondendo!" -ForegroundColor Red
    Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Possíveis causas:" -ForegroundColor Yellow
    Write-Host "   - Edge Function não foi deployada" -ForegroundColor Yellow
    Write-Host "   - Deploy ainda está em andamento (aguarde 2 min)" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# ============================================================================
# ✅ Sucesso!
# ============================================================================

Write-Host "============================================" -ForegroundColor Green
Write-Host "✅ DEPLOY CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

Write-Host "📊 Próximos passos:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Acesse: http://localhost:3000" -ForegroundColor White
Write-Host "2. Vá em: Configurações → Integrações → WhatsApp" -ForegroundColor White
Write-Host "3. Preencha os dados e clique em 'Salvar'" -ForegroundColor White
Write-Host "4. Verifique no banco: https://supabase.com/dashboard/project/$PROJECT_ID/editor" -ForegroundColor White
Write-Host ""

Write-Host "🎉 Tudo pronto para usar!" -ForegroundColor Green
Write-Host ""



