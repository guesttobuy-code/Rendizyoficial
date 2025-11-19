# 🔄 ATUALIZAR DEPLOY - WhatsApp Correções

**Data:** 2025-11-16

---

## ✅ SITUAÇÃO ATUAL

Você já tem o backend deployado via Dashboard do Supabase.  
✅ **Backend já está rodando em produção!**

---

## ⚠️ IMPORTANTE: CORREÇÕES AINDA NÃO DEPLOYADAS

As correções que fiz estão no **código local**, mas:

❌ **Ainda NÃO foram deployadas para produção!**

### **O que foi corrigido localmente:**

1. ✅ Imports corrigidos (`index.ts`)
2. ✅ Rotas duplicadas removidas (`routes-whatsapp-evolution.ts`)
3. ✅ Funções inexistentes corrigidas (`routes-whatsapp-evolution.ts`)
4. ✅ Campo `updated_at` removido (`routes-chat.ts`, `evolution-credentials.ts`)
5. ✅ Webhooks dinâmicos implementados (`routes-whatsapp-evolution.ts`)
6. ✅ Variáveis padronizadas (`evolution-credentials.ts`)

### **O que precisa fazer:**

🔄 **Fazer upload das correções para produção!**

---

## 🚀 COMO ATUALIZAR O DEPLOY

### **Opção A: Atualizar via Dashboard (Mesma Forma)**

**Como o backend já está deployado, você pode:**

1. ✅ **Acessar:** https://supabase.com/dashboard/project/odcgnzfremrqnvtitpcc/functions/rendizy-server

2. ✅ **Procurar botão:**
   - **"Update Function"** OU
   - **"Redeploy"** OU
   - **"Edit"** OU
   - **"Deploy New Version"**

3. ✅ **Fazer upload novamente:**
   - Compactar pasta: `supabase/functions/rendizy-server/` em ZIP
   - Fazer upload do ZIP
   - Ou arrastar arquivos atualizados

4. ✅ **Deploy!**

5. ✅ **Aguarde 1-2 minutos**

---

### **Opção B: Gerar ZIP das Correções**

Posso criar um script que:
1. ✅ Compacta apenas os arquivos corrigidos
2. ✅ Cria ZIP pronto para upload
3. ✅ Você faz upload no Dashboard

Quer que eu crie esse script?

---

## 📋 CHECKLIST: O QUE ATUALIZAR

### **Arquivos que foram corrigidos:**

1. ✅ `supabase/functions/rendizy-server/index.ts`
   - Imports corrigidos

2. ✅ `supabase/functions/rendizy-server/routes-whatsapp-evolution.ts`
   - Rotas duplicadas removidas
   - Funções corrigidas
   - Webhooks dinâmicos

3. ✅ `supabase/functions/rendizy-server/routes-chat.ts`
   - Campo `updated_at` removido
   - Webhook configurado dinamicamente

4. ✅ `supabase/functions/rendizy-server/evolution-credentials.ts`
   - Campo `updated_at` removido
   - Variáveis padronizadas

5. ✅ `supabase/functions/rendizy-server/kv_store.tsx`
   - Hardcodes removidos

### **O que fazer:**

🔄 **Fazer upload de TODOS os arquivos da pasta:**
```
supabase/functions/rendizy-server/
```

(Incluindo todos os arquivos, não só os corrigidos)

---

## 🔍 VERIFICAR SE PRECISA ATUALIZAR

### **Teste 1: Verificar se erro `updated_at` ainda existe**

**Acesse:**
```
https://odcgnzfremrqnvtitpcc.supabase.co/functions/v1/rendizy-server/make-server-67caf26a/whatsapp/qr-code
```

**Resultado esperado ANTES das correções:**
```json
{
  "error": "record 'new' has no field 'updated_at'"
}
```

**Resultado esperado DEPOIS das correções:**
```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,...",
    "expiresAt": "2025-11-16T..."
  }
}
```

### **Teste 2: Verificar Health Check**

**Acesse:**
```
https://odcgnzfremrqnvtitpcc.supabase.co/functions/v1/rendizy-server/make-server-67caf26a/whatsapp/health
```

**Resultado esperado:**
```json
{
  "status": "ok",
  "config": {
    "hasUrl": true,
    "hasInstance": true,
    "hasGlobalKey": true,
    "hasToken": true
  }
}
```

---

## ⚠️ ATENÇÃO: VARIÁVEIS DE AMBIENTE

Após fazer deploy das correções, verifique se as variáveis de ambiente estão configuradas:

**No Dashboard do Supabase:**
- Settings → Environment Variables da função `rendizy-server`

**Variáveis necessárias:**
```
EVOLUTION_API_URL=https://evo.boravendermuito.com.br
EVOLUTION_INSTANCE_NAME=TESTE
EVOLUTION_GLOBAL_API_KEY=sua-chave-aqui
EVOLUTION_INSTANCE_TOKEN=seu-token-aqui
EVOLUTION_WEBHOOK_BASE_URL=https://odcgnzfremrqnvtitpcc.supabase.co/functions/v1/rendizy-server
```

---

## 🎯 PRÓXIMOS PASSOS

### **Opção 1: Atualizar Agora**

1. ✅ Gerar ZIP da pasta atualizada
2. ✅ Fazer upload no Dashboard
3. ✅ Deploy
4. ✅ Testar

### **Opção 2: Testar Local Primeiro (Recomendado)**

1. ✅ Testar localmente se tudo funciona
2. ✅ Validar correções
3. ✅ Depois fazer deploy para produção

---

## 💡 RESUMO

**Situação:**
- ✅ Backend já está deployado (via Dashboard)
- ⚠️ Correções estão apenas no código local
- 🔄 **Precisa fazer upload das correções**

**Ação necessária:**
- 🔄 Atualizar deploy com código corrigido
- ⚠️ Verificar variáveis de ambiente
- ✅ Testar se funcionou

---

**Quer que eu:**
1. 🔄 Crie script para gerar ZIP pronto?
2. 🧪 Ajuda a testar localmente primeiro?
3. 📋 Mostre passo a passo de atualização?

**Diga qual você prefere!** 🚀

