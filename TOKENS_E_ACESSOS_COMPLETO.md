# 🔐 TOKENS E ACESSOS - DOCUMENTO COMPLETO

**Data de Criação:** 2024-11-21  
**Última Atualização:** 2024-11-21  
**Status:** ✅ Todos os tokens obtidos e salvos

---

## ⚠️ IMPORTANTE - SEGURANÇA

- ❌ **NUNCA** commite este arquivo no Git
- ❌ **NUNCA** compartilhe os tokens publicamente
- ✅ Este arquivo está no `.gitignore` (não será versionado)
- ✅ Mantenha este arquivo em local seguro

---

## 📋 TOKENS CONFIGURADOS

### **1. GitHub - Personal Access Token (Classic)**

✅ **FUNCIONANDO E TESTADO!**

```
Token: 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
Tipo: Personal Access Token (Classic)
Formato: ghp_...
Status: ✅ Funcionando
Testado: ✅ Sim (git ls-remote funcionou)
```

**Onde obter novo token:**
- 🔗 https://github.com/settings/tokens/new

**Como usar:**
```powershell
# Configurar token
$env:GITHUB_TOKEN = "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"

# Configurar remote do Git
git remote set-url origin "https://$env:GITHUB_TOKEN@github.com/suacasarendemais-png/Rendizy2producao.git"

# Fazer push
git push
```

**Repositório:**
- URL: `https://github.com/suacasarendemais-png/Rendizy2producao.git`
- Owner: `suacasarendemais-png`
- Nome: `Rendizy2producao`

---

### **2. Supabase - Access Token (Para CLI)**

⚠️ **Obtido, mas formato pode estar incorreto**

```
Token: sbp_17d159c6f1a2dab113e0cac351052dee23ededff
Tipo: Access Token (para Supabase CLI)
Formato: sbp_...
Status: ⚠️ Token obtido, mas CLI rejeitou (formato pode estar errado)
Erro: "Invalid access token format. Must be like `sbp_0102...1920`"
```

**Onde obter novo token:**
- 🔗 https://supabase.com/dashboard/account/tokens
- Ou: Avatar > Account Settings > Access Tokens

**Como usar (Login Interativo - Recomendado):**
```powershell
# Login interativo (abre navegador - MAIS FÁCIL)
npx supabase login

# Verificar login
npx supabase projects list

# Linkar projeto
npx supabase link --project-ref odcgnzfremrqnvtitpcc
```

**Como usar (Com Token - Se funcionar):**
```powershell
# Tentar login com token
$env:SUPABASE_ACCESS_TOKEN = "sbp_17d159c6f1a2dab113e0cac351052dee23ededff"
npx supabase login --token $env:SUPABASE_ACCESS_TOKEN
```

**Projeto Supabase:**
- Project ID: `odcgnzfremrqnvtitpcc`
- URL: `https://odcgnzfremrqnvtitpcc.supabase.co`
- Dashboard: https://supabase.com/dashboard/project/odcgnzfremrqnvtitpcc

---

### **3. Supabase - Secret Key (Para Apps/Edge Functions)**

✅ **SALVO E FUNCIONANDO**

```
Token: sb_secret_Se1z5M4EM0lzUn4uXuherQ_6LX7BQ8d
Tipo: Secret Key (para aplicações)
Formato: sb_secret_...
Status: ✅ Salvo
Uso: Edge Functions, variáveis de ambiente, aplicações
```

**Onde obter novo token:**
- 🔗 https://supabase.com/dashboard/project/odcgnzfremrqnvtitpcc/settings/api-keys
- Ou: Settings > API Keys > Secret keys

**Como usar:**
- Configure no Supabase Dashboard: Settings > Edge Functions > Secrets
- Adicione como variável de ambiente: `SUPABASE_SECRET_KEY`
- Use em Edge Functions e aplicações backend

**⚠️ IMPORTANTE:**
- Este token NÃO funciona para login no CLI
- É apenas para uso em aplicações/Edge Functions
- Mantenha seguro e não exponha publicamente

---

## 📁 ARQUIVOS LOCAIS

### **`.env.local`** (Raiz do projeto)

✅ **Criado e configurado**

Contém todos os tokens:
```env
GITHUB_TOKEN=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
SUPABASE_ACCESS_TOKEN=sbp_17d159c6f1a2dab113e0cac351052dee23ededff
SUPABASE_SECRET_KEY=sb_secret_Se1z5M4EM0lzUn4uXuherQ_6LX7BQ8d
```

**Status:** ✅ Adicionado ao `.gitignore` (não será versionado)

---

## 🔗 LINKS IMPORTANTES

### **GitHub:**
- Tokens: https://github.com/settings/tokens
- Criar novo token: https://github.com/settings/tokens/new
- Repositório: https://github.com/suacasarendemais-png/Rendizy2producao

### **Supabase:**
- Dashboard: https://supabase.com/dashboard/project/odcgnzfremrqnvtitpcc
- Access Tokens (CLI): https://supabase.com/dashboard/account/tokens
- API Keys (Apps): https://supabase.com/dashboard/project/odcgnzfremrqnvtitpcc/settings/api-keys
- Logs: https://supabase.com/dashboard/project/odcgnzfremrqnvtitpcc/logs
- Edge Functions: https://supabase.com/dashboard/project/odcgnzfremrqnvtitpcc/functions

---

## 🚀 SCRIPTS CRIADOS

### **1. `configurar-tokens.ps1`**
Script para configurar tokens automaticamente usando os valores do `.env.local`

### **2. `configurar-acessos.ps1`**
Script para configurar acessos com login interativo

### **3. `configurar-acessos.ps1`**
Script completo de configuração

---

## 📝 INSTRUÇÕES DE USO RÁPIDO

### **GitHub - Fazer Push:**

```powershell
# Carregar token
$env:GITHUB_TOKEN = "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"

# Configurar remote
git remote set-url origin "https://$env:GITHUB_TOKEN@github.com/suacasarendemais-png/Rendizy2producao.git"

# Adicionar, commitar e fazer push
git add .
git commit -m "Sua mensagem"
git push
```

### **Supabase CLI - Login e Uso:**

```powershell
# Opção 1: Login interativo (RECOMENDADO)
npx supabase login

# Opção 2: Login com token (se funcionar)
$env:SUPABASE_ACCESS_TOKEN = "sbp_17d159c6f1a2dab113e0cac351052dee23ededff"
npx supabase login --token $env:SUPABASE_ACCESS_TOKEN

# Verificar login
npx supabase projects list

# Linkar projeto
npx supabase link --project-ref odcgnzfremrqnvtitpcc

# Ver status
npx supabase status
```

### **Supabase - Ver Logs:**

Como o comando `logs` não está disponível na versão 2.58.5 do CLI, use:

1. **Dashboard (Recomendado):**
   - 🔗 https://supabase.com/dashboard/project/odcgnzfremrqnvtitpcc/logs

2. **Edge Functions específica:**
   - 🔗 https://supabase.com/dashboard/project/odcgnzfremrqnvtitpcc/functions/rendizy-server/logs

---

## 🧪 TESTES REALIZADOS

### **GitHub:**
- ✅ Token configurado
- ✅ Remote atualizado
- ✅ Conexão testada (`git ls-remote` funcionou)
- ✅ Status: **FUNCIONANDO**

### **Supabase CLI:**
- ⚠️ Token obtido, mas formato rejeitado pelo CLI
- ✅ Login interativo disponível como alternativa
- ✅ Status: **USE LOGIN INTERATIVO**

### **Supabase Secret Key:**
- ✅ Token salvo
- ✅ Pronto para uso em Edge Functions
- ✅ Status: **SALVO**

---

## 🔒 SEGURANÇA E BOAS PRÁTICAS

### **✅ O que fazer:**
- ✅ Salvar tokens em `.env.local` (não versionado)
- ✅ Usar variáveis de ambiente
- ✅ Rotacionar tokens periodicamente
- ✅ Usar escopos mínimos necessários
- ✅ Verificar expiração dos tokens

### **❌ O que NÃO fazer:**
- ❌ Commitar tokens no Git
- ❌ Compartilhar tokens publicamente
- ❌ Usar tokens em código hardcoded
- ❌ Expor tokens em logs ou mensagens de erro
- ❌ Usar o mesmo token em múltiplos ambientes

---

## 📊 RESUMO DO STATUS

| Serviço | Token | Status | Funciona? |
|---------|-------|--------|-----------|
| **GitHub** | `ghp_...` | ✅ Funcionando | ✅ Sim |
| **Supabase CLI** | `sbp_...` | ⚠️ Formato rejeitado | ⚠️ Use login interativo |
| **Supabase Apps** | `sb_secret_...` | ✅ Salvo | ✅ Sim |

---

## 🆘 TROUBLESHOOTING

### **Erro: "Invalid access token format" no Supabase CLI**

**Solução:**
```powershell
# Use login interativo (mais confiável)
npx supabase login
```

### **Erro: "authentication failed" no GitHub**

**Solução:**
1. Verificar token tem escopo `repo`
2. Verificar token não expirou
3. Gerar novo token: https://github.com/settings/tokens/new

### **Erro: "command not found: logs" no Supabase CLI**

**Solução:**
- Versão 2.58.5 não tem comando `logs`
- Use Dashboard: https://supabase.com/dashboard/project/odcgnzfremrqnvtitpcc/logs

---

## 📌 PRÓXIMOS PASSOS

1. ✅ **GitHub:** Pronto para usar! Pode fazer `git push` agora
2. ⚠️ **Supabase CLI:** Use `npx supabase login` (login interativo)
3. ✅ **Supabase Apps:** Token salvo, pronto para Edge Functions

---

## 📝 NOTAS IMPORTANTES

1. **Tokens expiram:** Verifique periodicamente se os tokens ainda são válidos
2. **Rotação:** Considere rotacionar tokens a cada 90 dias
3. **Backup:** Mantenha backup seguro deste documento
4. **Acesso:** Limite quem tem acesso a este documento

---

## 📞 CONTATOS E SUPORTE

### **GitHub:**
- Suporte: https://support.github.com
- Documentação: https://docs.github.com/en/authentication

### **Supabase:**
- Suporte: https://supabase.com/support
- Documentação: https://supabase.com/docs
- Discord: https://discord.supabase.com

---

**Última atualização:** 2024-11-21  
**Versão do documento:** 1.0  
**Arquivo local:** `.env.local` (não versionado)  
**Documentação:** `TOKENS_E_ACESSOS_COMPLETO.md`

---

## 🔄 HISTÓRICO DE ATUALIZAÇÕES

- **2024-11-21:** Documento criado com todos os tokens
- **2024-11-21:** Tokens obtidos e testados
- **2024-11-21:** Arquivo `.env.local` criado

---

**⚠️ LEMBRE-SE: Este documento contém informações sensíveis. Mantenha seguro!**

