# 📋 INSTRUÇÕES: Criar Cron Job para Monitoramento WhatsApp

**Versão:** v1.0.103.970  
**Data:** 20/11/2025  

---

## 🎯 OBJETIVO

Criar um cron job no Supabase que monitora a conexão WhatsApp automaticamente a cada 30 segundos.

---

## ✅ PASSO A PASSO

### **PASSO 1: Acessar Supabase Dashboard**

1. Acesse: https://supabase.com/dashboard/project/odcgnzfremrqnvtitpcc
2. Navegue para: **Database** → **SQL Editor**

### **PASSO 2: Abrir arquivo SQL**

1. Abra o arquivo: `CRIAR_CRON_JOB_MONITORAMENTO_WHATSAPP.sql`
2. Copie **TODO o conteúdo** do arquivo
3. Cole no **SQL Editor** do Supabase

### **PASSO 3: Executar SQL**

1. Clique em **RUN** ou pressione `Ctrl+Enter`
2. Aguarde a execução (pode levar alguns segundos)

### **PASSO 4: Verificar se funcionou**

Execute este SQL para verificar:

```sql
SELECT * FROM cron.job WHERE jobname = 'monitor-whatsapp-connection';
```

**Resultado esperado:**
- Deve retornar 1 linha
- Campo `active` deve ser `true`
- Campo `schedule` deve ser `*/30 * * * * *`

---

## 📊 VERIFICAR HISTÓRICO DE EXECUÇÕES

Para ver se o cron job está rodando:

```sql
SELECT 
  runid,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'monitor-whatsapp-connection')
ORDER BY start_time DESC
LIMIT 10;
```

**Resultado esperado:**
- Deve retornar execuções recentes
- Campo `status` deve ser `succeeded` (ou `failed` se houver erro)
- `start_time` deve mostrar execuções a cada 30 segundos

---

## ✅ VERIFICAR SE MONITORAMENTO ESTÁ FUNCIONANDO

1. **Ver logs do Edge Function:**
   - Supabase Dashboard → **Edge Functions** → **rendizy-server** → **Logs**
   - Procure por: `[WhatsApp Monitor]`
   - Deve aparecer logs a cada 30 segundos

2. **Verificar status da conexão:**
   - Acesse: `/chat` no sistema
   - Verifique se a conexão WhatsApp está sendo monitorada

---

## 🛠️ GERENCIAR CRON JOB

### **Parar cron job:**

```sql
SELECT cron.unschedule('monitor-whatsapp-connection');
```

### **Recriar cron job:**

Execute novamente o SQL do arquivo `CRIAR_CRON_JOB_MONITORAMENTO_WHATSAPP.sql`

### **Alterar frequência:**

```sql
-- Parar cron job atual
SELECT cron.unschedule('monitor-whatsapp-connection');

-- Criar novo com frequência diferente (ex: a cada 1 minuto = */60 * * * * *)
SELECT cron.schedule(
  'monitor-whatsapp-connection',
  '*/60 * * * * *',  -- A cada 1 minuto
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
```

---

## ⚠️ TROUBLESHOOTING

### **Erro: "extension pg_cron does not exist"**

**Solução:**
1. Verifique se você tem permissões de superuser
2. Tente ativar manualmente:
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   ```

### **Erro: "permission denied for schema cron"**

**Solução:**
- Verifique se você está usando uma conta com permissões de superuser
- Ou use a Service Role Key na configuração

### **Cron job não está executando**

**Verificar:**
1. Execute: `SELECT * FROM cron.job;`
2. Verifique se `active = true`
3. Veja histórico: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`
4. Verifique logs do Edge Function

### **Cron job executa mas retorna erro**

**Verificar:**
1. Logs do Edge Function
2. Mensagem de retorno: `SELECT return_message FROM cron.job_run_details ORDER BY start_time DESC LIMIT 1;`
3. Verifique se o endpoint está funcionando manualmente

---

## 📝 NOTAS IMPORTANTES

1. ✅ O cron job roda automaticamente em background
2. ✅ Não precisa fazer login ou acessar o sistema
3. ✅ Funciona 24/7
4. ✅ Verifica conexão a cada 30 segundos
5. ✅ Reconecta automaticamente se cair

---

**✅ PRONTO!** Após executar o SQL, o monitoramento WhatsApp estará ativo automaticamente!

