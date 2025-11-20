# 🔧 SOLUÇÃO: Monitoramento Contínuo WhatsApp

**Data:** 20/11/2025  
**Status:** ⚠️ **NECESSÁRIA AÇÃO**

---

## 📊 SITUAÇÃO ATUAL

### ✅ **O QUE ESTÁ IMPLEMENTADO:**

1. ✅ **Sistema de Monitoramento** (`whatsapp-monitor.ts`)
   - Verifica status da conexão
   - Reconecta automaticamente se cair
   - Atualiza status no banco
   - Envia heartbeat

2. ✅ **Webhooks Automáticos**
   - Configurados automaticamente ao conectar
   - Recebem mensagens em tempo real

3. ✅ **Endpoint de Monitoramento**
   - `POST /rendizy-server/whatsapp/monitor/start`
   - Já existe e funciona

### ❌ **PROBLEMA:**

O monitor **não está rodando continuamente** em background. Ele só é chamado quando:
- Alguém conecta o WhatsApp
- Alguém verifica status manualmente

---

## 🔧 SOLUÇÕES

### **Opção 1: Cron Job do Supabase (RECOMENDADO)**

Criar um cron job que chama o monitor periodicamente:

1. **Ativar extensão pg_cron:**
   ```sql
   -- No Supabase Dashboard → Database → Extensions
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   ```

2. **Criar cron job:**
   ```sql
   -- No Supabase Dashboard → Database → SQL Editor
   SELECT cron.schedule(
     'monitor-whatsapp-connection',
     '*/30 * * * * *', -- A cada 30 segundos
     $$
     SELECT net.http_post(
       url := 'https://odcgnzfremrqnvtitpcc.supabase.co/functions/v1/rendizy-server/whatsapp/monitor/start',
       headers := jsonb_build_object(
         'Content-Type', 'application/json',
         'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
       ),
       body := '{}'::jsonb
     ) AS request_id;
     $$
   );
   ```

3. **Verificar cron jobs:**
   ```sql
   SELECT * FROM cron.job;
   ```

### **Opção 2: Frontend Polling**

Frontend chama status periodicamente:

```typescript
// No frontend, adicionar:
useEffect(() => {
  const interval = setInterval(() => {
    fetch('/rendizy-server/channels/whatsapp/status', {
      method: 'POST',
      body: JSON.stringify({ organization_id: 'org_default' })
    });
  }, 30000); // A cada 30 segundos

  return () => clearInterval(interval);
}, []);
```

### **Opção 3: Serviço Externo (Cron Jobs Online)**

Usar serviço externo para chamar o endpoint:

- **Uptime Robot**
- **Cron-job.org**
- **EasyCron**

Configurar para chamar:
```
POST https://odcgnzfremrqnvtitpcc.supabase.co/functions/v1/rendizy-server/whatsapp/monitor/start
A cada 30 segundos
```

---

## 📋 IMPLEMENTAÇÃO RECOMENDADA

### **Passo 1: Verificar se pg_cron está ativado**

```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

### **Passo 2: Criar cron job**

**✅ ARQUIVO SQL PRONTO:** `CRIAR_CRON_JOB_MONITORAMENTO_WHATSAPP.sql`

1. Abra o arquivo: `CRIAR_CRON_JOB_MONITORAMENTO_WHATSAPP.sql`
2. Copie TODO o conteúdo
3. Cole no Supabase SQL Editor
4. Execute (`Ctrl+Enter` ou botão RUN)

Ou execute diretamente:

```sql
-- Ativar extensão pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remover cron job existente (se houver)
SELECT cron.unschedule('monitor-whatsapp-connection');

-- Criar cron job para monitoramento contínuo
SELECT cron.schedule(
  'monitor-whatsapp-connection',
  '*/30 * * * * *',
  $$
  SELECT net.http_post(
    url := 'https://odcgnzfremrqnvtitpcc.supabase.co/functions/v1/rendizy-server/whatsapp/monitor/start',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Verificar se foi criado
SELECT * FROM cron.job WHERE jobname = 'monitor-whatsapp-connection';
```

### **Passo 3: Verificar se está funcionando**

```sql
-- Ver cron jobs ativos
SELECT * FROM cron.job;

-- Ver histórico de execuções
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'monitor-whatsapp-connection')
ORDER BY start_time DESC
LIMIT 10;
```

---

## ✅ CHECKLIST

- [ ] Verificar se pg_cron está ativado
- [ ] Criar cron job para monitoramento
- [ ] Testar se cron job está executando
- [ ] Verificar logs do monitor
- [ ] Confirmar que conexão está sendo monitorada

---

## 🎯 CONCLUSÃO

O sistema de monitoramento **já está implementado**, mas precisa ser **chamado periodicamente**. 

**Recomendação:** Usar cron job do Supabase (pg_cron) para garantir monitoramento contínuo a cada 30 segundos.

