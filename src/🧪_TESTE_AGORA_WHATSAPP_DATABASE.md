# 🧪 TESTE AGORA - WhatsApp Database

**Status:** ✅ PRONTO PARA TESTAR  
**Versão:** v1.0.103.265  
**Data:** 03 NOV 2025

---

## ⚡ TESTE RÁPIDO (5 MINUTOS)

### **1. Testar criação de contato**

```bash
POST https://[seu-projeto].supabase.co/functions/v1/make-server-67caf26a/whatsapp/data/contacts

Headers:
Authorization: Bearer [publicAnonKey]
Content-Type: application/json

Body:
{
  "organization_id": "org_demo",
  "whatsapp_id": "5511987654321@c.us",
  "phone": "+55 11 98765-4321",
  "phone_raw": "5511987654321",
  "name": "João Silva",
  "pushname": "João",
  "isBusiness": false,
  "isMyContact": true
}

Resposta esperada:
{
  "success": true,
  "data": {
    "id": "wa_contact_...",
    "organization_id": "org_demo",
    "name": "João Silva",
    ...
  }
}
```

---

### **2. Listar contatos criados**

```bash
GET https://[seu-projeto].supabase.co/functions/v1/make-server-67caf26a/whatsapp/data/contacts?organization_id=org_demo

Headers:
Authorization: Bearer [publicAnonKey]

Resposta esperada:
{
  "success": true,
  "data": [
    {
      "id": "wa_contact_...",
      "name": "João Silva",
      ...
    }
  ],
  "total": 1
}
```

---

### **3. Buscar configuração padrão**

```bash
GET https://[seu-projeto].supabase.co/functions/v1/make-server-67caf26a/whatsapp/data/config?organization_id=org_demo

Headers:
Authorization: Bearer [publicAnonKey]

Resposta esperada (cria automaticamente se não existir):
{
  "success": true,
  "data": {
    "id": "wa_config_...",
    "organization_id": "org_demo",
    "autoSync": {
      "enabled": true,
      "interval": 5
    },
    "importFilters": {
      "onlyMyContacts": false,
      "excludeGroups": true,
      "onlyBusinessContacts": false
    },
    "autoLink": {
      "enabled": true,
      "linkByPhone": true,
      "createGuestIfNotFound": false
    },
    ...
  }
}
```

---

### **4. Criar uma conversa**

```bash
POST https://[seu-projeto].supabase.co/functions/v1/make-server-67caf26a/whatsapp/data/chats

Headers:
Authorization: Bearer [publicAnonKey]
Content-Type: application/json

Body:
{
  "organization_id": "org_demo",
  "whatsapp_chat_id": "5511987654321@c.us",
  "contact_id": "wa_contact_...",  // Use o ID do contato criado no passo 1
  "contact_name": "João Silva",
  "contact_phone": "+55 11 98765-4321",
  "isGroup": false
}

Resposta esperada:
{
  "success": true,
  "data": {
    "id": "wa_chat_...",
    "unreadCount": 0,
    "totalMessages": 0,
    "isPinned": false,
    ...
  }
}
```

---

### **5. Salvar uma mensagem**

```bash
POST https://[seu-projeto].supabase.co/functions/v1/make-server-67caf26a/whatsapp/data/messages

Headers:
Authorization: Bearer [publicAnonKey]
Content-Type: application/json

Body:
{
  "organization_id": "org_demo",
  "whatsapp_message_id": "msg_123456",
  "chat_id": "wa_chat_...",  // Use o ID do chat criado no passo 4
  "from": "5511987654321@c.us",
  "to": "5511999999999@c.us",
  "fromMe": false,
  "type": "text",
  "content": "Olá! Gostaria de fazer uma reserva.",
  "timestamp": "2025-11-03T10:00:00.000Z"
}

Resposta esperada:
{
  "success": true,
  "data": {
    "id": "wa_msg_...",
    "content": "Olá! Gostaria de fazer uma reserva.",
    "status": "delivered",
    ...
  }
}
```

**Bonus:** O chat é automaticamente atualizado com:
- ✅ `lastMessage` atualizada
- ✅ `totalMessages` incrementado
- ✅ `unreadCount` incrementado (se fromMe = false)

---

### **6. Listar mensagens do chat**

```bash
GET https://[seu-projeto].supabase.co/functions/v1/make-server-67caf26a/whatsapp/data/messages?organization_id=org_demo&chat_id=wa_chat_...

Headers:
Authorization: Bearer [publicAnonKey]

Resposta esperada:
{
  "success": true,
  "data": [
    {
      "id": "wa_msg_...",
      "content": "Olá! Gostaria de fazer uma reserva.",
      "timestamp": "2025-11-03T10:00:00.000Z",
      ...
    }
  ],
  "total": 1
}
```

---

### **7. Testar importação em lote**

```bash
POST https://[seu-projeto].supabase.co/functions/v1/make-server-67caf26a/whatsapp/data/bulk-import-contacts

Headers:
Authorization: Bearer [publicAnonKey]
Content-Type: application/json

Body:
{
  "organization_id": "org_demo",
  "contacts": [
    {
      "whatsapp_id": "5511988888888@c.us",
      "phone": "+55 11 98888-8888",
      "phone_raw": "5511988888888",
      "name": "Maria Santos",
      "pushname": "Maria",
      "isBusiness": false,
      "isMyContact": true
    },
    {
      "whatsapp_id": "5511977777777@c.us",
      "phone": "+55 11 97777-7777",
      "phone_raw": "5511977777777",
      "name": "Pedro Costa",
      "pushname": "Pedro",
      "isBusiness": true,
      "isMyContact": true
    }
  ]
}

Resposta esperada:
{
  "success": true,
  "results": {
    "imported": 2,
    "updated": 0,
    "skipped": 0,
    "total": 2
  }
}
```

---

### **8. Criar log de sincronização**

```bash
POST https://[seu-projeto].supabase.co/functions/v1/make-server-67caf26a/whatsapp/data/sync-logs

Headers:
Authorization: Bearer [publicAnonKey]
Content-Type: application/json

Body:
{
  "organization_id": "org_demo",
  "sync_type": "contacts",
  "status": "completed",
  "results": {
    "contactsImported": 50,
    "contactsUpdated": 10,
    "contactsSkipped": 2,
    "errorsCount": 0
  },
  "startedAt": "2025-11-03T10:00:00.000Z",
  "completedAt": "2025-11-03T10:00:15.000Z",
  "duration": 15
}

Resposta esperada:
{
  "success": true,
  "data": {
    "id": "wa_sync_...",
    "sync_type": "contacts",
    "status": "completed",
    ...
  }
}
```

---

### **9. Listar logs de sincronização**

```bash
GET https://[seu-projeto].supabase.co/functions/v1/make-server-67caf26a/whatsapp/data/sync-logs?organization_id=org_demo

Headers:
Authorization: Bearer [publicAnonKey]

Resposta esperada:
{
  "success": true,
  "data": [
    {
      "id": "wa_sync_...",
      "sync_type": "contacts",
      "status": "completed",
      "results": {
        "contactsImported": 50,
        ...
      }
    }
  ],
  "total": 1
}
```

---

### **10. Atualizar configuração**

```bash
PUT https://[seu-projeto].supabase.co/functions/v1/make-server-67caf26a/whatsapp/data/config

Headers:
Authorization: Bearer [publicAnonKey]
Content-Type: application/json

Body:
{
  "organization_id": "org_demo",
  "autoSync": {
    "enabled": true,
    "interval": 10
  },
  "notifications": {
    "newMessage": true,
    "newContact": true,
    "connectionStatus": true
  }
}

Resposta esperada:
{
  "success": true,
  "data": {
    "id": "wa_config_...",
    "autoSync": {
      "enabled": true,
      "interval": 10
    },
    ...
  }
}
```

---

## 📋 CHECKLIST DE TESTES

### **Contatos:**
- [ ] Criar contato
- [ ] Listar contatos
- [ ] Buscar contato por ID
- [ ] Atualizar contato
- [ ] Deletar contato
- [ ] Importar em lote

### **Conversas:**
- [ ] Criar conversa
- [ ] Listar conversas
- [ ] Buscar conversa por ID
- [ ] Atualizar conversa
- [ ] Importar em lote

### **Mensagens:**
- [ ] Criar mensagem
- [ ] Listar mensagens
- [ ] Filtrar por chat_id
- [ ] Verificar auto-update do chat

### **Instância:**
- [ ] Criar instância
- [ ] Buscar instância
- [ ] Atualizar status

### **Logs:**
- [ ] Criar log
- [ ] Listar logs

### **Configuração:**
- [ ] Buscar config (cria padrão)
- [ ] Atualizar config

---

## ✅ RESULTADOS ESPERADOS

### **Após todos os testes, você deve ter:**

1. ✅ **3 contatos** no banco
   - João Silva (manual)
   - Maria Santos (bulk import)
   - Pedro Costa (bulk import)

2. ✅ **1 conversa** com João Silva
   - `unreadCount`: 1
   - `totalMessages`: 1
   - `lastMessage`: "Olá! Gostaria de fazer uma reserva."

3. ✅ **1 mensagem** salva
   - Vinculada à conversa
   - Status: delivered

4. ✅ **1 log** de sincronização
   - 50 contatos importados
   - Duração: 15 segundos

5. ✅ **1 configuração** customizada
   - Auto-sync: 10 minutos
   - Notificações: todas ativadas

---

## 🔍 VERIFICAR DADOS NO KV STORE

### **Usando as funções KV:**

```typescript
// No backend, você pode verificar os dados assim:

import * as kv from './kv_store.tsx';

// Listar todos os contatos de uma organização
const contacts = await kv.getByPrefix<WhatsAppContact>('whatsapp:contact:org_demo:');
console.log('Contatos:', contacts.length);

// Listar todas as conversas
const chats = await kv.getByPrefix<WhatsAppChat>('whatsapp:chat:org_demo:');
console.log('Conversas:', chats.length);

// Listar todas as mensagens
const messages = await kv.getByPrefix<WhatsAppMessage>('whatsapp:message:org_demo:');
console.log('Mensagens:', messages.length);

// Buscar instância
const instance = await kv.get<WhatsAppInstance>('whatsapp:instance:org_demo');
console.log('Instância:', instance);

// Buscar config
const config = await kv.get<WhatsAppConfig>('whatsapp:config:org_demo');
console.log('Config:', config);
```

---

## 🚨 TROUBLESHOOTING

### **Erro 400: organization_id é obrigatório**
- ✅ Adicione `organization_id` no body (POST/PUT) ou query string (GET)

### **Erro 404: Not Found**
- ✅ Verifique se as rotas estão registradas no `/supabase/functions/server/index.tsx`
- ✅ Verifique se o servidor está rodando

### **Erro 500: Internal Server Error**
- ✅ Verifique os logs do servidor
- ✅ Verifique se o KV Store está funcionando

### **Dados não aparecem**
- ✅ Verifique o `organization_id` usado
- ✅ Verifique se está buscando com o mesmo `organization_id`

---

## 🎯 PRÓXIMO PASSO

Depois de testar manualmente, você pode:

1. **Integrar com Evolution API real**
   - Importar contatos reais
   - Salvar mensagens recebidas via webhook
   - Sincronização automática

2. **Criar interface frontend**
   - Lista de contatos
   - Lista de conversas
   - Histórico de mensagens

3. **Implementar vinculações**
   - Contato ↔ Guest
   - Chat ↔ Reservation
   - Chat ↔ Property

---

## 📚 DOCUMENTAÇÃO COMPLETA

Para mais detalhes, veja:
- `/📱_WHATSAPP_DATABASE_COMPLETO_v1.0.103.265.md`
- `/📱_RELATORIO_WHATSAPP_EVOLUTION_API_v1.0.103.265.md`

---

**BOM TESTE!** 🚀

---

**Versão:** v1.0.103.265  
**Data:** 03 NOV 2025  
**Status:** ✅ TESTÁVEL
