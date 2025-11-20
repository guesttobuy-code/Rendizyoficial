# 🔒 SOLUÇÃO: Conexão WhatsApp Estável e Persistência de Dados

**Versão:** v1.0.103.960  
**Data:** 20/11/2025  
**Status:** ✅ Implementando

---

## 🎯 RESUMO EXECUTIVO

Implementação de solução completa para manter conexão WhatsApp estável, com reconexão automática e persistência adequada dos dados.

---

## 📊 SITUAÇÃO ATUAL DOS DADOS

### ✅ **O QUE ESTÁ SALVO NO BANCO:**

1. **Credenciais e Configuração** (tabela `organization_channel_config`):
   - ✅ `whatsapp_api_url`
   - ✅ `whatsapp_instance_name`
   - ✅ `whatsapp_api_key` (criptografado)
   - ✅ `whatsapp_instance_token` (criptografado)
   - ✅ `whatsapp_connected` (boolean)
   - ✅ `whatsapp_connection_status` (text)
   - ✅ `whatsapp_phone_number`
   - ✅ `whatsapp_qr_code` (base64)
   - ✅ `whatsapp_last_connected_at` (timestamp)
   - ✅ `whatsapp_error_message`

### ⚠️ **O QUE ESTÁ NO KV STORE (NÃO PERMANENTE):**

Atualmente, conversas e mensagens do WhatsApp estão sendo salvas apenas no **KV Store**, que não é ideal para persistência de longo prazo:

- ❌ Conversas (chats) - `whatsapp:chat:{org_id}:{chat_id}`
- ❌ Mensagens - `whatsapp:message:{org_id}:{message_id}`
- ❌ Contatos - `whatsapp:contact:{org_id}:{contact_id}`

**Problema:** KV Store é volátil e pode perder dados em caso de reinicialização ou falha.

---

## 🚀 SOLUÇÃO IMPLEMENTADA

### **1. Monitoramento Automático de Conexão** ✅

Serviço que monitora a conexão WhatsApp e reconecta automaticamente:

**Arquivo:** `supabase/functions/rendizy-server/services/whatsapp-monitor.ts`

**Funcionalidades:**
- ✅ Verifica status da conexão a cada 30 segundos
- ✅ Reconecta automaticamente se cair (máximo 3 tentativas)
- ✅ Atualiza status no banco de dados em tempo real
- ✅ Configura webhooks automaticamente
- ✅ Envia heartbeat para manter conexão ativa

**Uso:**
```typescript
// Iniciar monitoramento manualmente
POST /rendizy-server/whatsapp/monitor/start

// Monitoramento automático inicia quando:
// 1. WhatsApp conecta com sucesso
// 2. Usuário ativa monitoramento manual
```

### **2. Webhooks Automáticos** ✅

Webhooks são configurados automaticamente ao conectar para:
- ✅ Receber mensagens em tempo real
- ✅ Monitorar mudanças de status
- ✅ Manter conexão ativa
- ✅ Sincronizar contatos/conversas automaticamente

**Eventos configurados:**
- `MESSAGES_UPSERT` - Nova mensagem recebida
- `MESSAGES_UPDATE` - Mensagem atualizada
- `CONNECTION_UPDATE` - Status de conexão mudou
- `QRCODE_UPDATED` - QR Code atualizado
- `CONTACTS_UPSERT` - Contato atualizado
- `CHATS_UPSERT` - Conversa atualizada
- E mais...

### **3. Heartbeat/Keep-Alive** ✅

Sistema envia requisições periódicas para manter conexão ativa:
- ✅ A cada 30 segundos quando conectado
- ✅ Evita timeout de inatividade
- ✅ Detecta desconexões rapidamente

### **4. Reconexão Automática** ✅

Quando conexão cair:
1. ✅ Detecta desconexão imediatamente
2. ✅ Tenta reiniciar instância (máximo 3 tentativas)
3. ✅ Aguarda 5 segundos entre tentativas
4. ✅ Atualiza status no banco
5. ✅ Notifica frontend sobre reconexão

---

## 💾 PERSISTÊNCIA DE DADOS - RECOMENDAÇÕES

### **Opção 1: Migrar para Tabelas SQL (RECOMENDADO)**

Criar tabelas SQL permanentes para conversas e mensagens:

```sql
-- Tabela para conversas WhatsApp
CREATE TABLE whatsapp_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  whatsapp_chat_id TEXT NOT NULL,
  contact_name TEXT,
  contact_phone TEXT,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, whatsapp_chat_id)
);

-- Tabela para mensagens WhatsApp
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  chat_id UUID REFERENCES whatsapp_chats(id),
  whatsapp_message_id TEXT NOT NULL,
  from_number TEXT,
  to_number TEXT,
  content TEXT,
  message_type TEXT,
  from_me BOOLEAN,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, whatsapp_message_id)
);
```

### **Opção 2: Manter KV Store + Backup SQL**

Manter KV Store para performance, mas fazer backup periódico em SQL.

---

## 🔧 COMO MANTER CONEXÃO ESTÁVEL

### **1. Configurar Automaticamente ao Conectar:**

O sistema agora configura automaticamente:
- ✅ Webhooks
- ✅ Monitoramento
- ✅ Heartbeat

### **2. Verificar Status:**

```typescript
// Verificar status manualmente
GET /rendizy-server/whatsapp/status

// Iniciar monitoramento
POST /rendizy-server/whatsapp/monitor/start
```

### **3. Monitorar Logs:**

Verifique logs do Supabase Edge Functions para ver:
- 🔍 Status de conexão
- 🔄 Tentativas de reconexão
- ❌ Erros e problemas
- ✅ Conexões bem-sucedidas

---

## 📋 CHECKLIST DE CONFIGURAÇÃO

- [x] ✅ Credenciais salvas no banco (`organization_channel_config`)
- [x] ✅ Monitoramento automático implementado
- [x] ✅ Reconexão automática implementada
- [x] ✅ Webhooks automáticos configurados
- [x] ✅ Heartbeat implementado
- [ ] ⚠️ Migrar conversas/mensagens para SQL (RECOMENDADO)
- [ ] ⚠️ Implementar backup periódico
- [ ] ⚠️ Alertas por email quando desconectar

---

## 🎯 PRÓXIMOS PASSOS

1. **Testar reconexão automática**
2. **Verificar se webhooks estão funcionando**
3. **Decidir sobre migração para SQL**
4. **Implementar alertas de desconexão**

---

## 📝 NOTAS IMPORTANTES

⚠️ **Dados atuais em KV Store:**
- Conversas e mensagens estão em KV Store (volátil)
- Recomendação: Migrar para SQL para persistência permanente
- KV Store pode perder dados em reinicializações

✅ **Configurações salvas:**
- Todas as credenciais estão salvas em SQL
- Status de conexão atualizado em tempo real
- QR Code e número de telefone persistidos

✅ **Monitoramento:**
- Sistema verifica conexão a cada 30 segundos
- Reconecta automaticamente se cair
- Mantém conexão ativa com heartbeat

