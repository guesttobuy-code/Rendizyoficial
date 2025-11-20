# 🔍 DEPURAÇÃO DO SISTEMA WHATSAPP

**Data:** 15/11/2025  
**Objetivo:** Testar login, conexão WhatsApp, recebimento e envio de mensagens

---

## 📋 CHECKLIST DE TESTES

### ✅ 1. Servidor Iniciado
- [x] `npm run dev` executado
- [ ] Servidor respondendo em `http://localhost:3000`
- [ ] Console sem erros críticos

### ✅ 2. Login Inicial
- [ ] Acessar `http://localhost:3000/login`
- [ ] Fazer login com credenciais válidas
- [ ] Verificar redirecionamento após login
- [ ] Verificar token salvo no localStorage

### ✅ 3. Verificar Conexão WhatsApp
- [ ] Acessar **Integrações → WhatsApp**
- [ ] Verificar status da conexão (CONNECTED/DISCONNECTED)
- [ ] Verificar se credenciais estão configuradas
- [ ] Testar botão "Conectar" se desconectado

### ✅ 4. Testar Recebimento de Mensagens
- [ ] Enviar mensagem do WhatsApp para o número conectado
- [ ] Verificar se webhook recebeu o evento
- [ ] Verificar se mensagem aparece no chat interno
- [ ] Verificar logs do backend

### ✅ 5. Testar Envio de Mensagens
- [ ] Enviar mensagem de teste via interface
- [ ] Verificar se mensagem foi entregue
- [ ] Verificar status de entrega (sent/delivered/read)
- [ ] Verificar logs do backend

---

## 🔧 ROTAS DO BACKEND PARA TESTAR

### **Status da Conexão**
```
GET /rendizy-server/make-server-67caf26a/whatsapp/status
```

**Resposta esperada:**
```json
{
  "success": true,
  "data": {
    "status": "CONNECTED" | "DISCONNECTED" | "CONNECTING",
    "instance": "Rendizy",
    "phone": "+5511999999999",
    "profileName": "Nome do Perfil"
  }
}
```

### **Enviar Mensagem**
```
POST /rendizy-server/make-server-67caf26a/whatsapp/send-message
Content-Type: application/json
Authorization: Bearer {token}

{
  "number": "5511999999999",
  "text": "Mensagem de teste"
}
```

### **Receber Mensagens (Inbox)**
```
GET /rendizy-server/make-server-67caf26a/whatsapp/messages
Authorization: Bearer {token}
```

### **Webhook (Recebimento)**
```
POST /rendizy-server/make-server-67caf26a/whatsapp/webhook
```

**Payload Evolution API:**
```json
{
  "event": "MESSAGES_UPSERT",
  "instance": "Rendizy",
  "data": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "..."
    },
    "message": {
      "conversation": "Texto da mensagem"
    }
  }
}
```

---

## 🐛 PROBLEMAS COMUNS E SOLUÇÕES

### **1. WhatsApp Desconectado**

**Sintomas:**
- Status mostra "DISCONNECTED"
- Não é possível enviar mensagens
- QR Code não aparece

**Soluções:**
1. Verificar credenciais em `organization_channel_config`:
   ```sql
   SELECT * FROM organization_channel_config 
   WHERE organization_id = '{org_id}';
   ```
2. Verificar se instância existe na Evolution API
3. Tentar reconectar via interface
4. Verificar logs do backend

### **2. Mensagens Não Chegam**

**Sintomas:**
- Mensagem enviada do WhatsApp não aparece no sistema
- Webhook não está recebendo eventos

**Soluções:**
1. Verificar se webhook está configurado:
   ```
   GET /rendizy-server/make-server-67caf26a/whatsapp/webhook/status
   ```
2. Verificar URL do webhook na Evolution API
3. Verificar logs do endpoint `/whatsapp/webhook`
4. Testar webhook manualmente com curl

### **3. Mensagens Não Enviam**

**Sintomas:**
- Erro ao tentar enviar mensagem
- Status "failed" ou erro 401/403

**Soluções:**
1. Verificar se WhatsApp está conectado
2. Verificar credenciais (API Key, Instance Token)
3. Verificar formato do número (deve ser: `5511999999999`)
4. Verificar logs do backend para erro específico

### **4. Erro 401 (Unauthorized)**

**Causa:** API Key inválida ou sem permissões

**Solução:**
1. Acessar Evolution API Manager
2. Criar nova Global API Key com TODAS permissões
3. Atualizar em `organization_channel_config`

---

## 📊 LOGS IMPORTANTES

### **Backend (Edge Function)**
- Verificar logs no Supabase Dashboard
- Filtrar por função: `rendizy-server`
- Procurar por: `[WhatsApp]`, `[Evolution]`

### **Frontend (Console do Navegador)**
- Abrir DevTools (F12)
- Aba Console
- Filtrar por: `WhatsApp`, `Evolution`, `[WhatsApp]`

### **Evolution API**
- Verificar logs no servidor Evolution
- Endpoint: `/manager/logs`

---

## 🧪 TESTES MANUAIS

### **Teste 1: Verificar Status**
```bash
curl -X GET "https://odcgnzfremrqnvtitpcc.supabase.co/functions/v1/rendizy-server/make-server-67caf26a/whatsapp/status" \
  -H "Authorization: Bearer {token}"
```

### **Teste 2: Enviar Mensagem**
```bash
curl -X POST "https://odcgnzfremrqnvtitpcc.supabase.co/functions/v1/rendizy-server/make-server-67caf26a/whatsapp/send-message" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "text": "Teste de mensagem"
  }'
```

### **Teste 3: Verificar Webhook**
```bash
curl -X GET "https://odcgnzfremrqnvtitpcc.supabase.co/functions/v1/rendizy-server/make-server-67caf26a/whatsapp/webhook/status" \
  -H "Authorization: Bearer {token}"
```

---

## 📝 NOTAS DE DEPURAÇÃO

### **Configuração Atual**
- **Project ID:** `odcgnzfremrqnvtitpcc`
- **Base URL:** `https://odcgnzfremrqnvtitpcc.supabase.co/functions/v1/rendizy-server/make-server-67caf26a`
- **Evolution API:** Configurada via `organization_channel_config`

### **Credenciais**
- Verificar em `organization_channel_config` no Supabase
- Campos necessários:
  - `whatsapp_api_url`
  - `whatsapp_instance_name`
  - `whatsapp_api_key`
  - `whatsapp_instance_token`

---

## ✅ PRÓXIMOS PASSOS APÓS TESTES

1. Documentar problemas encontrados
2. Criar issues para bugs críticos
3. Atualizar documentação se necessário
4. Registrar melhorias sugeridas

---

**Última atualização:** 15/11/2025

