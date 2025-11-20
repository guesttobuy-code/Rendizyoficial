# 🎯 PLANO: Integrar WhatsApp no Chat - Rendizy

**Data:** 20/11/2025  
**Objetivo:** Integrar dados do WhatsApp Evolution API dentro do design completo do Chat - Rendizy

---

## 📋 ANÁLISE ATUAL

### **Chat - Rendizy (ChatInbox.tsx):**
- ✅ Design completo do Figma implementado
- ✅ Sistema Kanban (Fixadas, Urgentes, Normais, Resolvidas)
- ✅ Drag & Drop
- ✅ Templates, Tags, Modais
- ⚠️ Usa dados MOCK
- ⚠️ WhatsApp não está totalmente integrado

### **CHAT FEIOSO (ChatInboxWithEvolution.tsx):**
- ✅ Conecta com Evolution API
- ✅ Importa conversas WhatsApp
- ✅ Exibe conversas WhatsApp
- ⚠️ Interface simples (sem Kanban, Templates, etc.)
- ⚠️ Separado em tabs

---

## 🎯 OBJETIVO

**Integrar os dados do WhatsApp Evolution API diretamente no `ChatInbox.tsx` (Chat - Rendizy)**, mantendo todas as funcionalidades avançadas e fazendo as conversas WhatsApp aparecerem no sistema Kanban.

---

## 📝 ETAPAS DO PLANO

### **FASE 1: Preparação** ✅
- [x] Documentar nomenclatura
- [x] Analisar código atual
- [x] Identificar pontos de integração

### **FASE 2: Integração de Dados** 🔄
- [ ] Criar função para buscar conversas WhatsApp
- [ ] Converter dados WhatsApp para formato `Conversation`
- [ ] Integrar com `WhatsAppChatsImporter`
- [ ] Adicionar channel: 'whatsapp' nas conversas

### **FASE 3: Exibição no Kanban** 🔄
- [ ] Fazer conversas WhatsApp aparecerem em Fixadas/Urgentes/Normais
- [ ] Adicionar badge/ícone WhatsApp nos cards
- [ ] Manter categorização automática
- [ ] Permitir drag & drop de conversas WhatsApp

### **FASE 4: Funcionalidades Avançadas** 🔄
- [ ] Templates funcionarem com WhatsApp
- [ ] Tags funcionarem com WhatsApp
- [ ] Modais integrados (Cotação, Reserva) com WhatsApp
- [ ] Envio de mensagens via WhatsApp manter funcionalidade

### **FASE 5: Refatoração** 🔄
- [ ] Remover/Refatorar `ChatInboxWithEvolution.tsx` (CHAT FEIOSO)
- [ ] Usar apenas `ChatInbox.tsx` como componente principal
- [ ] Limpar código não utilizado

---

## 🔧 IMPLEMENTAÇÃO TÉCNICA

### **1. Integrar `WhatsAppChatsImporter` no `ChatInbox`**

```typescript
// Em ChatInbox.tsx
import { WhatsAppChatsImporter } from './WhatsAppChatsImporter';

export function ChatInbox() {
  // ... estado existente ...

  // Callback quando conversas WhatsApp são carregadas
  const handleWhatsAppChatsLoaded = (whatsappChats: any[]) => {
    // Converter conversas WhatsApp para formato Conversation
    const convertedConversations = whatsappChats.map(chat => ({
      id: `wa-${chat.id}`,
      guest_name: chat.pushName || chat.name || 'Contato WhatsApp',
      guest_phone: extractPhoneNumber(chat.id),
      channel: 'whatsapp' as const,
      category: 'normal' as ConversationCategory, // ou 'urgent' baseado em regras
      // ... outros campos ...
    }));

    // Mesclar com conversas existentes
    setConversations(prev => {
      // Remover conversas WhatsApp antigas
      const withoutWhatsApp = prev.filter(c => !c.id.startsWith('wa-'));
      // Adicionar novas conversas WhatsApp
      return [...convertedConversations, ...withoutWhatsApp];
    });
  };

  return (
    <div>
      {/* Botão Importar Conversas WhatsApp */}
      <WhatsAppChatsImporter 
        onChatsLoaded={handleWhatsAppChatsLoaded}
      />

      {/* Resto do ChatInbox (já funciona) */}
    </div>
  );
}
```

### **2. Buscar Mensagens WhatsApp ao Selecionar Conversa**

```typescript
// Ao selecionar conversa WhatsApp
const handleSelectConversation = async (conversation: Conversation) => {
  setSelectedConversation(conversation);

  // Se for WhatsApp, buscar mensagens da Evolution API
  if (conversation.channel === 'whatsapp' && conversation.whatsapp_chat_id) {
    const messages = await fetchWhatsAppMessages(conversation.whatsapp_chat_id);
    setMessages(messages.map(convertToMessage));
  }
};
```

### **3. Envio de Mensagens (já implementado)**

O `ChatInbox.tsx` já tem lógica para enviar mensagens WhatsApp:
```typescript
// Linha ~1100 do ChatInbox.tsx
if (selectedConversation.channel === 'whatsapp') {
  await sendWhatsAppMessage(phoneNumber, messageContent);
}
```

---

## ✅ RESULTADO ESPERADO

### **Interface Unificada:**
```
┌─────────────────────────────────────────────────┐
│ WhatsApp Evolution API              [🔄 Importar]│
├─────────────────────────────────────────────────┤
│ 🔍 Buscar conversas...                          │
│                                                 │
│ 📌 Fixadas (2/5)                                │
│ ├─ João Silva (WhatsApp) 📌                    │
│ └─ Maria Santos (Email) 📌                      │
│                                                 │
│ ⚡ Urgentes (3)                                  │
│ ├─ Patricia (WhatsApp) ⚡                       │
│ ├─ Ana (SMS) ⚡                                 │
│ └─ Carlos (WhatsApp) ⚡                         │
│                                                 │
│ 📋 Normais (8)                                   │
│ ├─ Conversas WhatsApp...                       │
│ ├─ Conversas Email...                          │
│ └─ Conversas Sistema...                        │
└─────────────────────────────────────────────────┘
```

### **Funcionalidades Mantidas:**
- ✅ Kanban funciona com WhatsApp
- ✅ Drag & Drop funciona com WhatsApp
- ✅ Templates funcionam com WhatsApp
- ✅ Tags funcionam com WhatsApp
- ✅ Modais funcionam com WhatsApp
- ✅ Filtros funcionam com WhatsApp
- ✅ Envio de mensagens funciona

---

## 🚀 PRÓXIMOS PASSOS

1. **Implementar FASE 2** (Integração de Dados)
2. **Testar** conversas WhatsApp aparecendo no Kanban
3. **Implementar FASE 3** (Exibição no Kanban)
4. **Testar** todas as funcionalidades com WhatsApp
5. **Refatorar** removendo CHAT FEIOSO

---

**Status:** 📋 Planejado  
**Prioridade:** 🔥 Alta  
**Estimativa:** 2-3 horas de desenvolvimento

