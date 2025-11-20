# 📱 CREDENCIAIS WHATSAPP - EVOLUTION API

**Data:** 2024-11-20  
**Status:** ⚠️ Credenciais hardcoded foram removidas por segurança

---

## ⚠️ IMPORTANTE - SEGURANÇA

As credenciais abaixo foram **hardcoded no código** até a versão v1.0.103.316 e foram **removidas** por questões de segurança na versão v1.0.103.317.

**⚠️ Estas credenciais NÃO devem ser usadas em produção!** Elas foram expostas no repositório e devem ser rotacionadas.

---

## 📋 CREDENCIAIS CORRETAS (Produção)

### **Credenciais da Evolution API (Atuais):**

```
URL: https://evo.boravendermuito.com.br
Instance Name: Rafael Rendizy Google teste
Global API Key: 4de7861e944e291b56fe9781d2b00b36
Instance Token: E8496913-161D-4220-ADB6-7640EC2047F9
```

**Status:** ✅ **CREDENCIAIS CORRETAS**  
**Atualizado:** 2024-11-20  
**Nota:** Credenciais históricas incorretas foram removidas abaixo.

---

## ✅ ONDE AS CREDENCIAIS DEVEM ESTAR AGORA

### **1. Banco de Dados SQL (`organization_channel_config`)**

As credenciais devem ser salvas na tabela `organization_channel_config`:

```sql
SELECT 
  organization_id,
  whatsapp_enabled,
  whatsapp_api_url,
  whatsapp_instance_name,
  whatsapp_api_key,
  whatsapp_instance_token,
  whatsapp_connected,
  updated_at
FROM organization_channel_config
WHERE organization_id = 'SEU_ORGANIZATION_ID';
```

### **2. Variáveis de Ambiente (Supabase Secrets)**

As credenciais podem estar configuradas como Secrets no Supabase:

- `EVOLUTION_API_URL`
- `EVOLUTION_INSTANCE_NAME`
- `EVOLUTION_GLOBAL_API_KEY`
- `EVOLUTION_INSTANCE_TOKEN`

**Onde configurar:**
- Dashboard: https://supabase.com/dashboard/project/odcgnzfremrqnvtitpcc/settings/functions
- Vá em "Edge Functions" > "Secrets"

---

## 🔍 COMO VERIFICAR CREDENCIAIS SALVAS

### **Opção 1: Via Interface do Sistema**

1. Acesse: https://rendizy2producao-am7c.vercel.app
2. Faça login
3. Vá em: **Configurações** → **Integrações** → **WhatsApp**
4. Veja as credenciais preenchidas no formulário

### **Opção 2: Via Supabase Dashboard**

1. Acesse: https://supabase.com/dashboard/project/odcgnzfremrqnvtitpcc
2. Vá em: **Table Editor** → `organization_channel_config`
3. Verifique os registros salvos

### **Opção 3: Via SQL Query**

```sql
-- Ver todas as configurações de WhatsApp
SELECT 
  organization_id,
  whatsapp_api_url,
  whatsapp_instance_name,
  CASE 
    WHEN whatsapp_api_key IS NOT NULL AND whatsapp_api_key != '' 
    THEN '***PRESENTE***' 
    ELSE 'VAZIO' 
  END as api_key_status,
  CASE 
    WHEN whatsapp_instance_token IS NOT NULL AND whatsapp_instance_token != '' 
    THEN '***PRESENTE***' 
    ELSE 'VAZIO' 
  END as instance_token_status,
  whatsapp_connected,
  updated_at
FROM organization_channel_config
WHERE whatsapp_enabled = true
ORDER BY updated_at DESC;
```

---

## 📝 COMO SALVAR CREDENCIAIS NOVAS

### **Via Interface (Recomendado):**

1. Acesse: **Configurações** → **Integrações** → **WhatsApp**
2. Preencha os campos:
   - **URL da Evolution API:** `https://sua-url.com`
   - **Instance Name:** `SeuNome`
   - **Global API Key:** `sua-api-key`
   - **Instance Token:** `seu-instance-token`
3. Clique em **"Salvar Configurações"**
4. ✅ Credenciais serão salvas automaticamente no banco de dados

### **Via SQL (Direto no Banco):**

```sql
-- Inserir ou atualizar credenciais
INSERT INTO organization_channel_config (
  organization_id,
  whatsapp_enabled,
  whatsapp_api_url,
  whatsapp_instance_name,
  whatsapp_api_key,
  whatsapp_instance_token
) VALUES (
  '00000000-0000-0000-0000-000000000001', -- Seu organization_id
  true,
  'https://sua-url.com',
  'SeuNome',
  'sua-api-key',
  'seu-instance-token'
)
ON CONFLICT (organization_id) 
DO UPDATE SET
  whatsapp_api_url = EXCLUDED.whatsapp_api_url,
  whatsapp_instance_name = EXCLUDED.whatsapp_instance_name,
  whatsapp_api_key = EXCLUDED.whatsapp_api_key,
  whatsapp_instance_token = EXCLUDED.whatsapp_instance_token,
  whatsapp_enabled = EXCLUDED.whatsapp_enabled,
  updated_at = NOW();
```

### **Via API REST:**

```bash
PATCH https://odcgnzfremrqnvtitpcc.supabase.co/functions/v1/rendizy-server/chat/channels/config

Headers:
  Authorization: Bearer SEU_TOKEN
  Content-Type: application/json

Body:
{
  "whatsapp": {
    "enabled": true,
    "api_url": "https://sua-url.com",
    "instance_name": "SeuNome",
    "api_key": "sua-api-key",
    "instance_token": "seu-instance-token"
  }
}
```

---

## 🔒 SEGURANÇA E BOAS PRÁTICAS

### **✅ O que fazer:**
- ✅ Salvar credenciais no banco de dados (`organization_channel_config`)
- ✅ Usar variáveis de ambiente como fallback
- ✅ Rotacionar credenciais periodicamente
- ✅ Não commitar credenciais no Git
- ✅ Usar interface do sistema para atualizar

### **❌ O que NÃO fazer:**
- ❌ Hardcodar credenciais no código
- ❌ Commitar credenciais no Git
- ❌ Compartilhar credenciais publicamente
- ❌ Usar credenciais antigas após exposição

---

## 📊 STATUS ATUAL

| Item | Status | Onde Está |
|------|--------|-----------|
| **Credenciais antigas (hardcoded)** | ❌ Removidas | Removidas do código (v1.0.103.317) |
| **Banco de dados** | ✅ Configurado | Tabela `organization_channel_config` |
| **Interface de salvamento** | ✅ Funcionando | Página de Integrações WhatsApp |
| **Carregamento automático** | ✅ Funcionando | Preenche formulário automaticamente |

---

## 🔄 PRÓXIMOS PASSOS

1. ✅ **Verificar se há credenciais salvas no banco:**
   - Executar query SQL acima
   - Ou verificar via interface do sistema

2. ✅ **Se não houver credenciais salvas:**
   - Preencher via interface do sistema
   - Ou executar SQL acima

3. ✅ **Testar salvamento:**
   - Preencher credenciais na interface
   - Salvar
   - Recarregar página
   - Verificar se formulário é preenchido automaticamente

---

## 📝 NOTAS IMPORTANTES

1. **As credenciais antigas foram expostas** e devem ser rotacionadas na Evolution API
2. **O sistema agora salva credenciais no banco** automaticamente
3. **O formulário é preenchido automaticamente** quando há credenciais salvas
4. **Nunca mais hardcodar credenciais** no código-fonte

---

**Última atualização:** 2024-11-20  
**Documentos relacionados:**
- `TOKENS_E_ACESSOS_COMPLETO.md` - Tokens GitHub e Supabase
- `RESUMO_MELHORIAS_WHATSAPP_CREDENCIAIS.md` - Melhorias aplicadas
- `src/docs/changelogs/CHANGELOG_V1.0.103.317.md` - Remoção de hardcodes

---

**⚠️ LEMBRE-SE: As credenciais antigas devem ser rotacionadas! Elas foram expostas no repositório.**

