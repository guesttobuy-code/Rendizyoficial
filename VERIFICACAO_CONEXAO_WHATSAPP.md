# ✅ VERIFICAÇÃO: Conexão WhatsApp

**Data:** 20/11/2025  
**Status:** 🔍 **VERIFICANDO**

---

## 🔍 PROBLEMA IDENTIFICADO

O sistema de monitoramento foi implementado (`whatsapp-monitor.ts`), mas **não está rodando automaticamente em background**.

### **Situação Atual:**

1. ✅ Sistema de monitoramento criado (`services/whatsapp-monitor.ts`)
2. ✅ Webhooks automáticos configurados ao conectar
3. ✅ Reconexão automática implementada
4. ✅ Heartbeat para manter conexão ativa
5. ❌ **PROBLEMA: Monitor não roda em background continuamente**

### **Como Funciona Atualmente:**

- Monitor é chamado **apenas quando:**
  - Alguém conecta o WhatsApp (`POST /channels/whatsapp/connect`)
  - Alguém verifica status manualmente (`POST /channels/whatsapp/status`)

- Monitor **NÃO** é chamado:
  - Automaticamente a cada 30 segundos
  - Em background continuamente
  - Via cron job/scheduler

---

## 🚨 SOLUÇÃO NECESSÁRIA

### **Opção 1: Cron Job do Supabase (RECOMENDADO)**

Criar um cron job que chama o monitor periodicamente:

```sql
-- Supabase Cron Job
SELECT cron.schedule(
  'monitor-whatsapp-connection',
  '*/30 * * * * *', -- A cada 30 segundos
  $$
  SELECT net.http_post(
    url := 'https://odcgnzfremrqnvtitpcc.supabase.co/functions/v1/rendizy-server/whatsapp/monitor/start',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{"organization_id": "org_default"}'::jsonb
  ) AS request_id;
  $$
);
```

### **Opção 2: Endpoint de Monitoramento Contínuo**

Criar um endpoint que mantém o monitor rodando:

```typescript
// GET /whatsapp/monitor/start
// Inicia monitoramento contínuo
```

### **Opção 3: Frontend Polling**

Frontend chama o status periodicamente (não ideal, mas funciona):

```typescript
// A cada 30 segundos, chamar:
// POST /channels/whatsapp/status
```

---

## 📋 CHECKLIST DE VERIFICAÇÃO

- [ ] Verificar se há cron job configurado
- [ ] Verificar status atual da conexão
- [ ] Verificar se webhooks estão configurados
- [ ] Implementar cron job ou alternativa
- [ ] Testar monitoramento contínuo

---

## ✅ AÇÕES IMEDIATAS

1. **Verificar status atual** da conexão
2. **Criar cron job** para monitoramento automático
3. **Testar** se monitoramento está funcionando
4. **Documentar** solução implementada

