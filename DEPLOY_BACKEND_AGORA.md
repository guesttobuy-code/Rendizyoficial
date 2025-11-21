# 🚀 Deploy do Backend - Correções de Webhook

## Status
✅ Colunas criadas no banco (`webhook_url`, `webhook_events`, `webhook_by_events`)
✅ Código corrigido e commitado
⏳ **Aguardando deploy do backend**

## Como Fazer Deploy

### Opção 1: Via Supabase Dashboard (Mais Fácil)

1. Acesse: https://supabase.com/dashboard/project/odcgnzfremrqnvtitpcc/functions
2. Encontre a função `rendizy-server`
3. Clique em **"..."** → **"Redeploy"** ou **"Edit"**
4. Aguarde o deploy finalizar (1-2 minutos)

### Opção 2: Via npx (CLI sem instalação)

```powershell
# Na raiz do projeto
cd "C:\Users\rafae\Downloads\Rendizy2producao-main github 15 11 2025\Rendizy2producao-main"

# Login (se necessário)
npx supabase login

# Link com projeto
npx supabase link --project-ref odcgnzfremrqnvtitpcc

# Deploy
npx supabase functions deploy rendizy-server
```

### Opção 3: Via Git Push (Auto-deploy)

Se o Supabase estiver configurado para auto-deploy via Git:
- O push já foi feito ✅
- Aguarde 1-2 minutos para o deploy automático

## Verificar Deploy

Após o deploy, teste:

```powershell
# Health check
Invoke-RestMethod -Uri "https://odcgnzfremrqnvtitpcc.supabase.co/functions/v1/rendizy-server/make-server-67caf26a/health"
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "timestamp": "...",
  "service": "Rendizy Backend API"
}
```

## Testar Webhook

Após o deploy:
1. Acesse: https://rendizy2producao-am7c.vercel.app/settings
2. Vá em **Integrações → WhatsApp → Webhooks**
3. Ative o switch **"Webhook por Evento"**
4. Clique em **"Ativar Webhook"**
5. Deve funcionar sem erro 500 agora! ✅

