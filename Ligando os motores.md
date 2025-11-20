# 🚀 Ligando os Motores

Documento rápido para iniciar qualquer nova sessão no projeto **Rendizy**.

---

## 1. Conectar GitHub

1. Abra o PowerShell na raiz do projeto:
   ```powershell
   cd "C:\Users\rafae\Downloads\Rendizy2producao-main github 15 11 2025\Rendizy2producao-main"
   ```
2. Execute o script (evita digitar manualmente):
   ```powershell
   .\configurar-github-simples.ps1
   ```
3. Se preferir rodar manualmente:
   ```powershell
   # Token está em TOKENS_E_ACESSOS_COMPLETO.md (não versionado)
   git remote set-url origin https://[TOKEN]@github.com/suacasarendemais-png/Rendizy2producao.git
   git fetch origin
   git status
   ```

---

## 2. Conectar Supabase CLI

1. Execute o script de login:
   ```powershell
    .\login-supabase.ps1
   ```
   - Opção 1: login com token (`sbp_...`)  
   - Opção 2: login interativo (abre navegador) – **recomendado**  
2. Depois do login:
   ```powershell
   npx supabase projects list
   npx supabase link --project-ref odcgnzfremrqnvtitpcc
   ```
3. Arquivos úteis:
   - `TOKENS_E_ACESSOS_COMPLETO.md`
   - `TOKENS_SALVOS.md`
   - `configurar-tokens.ps1`

---

## 3. URLs do Sistema

### **Produção (Vercel)**
- **URL:** https://rendizy2producao-am7c.vercel.app
- **Dashboard:** https://rendizy2producao-am7c.vercel.app/dashboard
- **Status:** ✅ Ativo

### **Desenvolvimento Local**
- **URL:** http://localhost:3000
- **Comando:** `npm run dev`
- **Porta:** 3000 (configurado em `vite.config.ts`)

### **Backend (Supabase Edge Functions)**
- **Base URL:** `https://odcgnzfremrqnvtitpcc.supabase.co/functions/v1/rendizy-server/make-server-67caf26a`
- **Project ID:** `odcgnzfremrqnvtitpcc`

---

## 4. Regras de Ouro (Documentação)

Sempre revisar antes de começar:
- `src/docs/RESUMO_FINAL_28OUT2025.md`
  - Atualizar `LOG_ATUAL.md`
  - Criar snapshot diário
  - Seguir naming convention
  - Atualizar `INDICE_DOCUMENTACAO.md`

---

## 5. Contexto mais recente

| Documento | Descrição |
|-----------|-----------|
| `PROMPT_CONTEXTO_COMPLETO_SESSAO.md` | Compila tudo de 06/11/2025 (schema, migração, backlog) |
| `SCHEMA_ANALISE_COMPLETA.md` | Descrição detalhada das 35 tabelas SQL |
| `PLANO_MIGRACAO_BACKEND.md` | Plano para migrar das rotas KV Store para SQL |
| `ANALISE_MIDDLEWARE_CHATGPT.md` | Adaptação do middleware Next.js para `ProtectedRoute` |
| `RESUMO_IMPLEMENTACAO_PROTECTED_ROUTE.md` | Guia rápido do novo `ProtectedRoute` |
| `ANALISE_TRIGGER_SIGNUP.md` | Migração/seed de organização automática |
| `ANALISE_PROMPT_MULTI_TENANT.md` | Blueprint adaptado para React + Vite |

---

## 6. Checklist inicial

1. [ ] Abrir este arquivo 😄  
2. [ ] Conectar GitHub (`configurar-github-simples.ps1`)  
3. [ ] Conectar Supabase (`login-supabase.ps1`)  
4. [ ] Ler `Regras de Ouro` (link acima)  
5. [ ] Revisar `PROMPT_CONTEXTO_COMPLETO_SESSAO.md`  
6. [ ] Atualizar `LOG_ATUAL.md` com o plano da sessão  

---

## 7. Scripts úteis

| Script | Uso |
|--------|-----|
| `configurar-github.ps1` | Configura conexão completa (output com cores pode quebrar no PowerShell v2.0; usar versão simples se necessário) |
| `configurar-github-simples.ps1` | Versão sem emojis – compatível com qualquer PowerShell |
| `login-supabase.ps1` | Login no Supabase CLI (token ou interativo) |
| `configurar-tokens.ps1` | Define variáveis de ambiente com tokens salvos |
| `criar-zip-alteracoes.ps1` | Gera ZIP com arquivos modificados para envio rápido |

---

## 8. Deploy (IMPORTANTE)

### ⚠️ REGRA CRÍTICA: Deploy sempre feito pelo Auto (AI)

**O usuário NUNCA faz deploy manualmente.**

- ✅ **Auto sempre faz deploy** de todas as alterações
- ✅ Tokens foram fornecidos **exatamente para isso**
- ✅ GitHub: Token fornecido para push automático
- ✅ Supabase: Token fornecido para deploy de Edge Functions

**Comandos de deploy que o Auto executa:**
- Backend (Supabase): `npx supabase functions deploy rendizy-server`
- Frontend (Vercel): Push para GitHub → Vercel faz deploy automático

**Quando fazer deploy:**
- Após qualquer alteração no backend (`supabase/functions/`)
- Após correções críticas
- Após implementação de novas features
- Sempre que o usuário solicitar

**Nunca pedir ao usuário para fazer deploy manualmente!**

---

## 9. Lembretes

- Tokens estão documentados em `TOKENS_*` (arqs ignorados no Git).  
- `LOG_ATUAL.md` precisa ser mantido fora do repositório (arquivo vivo).  
- Toda sessão deve terminar com snapshot em `/docs/logs/`.  
- Backend ainda usa KV Store → seguir plano de migração para SQL.  
- **Deploy sempre feito pelo Auto, nunca pelo usuário.**

---

Pronto! Agora é só seguir o checklist e começar a sessão. 💪

